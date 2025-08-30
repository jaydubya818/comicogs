"use client";

import Image from "next/image";
import { Heart, Eye, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListingCardProps {
  id?: string;
  title?: string;
  series?: string;
  issue?: string;
  publisher?: string;
  grade?: string;
  price?: number;
  originalPrice?: number;
  coverImage?: string;
  sellerName?: string;
  sellerRating?: number;
  condition?: string;
  isWishlisted?: boolean;
  viewCount?: number;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  onView?: () => void;
  className?: string;
}

export default function ListingCard({
  id = "listing-1",
  title = "Amazing Spider-Man",
  series = "Amazing Spider-Man",
  issue = "#1",
  publisher = "Marvel Comics",
  grade = "9.8",
  price = 2500,
  originalPrice,
  coverImage = "",
  sellerName = "ComicVault Pro",
  sellerRating = 4.9,
  condition = "Near Mint",
  isWishlisted = false,
  viewCount = 245,
  onAddToCart,
  onToggleWishlist,
  onView,
  className = "",
}: ListingCardProps) {
  const handleCardClick = () => {
    onView?.();
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart();
    } else {
      // Default behavior: redirect to checkout
      window.location.href = `/checkout?item=${id}`;
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist?.();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const discountPercentage = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  return (
    <div 
      className={`group relative bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer motion-safe-scale-in ${className}`}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <Image
          src={coverImage}
          alt={`${title} ${issue} cover`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        
        {/* Grade Badge */}
        {grade && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 text-xs font-bold rounded">
            {grade}
          </div>
        )}
        
        {/* Discount Badge */}
        {discountPercentage && (
          <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 text-xs font-bold rounded">
            -{discountPercentage}%
          </div>
        )}
        
        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 ${discountPercentage ? 'top-10' : ''} w-8 h-8 ${
            isWishlisted 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-white/80 hover:text-white'
          } bg-black/20 hover:bg-black/40 backdrop-blur-sm`}
          onClick={handleWishlistClick}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          <span className="sr-only">
            {isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          </span>
        </Button>

        {/* View Count */}
        {viewCount && (
          <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-white/80 text-xs bg-black/20 backdrop-blur-sm px-2 py-1 rounded">
            <Eye className="w-3 h-3" />
            <span>{viewCount}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Issue */}
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1">
            {title} {issue}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {publisher} • {condition}
          </p>
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                {sellerName.charAt(0)}
              </span>
            </div>
            <span className="text-muted-foreground line-clamp-1">
              {sellerName}
            </span>
          </div>
          
          {sellerRating && (
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                {sellerRating}
              </span>
            </div>
          )}
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold text-foreground">
                {formatPrice(price)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleCartClick}
            className="flex items-center space-x-1"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Buy Now</span>
          </Button>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}
