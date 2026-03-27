// Upload-specific types

export interface UploadResult {
  paperId: string;
  signedUrl: string;
  expiresAt: string; // ISO 8601
  fileName: string;
  sizeBytes: number;
}

export interface UploadValidationError {
  field: 'file' | 'subjectId' | 'type' | 'size';
  message: string;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = ['application/pdf'] as const;
export const SIGNED_URL_EXPIRES_IN = 3600; // 1 hour in seconds
export const STORAGE_BUCKET = 'papers';
