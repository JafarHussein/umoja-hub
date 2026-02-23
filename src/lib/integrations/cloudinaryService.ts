/**
 * Cloudinary image upload service.
 * Validates MIME type and file size before uploading.
 * Throws AppError with EXT_CLOUDINARY_* codes on failure.
 */

import { env } from '@/lib/env';
import { AppError, logger } from '@/lib/utils';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface IUploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

/**
 * Upload an image file to Cloudinary.
 * @param file - The file object (File API compatible)
 * @param folder - Cloudinary folder path e.g. 'umojahub/listings'
 */
export async function uploadImage(file: File, folder: string): Promise<IUploadResult> {
  // MIME type validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new AppError(
      'Only image files (JPG, PNG, WebP) are accepted.',
      400,
      'EXT_CLOUDINARY_INVALID_TYPE'
    );
  }

  // File size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError(
      'Image must be smaller than 5MB.',
      400,
      'EXT_CLOUDINARY_FILE_TOO_LARGE'
    );
  }

  const cloudName = env('CLOUDINARY_CLOUD_NAME');
  const apiKey = env('CLOUDINARY_API_KEY');
  const apiSecret = env('CLOUDINARY_API_SECRET');

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  // Cloudinary uses basic auth for direct API uploads
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('resource_type', 'image');

  try {
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorBody: unknown = await res.json();
      logger.error('cloudinaryService', 'Upload failed', { status: res.status, error: errorBody });
      throw new AppError(
        'Image upload failed. Please try again.',
        502,
        'EXT_CLOUDINARY_UPLOAD_FAILED'
      );
    }

    const data = (await res.json()) as {
      secure_url: string;
      public_id: string;
      format: string;
      bytes: number;
    };

    logger.info('cloudinaryService', 'Image uploaded', {
      publicId: data.public_id,
      bytes: data.bytes,
      folder,
    });

    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      bytes: data.bytes,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('cloudinaryService', 'Unexpected upload error', { error });
    throw new AppError(
      'Image upload failed. Please try again.',
      502,
      'EXT_CLOUDINARY_UPLOAD_FAILED'
    );
  }
}

/**
 * Delete an image from Cloudinary by public ID.
 * Non-blocking on failure — logs but does not throw.
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    const cloudName = env('CLOUDINARY_CLOUD_NAME');
    const apiKey = env('CLOUDINARY_API_KEY');
    const apiSecret = env('CLOUDINARY_API_SECRET');

    const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const formData = new FormData();
    formData.append('public_id', publicId);

    const res = await fetch(deleteUrl, {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
      body: formData,
    });

    if (!res.ok) {
      logger.warn('cloudinaryService', 'Image deletion failed', { publicId, status: res.status });
    }
  } catch (error) {
    logger.warn('cloudinaryService', 'Image deletion error', { publicId, error });
  }
}
