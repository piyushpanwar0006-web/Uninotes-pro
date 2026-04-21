import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/types/api';
import {
  validatePDF,
  uploadToStorage,
  getSignedUrl,
  saveMetadata,
  deleteFromStorage,
} from '@/services/upload';

export const dynamic = 'force-dynamic';

// Zod schema for form-data fields
const uploadSchema = z.object({
  subjectId: z.string().uuid('subjectId must be a valid UUID'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string().max(1000).optional(),
});

/**
 * POST /api/upload
 *
 * Accepts multipart/form-data with fields:
 *   - file: PDF file (required)
 *   - subjectId: UUID of the subject (required)
 *   - title: Paper title (required)
 *   - description: Optional description
 *
 * Flow:
 *   1. Auth check (withAuth)
 *   2. Parse multipart body
 *   3. Validate form fields with Zod
 *   4. Validate file (type + size)
 *   5. Upload to Supabase Storage
 *   6. Save metadata to DB
 *   7. Generate signed URL
 *   8. Return result
 *
 * On DB failure after storage upload: cleanup the storage file.
 */
export const POST = withAuth(async (req: NextRequest, { user, supabase }) => {
  let storagePath: string | null = null;

  try {
    // 1. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    const rawFields = {
      subjectId: formData.get('subjectId'),
      title: formData.get('title'),
      description: formData.get('description'),
    };

    // 2. Validate file exists
    if (!file || !(file instanceof File)) {
      return errorResponse(
        'No file provided. Send a PDF as the "file" field in multipart/form-data.',
        400,
        'MISSING_FILE'
      );
    }

    // 3. Validate form fields with Zod
    const parsed = uploadSchema.safeParse({
      subjectId: rawFields.subjectId,
      title: rawFields.title,
      description: rawFields.description || undefined,
    });

    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0].message,
        400,
        'VALIDATION_ERROR'
      );
    }

    const { subjectId, title, description } = parsed.data;

    // 4. Validate the subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return errorResponse(
        'Subject not found. Make sure subjectId is valid.',
        404,
        'SUBJECT_NOT_FOUND'
      );
    }

    // 5. Validate PDF (type + size)
    const validationError = validatePDF(file);
    if (validationError) {
      return errorResponse(validationError.message, 400, 'INVALID_FILE');
    }

    // 6. Upload to Supabase Storage (admin client bypasses RLS)
    const adminClient = createAdminClient();
    const { storagePath: uploadedPath, error: storageError } =
      await uploadToStorage(adminClient, file, user.id);

    if (storageError || !uploadedPath) {
      return errorResponse(
        `Storage upload failed: ${storageError}`,
        500,
        'STORAGE_ERROR'
      );
    }

    // Track path for cleanup
    storagePath = uploadedPath;

    // 7. Save metadata to the papers table
    const { paperId, error: dbError } = await saveMetadata({
      supabase,
      subjectId,
      userId: user.id,
      title,
      storagePath: uploadedPath,
      sizeBytes: file.size,
      description,
    });

    if (dbError || !paperId) {
      // Clean up the storage file since DB insert failed
      await deleteFromStorage(adminClient, uploadedPath);
      return errorResponse(
        `Failed to save paper metadata: ${dbError}`,
        500,
        'DB_ERROR'
      );
    }

    // 8. Generate a 1-hour signed URL
    const { signedUrl, expiresAt, error: urlError } =
      await getSignedUrl(adminClient, uploadedPath);

    if (urlError || !signedUrl) {
      // Paper was saved — don't delete it. The signed URL can be regenerated.
      return errorResponse(
        'Upload succeeded but failed to generate access URL. Contact support.',
        500,
        'SIGNED_URL_ERROR'
      );
    }

    return successResponse(
      {
        paperId,
        signedUrl,
        expiresAt,
        fileName: file.name,
        sizeBytes: file.size,
      },
      201
    );
  } catch (err) {
    console.error('[POST /api/upload]', err);

    // If upload succeeded but something else crashed, clean up storage
    if (storagePath) {
      const adminClient = createAdminClient();
      await deleteFromStorage(adminClient, storagePath);
    }

    return errorResponse('Internal server error.', 500, 'INTERNAL_ERROR');
  }
});
