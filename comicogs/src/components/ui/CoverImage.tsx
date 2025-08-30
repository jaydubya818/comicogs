import Image from "next/image";
import { useState } from "react";

interface CoverImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export default function CoverImage({ 
  src, 
  alt, 
  width = 320, 
  height = 480, 
  className = "",
  priority = false,
  sizes = `${width}px`
}: CoverImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Placeholder for when image fails to load
  const PlaceholderImage = () => (
    <div 
      className={`
        flex items-center justify-center bg-gray-100 border-2 border-gray-200 rounded-md
        ${className}
      `}
      style={{ width, height }}
    >
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2">📚</div>
        <div className="text-sm font-medium">Comic Cover</div>
        <div className="text-xs mt-1">Image not available</div>
      </div>
    </div>
  );

  // Loading placeholder
  const LoadingImage = () => (
    <div 
      className={`
        animate-pulse bg-gray-200 rounded-md
        ${className}
      `}
      style={{ width, height }}
    />
  );

  if (imageError) {
    return <PlaceholderImage />;
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-md bg-gray-100 ${className}`}
      style={{ width, height }}
    >
      {imageLoading && <LoadingImage />}
      
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`
          object-cover transition-opacity duration-200
          ${imageLoading ? 'opacity-0' : 'opacity-100'}
        `}
        onError={handleImageError}
        onLoad={handleImageLoad}
        // Optimize for comic covers (typically portrait orientation)
        style={{
          objectPosition: 'center top'
        }}
      />
      
      {/* Optional overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200" />
    </div>
  );
}
