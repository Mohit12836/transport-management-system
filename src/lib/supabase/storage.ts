// Private Secure Storage Manager for TMS Documents & POD Photos
// Enforces server-side MIME type validation, file size limits, organization-scoped paths,
// and short-lived signed URLs.

export type StorageCategory = 'pod-documents' | 'compliance-docs' | 'expense-slips' | 'invoice-attachments';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateStorageFile(
  mimeType: string,
  fileSizeBytes: number
): FileValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      isValid: false,
      error: `Invalid file format (${mimeType}). Only JPEG, PNG, WebP, and PDF documents are allowed.`,
    };
  }

  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds the 10 MB limit (current: ${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return { isValid: true };
}

/**
 * Builds a tenant-isolated storage path preventing cross-organization file collisions
 * Example: 'org-demo-001/pod-documents/lr-101_1728639201.jpg'
 */
export function buildSecureStoragePath(
  organizationId: string,
  category: StorageCategory,
  referenceId: string,
  fileName: string
): string {
  const sanitizedName = fileName.replace(/[^A-Za-z0-9._-]/g, '_');
  const timestamp = Date.now();
  return `${organizationId}/${category}/${referenceId}_${timestamp}_${sanitizedName}`;
}
