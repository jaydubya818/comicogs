"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface UploadDropProps {
  onUploadComplete?: (url: string, uploadId: string) => void;
  onUploadStart?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

export default function UploadDrop({
  onUploadComplete,
  onUploadStart,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB
  className = ""
}: UploadDropProps) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);
    onUploadStart?.();

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Get presigned URL
      setProgress(10);
      const presignResponse = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'demo@comicogs.com' // Demo auth
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          maxSizeBytes: maxSize
        })
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json();
        throw new Error(errorData.message || 'Failed to get upload URL');
      }

      const { upload } = await presignResponse.json();
      setProgress(30);

      // Upload directly (development mode)
      if (upload.uploadUrl) {
        // Development: direct upload to our server
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch(upload.uploadUrl, {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const result = await uploadResponse.json();
        setProgress(100);
        
        onUploadComplete?.(result.url, result.uploadId);
      } else {
        // Production: upload to S3/GCS
        const formData = new FormData();
        
        // Add all the fields from the presigned response
        Object.entries(upload.fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        
        // Add the file last
        formData.append('file', file);

        setProgress(50);

        const uploadResponse = await fetch(upload.url, {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        setProgress(100);
        
        // For S3, construct the public URL
        const publicUrl = `${upload.url}${upload.fields.key}`;
        onUploadComplete?.(publicUrl, 'cloud-upload');
      }

    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [maxSize, onUploadComplete, onUploadStart]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="mx-auto h-32 w-auto rounded-lg object-cover"
            />
            {uploading && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Uploading... {progress}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl text-gray-400">📁</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop an image here, or click to select
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PNG, JPG, WebP, GIF up to {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>
            
            <input
              type="file"
              accept={accept}
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
              className="mt-4"
            >
              {uploading ? 'Uploading...' : 'Select File'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {progress === 100 && !error && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
          ✅ Upload completed successfully!
        </div>
      )}
    </div>
  );
}
