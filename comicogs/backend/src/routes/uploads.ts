import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { getSignedUrl, getUploadMetadata, completeUpload } from "../services/storage";
import { z } from "zod";
import { rateLimit } from "../middleware/cache";

const router = Router();

const PresignedUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
  maxSizeBytes: z.number().positive().max(10 * 1024 * 1024).optional()
});

// Rate limit uploads more strictly
const uploadRateLimit = rateLimit(10, 60_000); // 10 uploads per minute

// POST /api/uploads/presign - Generate presigned upload URL
router.post("/presign", requireAuth, uploadRateLimit, asyncHandler(async (req, res) => {
  const data = PresignedUploadSchema.parse(req.body);

  try {
    const { url, fields, uploadUrl } = await getSignedUrl({
      filename: data.filename,
      contentType: data.contentType,
      maxSizeBytes: data.maxSizeBytes
    });

    req.logger.info({
      userId: req.user!.id,
      filename: data.filename,
      contentType: data.contentType,
      uploadUrl
    }, 'Generated presigned upload URL');

    res.json({
      success: true,
      upload: {
        url,
        fields,
        uploadUrl // For development direct upload
      }
    });
  } catch (error: any) {
    req.logger.error({
      error: error.message,
      userId: req.user!.id,
      filename: data.filename
    }, 'Failed to generate presigned URL');
    
    throw new AppError(error.message, 400);
  }
}));

// POST /api/uploads/direct/:uploadId - Direct upload for development
router.post("/direct/:uploadId", asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  
  // Check if upload exists
  const metadata = getUploadMetadata(uploadId);
  if (!metadata) {
    throw new AppError('Invalid upload ID', 404);
  }

  // In development, we'll simulate storing the file
  // In production, this endpoint wouldn't exist as uploads go directly to S3/GCS
  const publicUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/uploads/serve/${uploadId}`;
  
  completeUpload(uploadId, publicUrl);

  req.logger.info({
    uploadId,
    publicUrl,
    filename: metadata.filename
  }, 'Direct upload completed (development)');

  res.json({
    success: true,
    url: publicUrl,
    uploadId
  });
}));

// GET /api/uploads/serve/:uploadId - Serve uploaded files (development only)
router.get("/serve/:uploadId", asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  
  const metadata = getUploadMetadata(uploadId);
  if (!metadata) {
    throw new AppError('File not found', 404);
  }

  // In development, return a placeholder image
  // In production, this would redirect to the actual file URL
  const placeholderSvg = `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
        Comic Cover
        ${metadata.filename}
      </text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  res.send(placeholderSvg);
}));

export default router;
