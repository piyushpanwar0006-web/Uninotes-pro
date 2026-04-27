import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/types/api';
import { log } from '@/lib/logger';
import { captureError, captureWarning } from '@/lib/sentry';
import { recordUpload } from '@/lib/metrics';
import { checkRateLimit } from '@/lib/rateLimit';
import { invalidatePapersCache } from '@/lib/cache';
import { revalidatePath } from 'next/cache';
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
  subjectId: z.string().uuid('subjectId must be a valid UUID').optional(),
  branch: z.string().optional(),
  semester: z.coerce.number().int().min(1).max(10).optional(),
  subjectName: z.string().min(1, 'Subject name is required').optional(),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string().max(1000).optional(),
}).refine(data => data.subjectId || (data.branch && data.semester !== undefined && data.subjectName), {
  message: 'Either subjectId or (branch, semester, subjectName) must be provided',
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
export const POST = withLogging(
  withAuth(async (req: NextRequest, { user, supabase }) => {
    let storagePath: string | null = null;
    const endpoint = '/api/upload';

    try {
      // 1. Parse multipart form data
      const formData = await req.formData();
      const file = formData.get('file');
      const rawFields = {
        subjectId: formData.get('subjectId'),
        branch: formData.get('branch'),
        semester: formData.get('semester'),
        subjectName: formData.get('subjectName'),
        title: formData.get('title'),
        description: formData.get('description'),
      };

      // 2. Validate file exists
      if (!file || !(file instanceof File)) {
        log.warn('Upload attempt with no file', { userId: user.id, endpoint });
        return errorResponse(
          'No file provided. Send a PDF as the "file" field in multipart/form-data.',
          400,
          'MISSING_FILE'
        );
      }

      // 3. Validate form fields with Zod
      const parsed = uploadSchema.safeParse({
        subjectId: rawFields.subjectId || undefined,
        branch: rawFields.branch || undefined,
        semester: rawFields.semester || undefined,
        subjectName: rawFields.subjectName || undefined,
        title: rawFields.title,
        description: rawFields.description || undefined,
      });

      if (!parsed.success) {
        log.warn('Upload validation failed', {
          userId: user.id,
          endpoint,
          error: parsed.error.issues[0].message,
        });
        return errorResponse(
          parsed.error.issues[0].message,
          400,
          'VALIDATION_ERROR'
        );
      }

      const { subjectId: explicitSubjectId, branch, semester, subjectName, title, description } = parsed.data;
      const adminClient = createAdminClient();
      let resolvedSubjectId = explicitSubjectId;

      // 4. Validate or resolve the subject
      if (!resolvedSubjectId) {
        // Resolve subject by upserting
        const { data: subjectData, error: resolveError } = await adminClient
          .from('subjects')
          .upsert(
            { branch, semester, name: subjectName },
            { onConflict: 'branch,semester,name', ignoreDuplicates: false }
          )
          .select('id')
          .single();

        if (resolveError || !subjectData) {
          log.warn('Upload: subject resolution failed', { userId: user.id, endpoint, branch, semester, subjectName });
          return errorResponse(
            'Failed to resolve subject. Check branch, semester, and name parameters.',
            400,
            'SUBJECT_RESOLUTION_ERROR'
          );
        }
        resolvedSubjectId = subjectData.id;
      } else {
        // Validate explicit subjectId exists
        const { data: subject, error: subjectError } = await supabase
          .from('subjects')
          .select('id')
          .eq('id', resolvedSubjectId)
          .single();

        if (subjectError || !subject) {
          log.warn('Upload: subject not found', { userId: user.id, endpoint, subjectId: resolvedSubjectId });
          return errorResponse(
            'Subject not found. Make sure subjectId is valid.',
            404,
            'SUBJECT_NOT_FOUND'
          );
        }
      }

      // 4.1 Type-safety guard
      if (!resolvedSubjectId) {
        return errorResponse('Failed to resolve subject ID.', 500, 'SUBJECT_RESOLUTION_ERROR');
      }

      // 5. Validate PDF (type + size)
      const validationError = await validatePDF(file);
      if (validationError) {
        log.warn('Upload: invalid PDF', {
          userId: user.id,
          endpoint,
          error: validationError.message,
          fileType: file.type,
          fileSizeBytes: file.size,
        });
        return errorResponse(validationError.message, 400, 'INVALID_FILE');
      }

      log.info('Starting PDF upload to storage', {
        userId: user.id,
        endpoint,
        subjectId: resolvedSubjectId,
        title,
        fileSizeBytes: file.size,
      });

      // 6. Upload to Supabase Storage (admin client bypasses RLS)
      const { storagePath: uploadedPath, error: storageError } =
        await uploadToStorage(adminClient, file, user.id);

      if (storageError || !uploadedPath) {
        log.error('Storage upload failed', {
          userId: user.id,
          endpoint,
          error: storageError ?? undefined,
        });
        captureError(new Error(storageError ?? 'Storage upload failed'), {
          userId: user.id,
          endpoint,
          errorCode: 'STORAGE_ERROR',
        });
        recordUpload(false);
        return errorResponse(
          `Storage upload failed: ${storageError}`,
          500,
          'STORAGE_ERROR'
        );
      }

      // Track path for cleanup
      storagePath = uploadedPath;

      log.info('Storage upload succeeded', {
        userId: user.id,
        endpoint,
        storagePath: uploadedPath,
      });

      // 7. Save metadata to the papers table
      const { paperId, error: dbError } = await saveMetadata({
        supabase,
        subjectId: resolvedSubjectId,
        userId: user.id,
        title,
        storagePath: uploadedPath,
        sizeBytes: file.size,
        description,
      });

      if (dbError || !paperId) {
        log.error('DB metadata save failed — cleaning up storage file', {
          userId: user.id,
          endpoint,
          storagePath: uploadedPath,
          error: dbError ?? undefined,
        });
        captureError(new Error(dbError ?? 'DB save failed'), {
          userId: user.id,
          endpoint,
          errorCode: 'DB_ERROR',
        });
        // Clean up the storage file since DB insert failed
        await deleteFromStorage(adminClient, uploadedPath);
        recordUpload(false);
        return errorResponse(
          `Failed to save paper metadata: ${dbError}`,
          500,
          'DB_ERROR'
        );
      }

      log.info('Paper metadata saved to DB', {
        userId: user.id,
        endpoint,
        paperId,
        storagePath: uploadedPath,
      });

      // 8. Generate a 1-hour signed URL
      const { signedUrl, expiresAt, error: urlError } =
        await getSignedUrl(adminClient, uploadedPath);

      if (urlError || !signedUrl) {
        // Paper was saved — don't delete it. The signed URL can be regenerated.
        log.warn('Upload succeeded but signed URL generation failed', {
          userId: user.id,
          endpoint,
          paperId,
          error: urlError ?? undefined,
        });
        captureWarning('Signed URL generation failed after successful upload', {
          userId: user.id,
          endpoint,
          errorCode: 'SIGNED_URL_ERROR',
        });
        recordUpload(true); // upload itself succeeded
        return errorResponse(
          'Upload succeeded but failed to generate access URL. Contact support.',
          500,
          'SIGNED_URL_ERROR'
        );
      }

      log.info('Upload complete', {
        userId: user.id,
        endpoint,
        paperId,
        fileSizeBytes: file.size,
      });

      recordUpload(true);
      await invalidatePapersCache();
      revalidatePath('/notes');
      revalidatePath('/subjects/[subjectId]', 'page');

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
      const errorMessage = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;

      log.error('POST /api/upload — unhandled exception', {
        userId: user.id,
        endpoint,
        error: errorMessage,
        stack,
      });

      captureError(err, {
        userId: user.id,
        endpoint,
        errorCode: 'INTERNAL_ERROR',
      });

      // If upload succeeded but something else crashed, clean up storage
      if (storagePath) {
        const adminClient = createAdminClient();
        await deleteFromStorage(adminClient, storagePath);
        log.info('Storage cleanup complete after crash', { storagePath, userId: user.id });
      }

      recordUpload(false);
      return errorResponse('Internal server error.', 500, 'INTERNAL_ERROR');
    }
  }),
  '/api/upload'
);
