import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  SIGNED_URL_EXPIRES_IN,
  STORAGE_BUCKET,
  type UploadResult,
} from '@/types/upload';

// ============================================================
// Validation
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
}

export function validatePDF(file: File): ValidationError | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      field: 'file',
      message: `Only PDF files are allowed. Received: ${file.type || 'unknown'}`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      field: 'file',
      message: `File size exceeds the 10MB limit. Your file is ${sizeMB}MB.`,
    };
  }

  if (file.size === 0) {
    return { field: 'file', message: 'File is empty.' };
  }

  return null;
}

// ============================================================
// Storage Upload
// ============================================================

/**
 * Uploads a validated PDF to Supabase Storage.
 * Uses the admin client (bypasses RLS) for reliable uploads.
 * Storage path: papers/{userId}/{uuid}.pdf
 */
export async function uploadToStorage(
  adminClient: SupabaseClient,
  file: File,
  userId: string
): Promise<{ storagePath: string; error: string | null }> {
  const fileId = uuidv4();
  const storagePath = `${userId}/${fileId}.pdf`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    return { storagePath: '', error: error.message };
  }

  return { storagePath, error: null };
}

// ============================================================
// Signed URL Generation
// ============================================================

/**
 * Generates a time-limited signed URL for a private storage object.
 * Expires in 1 hour by default.
 */
export async function getSignedUrl(
  adminClient: SupabaseClient,
  storagePath: string,
  expiresIn = SIGNED_URL_EXPIRES_IN
): Promise<{ signedUrl: string; expiresAt: string; error: string | null }> {
  const { data, error } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    return { signedUrl: '', expiresAt: '', error: error?.message ?? 'Failed to generate URL' };
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  return { signedUrl: data.signedUrl, expiresAt, error: null };
}

// ============================================================
// Database Metadata
// ============================================================

interface SaveMetadataParams {
  supabase: SupabaseClient;
  subjectId: string;
  userId: string;
  title: string;
  storagePath: string;
  sizeBytes: number;
  description?: string;
}

export async function saveMetadata({
  supabase,
  subjectId,
  userId,
  title,
  storagePath,
  sizeBytes,
  description,
}: SaveMetadataParams): Promise<{ paperId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('papers')
    .insert({
      subject_id: subjectId,
      uploaded_by: userId,
      title,
      description: description ?? null,
      storage_path: storagePath,
      size_bytes: sizeBytes,
      status: 'ready',
    })
    .select('id')
    .single();

  if (error || !data) {
    return { paperId: null, error: error?.message ?? 'Failed to save metadata' };
  }

  return { paperId: data.id, error: null };
}

// ============================================================
// Cleanup — used if DB insert fails after a successful storage upload
// ============================================================

export async function deleteFromStorage(
  adminClient: SupabaseClient,
  storagePath: string
): Promise<void> {
  await adminClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
}
