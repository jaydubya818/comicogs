"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Camera, Plus } from "lucide-react";

interface ImageUploadProps {
  onImagesChange?: (images: File[]) => void;
  maxImages?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  existingImages?: string[];
  className?: string;
}

export default function ImageUpload({
  onImagesChange,
  maxImages = 5,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  existingImages = [],
  className = ""
}: ImageUploadProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(existingImages);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    setError("");
    const newFiles: File[] = [];
    const newPreviews: string[] = [...previews];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        setError(`File ${file.name} is not a supported image type`);
        continue;
      }

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File ${file.name} is larger than ${maxSize}MB`);
        continue;
      }

      // Check max images
      if (newFiles.length + newPreviews.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        break;
      }

      newFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }

    if (newFiles.length > 0) {
      const updatedImages = [...images, ...newFiles];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);

    // If it's a new uploaded image (index >= existingImages.length)
    if (index >= existingImages.length) {
      const imageIndex = index - existingImages.length;
      const newImages = images.filter((_, i) => i !== imageIndex);
      setImages(newImages);
      onImagesChange?.(newImages);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
        }`}
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onClick={handleFileSelect}
      >
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Upload Comic Images</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to select images
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button type="button" variant="outline">
                <ImageIcon className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              <Button type="button" variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Maximum {maxImages} images • Up to {maxSize}MB each</div>
              <div>Supported formats: JPEG, PNG, WebP</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Image Previews */}
      {previews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded Images ({previews.length}/{maxImages})</CardTitle>
            <CardDescription>
              Drag images to reorder. Click the X to remove an image.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group aspect-[3/4] rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {index === 0 ? 'Cover' : `Image ${index + 1}`}
                  </div>
                </div>
              ))}
              
              {/* Add More Button */}
              {previews.length < maxImages && (
                <div 
                  className="aspect-[3/4] border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={handleFileSelect}
                >
                  <div className="text-center">
                    <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-xs text-muted-foreground">Add More</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
