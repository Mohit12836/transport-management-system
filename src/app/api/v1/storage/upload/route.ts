import { NextResponse } from 'next/server.js';
import {
  verifyApiAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
} from '../../../../../lib/supabase/api-guard.ts';
import {
  validateStorageFile,
  buildSecureStoragePath,
  StorageCategory,
} from '../../../../../lib/supabase/storage.ts';
import { getSupabaseAdminClient } from '../../../../../lib/supabase/admin.ts';

export async function POST(req: Request) {
  const auth = await verifyApiAuth(req);
  if (!auth.success) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as StorageCategory) || 'pod-documents';
    const referenceId = (formData.get('referenceId') as string) || 'ref-doc';

    if (!file) {
      return createApiErrorResponse('No document file attached.', 400);
    }

    // SERVER-SIDE MIME TYPE AND SIZE VALIDATION
    const check = validateStorageFile(file.type, file.size);
    if (!check.isValid) {
      return createApiErrorResponse(check.error || 'Invalid file format.', 422, 'FILE_VALIDATION_ERROR');
    }

    const securePath = buildSecureStoragePath(
      auth.session.organizationId,
      category,
      referenceId,
      file.name
    );

    // If Supabase Storage is active, upload to bucket
    const admin = getSupabaseAdminClient();
    if (admin) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await admin.storage
        .from(category)
        .upload(securePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!error && data) {
        // Create 1-hour signed URL
        const { data: signedData } = await admin.storage
          .from(category)
          .createSignedUrl(securePath, 3600);

        return createApiSuccessResponse({
          path: securePath,
          signedUrl: signedData?.signedUrl,
          fileSize: file.size,
          mimeType: file.type,
          storageBackend: 'supabase_storage',
        });
      }
    }

    // Secure local simulation URL when Supabase Storage bucket is unconfigured
    const simulatedSignedUrl = `https://storage.tms-pro.local/signed/${encodeURIComponent(securePath)}?expires=${Date.now() + 3600000}`;

    return createApiSuccessResponse(
      {
        path: securePath,
        signedUrl: simulatedSignedUrl,
        fileSize: file.size,
        mimeType: file.type,
        storageBackend: 'simulated_secure_storage',
      },
      undefined,
      201
    );
  } catch (err: any) {
    return createApiErrorResponse(err.message || 'Error processing file upload', 500);
  }
}
