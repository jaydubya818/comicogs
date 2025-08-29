import crypto from 'crypto';
import { logger } from '../middleware/logger';

// Simple in-memory storage for development
// In production, replace with S3/GCS implementation
const uploads = new Map<string, { url: string; filename: string; contentType: string }>();

export interface PresignedUploadData {
  url: string;
  fields: Record<string, string>;
  uploadUrl?: string;
}

export async function getSignedUrl({
  filename,
  contentType,
  maxSizeBytes = 10 * 1024 * 1024 // 10MB default
}: {
  filename: string;
  contentType: string;
  maxSizeBytes?: number;
}): Promise<PresignedUploadData> {
  // Validate file type
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif'
  ];

  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Unsupported file type: ${contentType}`);
  }

  // Generate unique upload ID
  const uploadId = crypto.randomUUID();
  const key = `uploads/${uploadId}/${filename}`;
  
  if (process.env.NODE_ENV === 'production') {
    // In production, use actual cloud storage
    // This is a placeholder for S3/GCS implementation
    return getS3SignedUrl({ key, contentType, maxSizeBytes });
  } else {
    // Development: simulate presigned URL
    const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/uploads/direct/${uploadId}`;
    
    // Store upload metadata
    uploads.set(uploadId, {
      url: uploadUrl,
      filename,
      contentType
    });

    logger.info({
      uploadId,
      filename,
      contentType,
      maxSizeBytes
    }, 'Generated presigned upload URL for development');

    return {
      url: uploadUrl,
      fields: {
        'Content-Type': contentType,
        'Content-Length-Range': `0,${maxSizeBytes}`,
        'x-upload-id': uploadId
      },
      uploadUrl
    };
  }
}

async function getS3SignedUrl({
  key,
  contentType,
  maxSizeBytes
}: {
  key: string;
  contentType: string;
  maxSizeBytes: number;
}): Promise<PresignedUploadData> {
  // This would use AWS SDK in production
  // For now, return a placeholder structure
  
  const bucket = process.env.S3_BUCKET || 'comicogs-uploads';
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // In real implementation, you'd use:
  // const s3 = new AWS.S3();
  // const signedUrl = await s3.createPresignedPost({...});
  
  logger.warn('S3 integration not implemented - using placeholder');
  
  return {
    url: `https://${bucket}.s3.${region}.amazonaws.com/`,
    fields: {
      'key': key,
      'Content-Type': contentType,
      'Content-Length-Range': `0,${maxSizeBytes}`,
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-credential': 'placeholder',
      'x-amz-date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ''),
      'policy': 'placeholder-policy',
      'x-amz-signature': 'placeholder-signature'
    }
  };
}

export function getUploadMetadata(uploadId: string) {
  return uploads.get(uploadId);
}

export function completeUpload(uploadId: string, publicUrl: string) {
  const metadata = uploads.get(uploadId);
  if (metadata) {
    uploads.set(uploadId, { ...metadata, url: publicUrl });
    logger.info({
      uploadId,
      publicUrl
    }, 'Upload completed');
  }
  return metadata;
}
