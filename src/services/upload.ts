import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  SIGNED_URL_EXPIRES_IN,
  STORAGE_BUCKET,
  type UploadResult,
} from '@/types/upload';
import { log } from '@/lib/logger';

// ============================================================
// Validation
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
}

export async function validatePDF(file: File): Promise<ValidationError | null> {
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

  // Magic byte validation for PDF (%PDF-)
  try {
    const header = await file.slice(0, 4).arrayBuffer();
    const arr = new Uint8Array(header);
    // 0x25='%', 0x50='P', 0x44='D', 0x46='F'
    if (arr[0] !== 0x25 || arr[1] !== 0x50 || arr[2] !== 0x44 || arr[3] !== 0x46) {
      return {
        field: 'file',
        message: 'File appears to be corrupt or spoofed. Not a genuine PDF.',
      };
    }
  } catch (error) {
    return { field: 'file', message: 'Could not read file for security validation.' };
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

  log.debug('uploadToStorage: starting', { userId, storagePath, fileSizeBytes: file.size });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    log.error('uploadToStorage: failed', { userId, storagePath, error: error.message });
    return { storagePath: '', error: error.message };
  }

  log.info('uploadToStorage: success', { userId, storagePath });
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
  log.debug('getSignedUrl: generating', { storagePath, expiresIn });

  const { data, error } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    log.error('getSignedUrl: failed', { storagePath, error: error?.message });
    return { signedUrl: '', expiresAt: '', error: error?.message ?? 'Failed to generate URL' };
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  log.debug('getSignedUrl: success', { storagePath, expiresAt });
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
  log.debug('saveMetadata: inserting paper record', { userId, subjectId, title, storagePath });

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
    log.error('saveMetadata: DB insert failed', {
      userId,
      storagePath,
      error: error?.message,
    });
    return { paperId: null, error: error?.message ?? 'Failed to save metadata' };
  }

  log.info('saveMetadata: paper record created', { userId, paperId: data.id, storagePath });
  return { paperId: data.id, error: null };
}

// ============================================================
// Cleanup — used if DB insert fails after a successful storage upload
// ============================================================

export async function deleteFromStorage(
  adminClient: SupabaseClient,
  storagePath: string
): Promise<void> {
  log.info('deleteFromStorage: removing file', { storagePath });
  const { error } = await adminClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
  if (error) {
    log.error('deleteFromStorage: failed', { storagePath, error: error.message });
  } else {
    log.info('deleteFromStorage: success', { storagePath });
  }
}
