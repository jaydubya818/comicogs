"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  backgroundImage?: string;
  className?: string;
}

export default function Hero({
  title = "Your Comic Universe,",
  subtitle = "Organized.",
  description = "Discover, track, and manage your comic book collection with Comicogs. From rare finds to daily reads, we've got you covered.",
  primaryCtaText = "Explore Your Vault",
  primaryCtaHref = "/vault",
  secondaryCtaText = "Try Comic DNA",
  secondaryCtaHref = "/comic-dna",
  onPrimaryClick,
  onSecondaryClick,
  backgroundImage,
  className = "",
}: HeroProps) {
  return (
    <section className={`relative min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 hero-gradient overflow-hidden">
        {backgroundImage && (
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover opacity-20"
            priority
            sizes="100vw"
          />
        )}
        
        {/* Comic burst decorations */}
        <div className="absolute top-20 left-10 comic-burst w-16 h-16 opacity-30 motion-safe-fade-in"></div>
        <div className="absolute top-40 right-20 comic-burst w-12 h-12 opacity-20 motion-safe-scale-in" style={{ animationDelay: "200ms" }}></div>
        <div className="absolute bottom-32 left-1/4 comic-burst w-20 h-20 opacity-25 motion-safe-fade-in" style={{ animationDelay: "400ms" }}></div>
        
        {/* Floating comic elements */}
        <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-primary/20 rounded-full motion-safe-scale-in" style={{ animationDelay: "100ms" }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-secondary/20 rounded-full motion-safe-scale-in" style={{ animationDelay: "300ms" }}></div>
        <div className="absolute top-1/2 left-1/6 w-4 h-4 bg-accent/20 rounded-full motion-safe-scale-in" style={{ animationDelay: "500ms" }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        
        {/* Headlines */}
        <div className="space-y-4 motion-safe-fade-in">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground">
            <span className="block">{title}</span>
            <span className="block text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {subtitle}
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 motion-safe-scale-in" style={{ animationDelay: "200ms" }}>
          <Button
            size="lg"
            className="text-base px-8 py-6 h-auto"
            onClick={onPrimaryClick}
            asChild={!onPrimaryClick}
          >
            {onPrimaryClick ? (
              primaryCtaText
            ) : (
              <Link href={primaryCtaHref || "/vault"} prefetch>
                {primaryCtaText}
              </Link>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="text-base px-8 py-6 h-auto"
            onClick={onSecondaryClick}
            asChild={!onSecondaryClick}
          >
            {onSecondaryClick ? (
              secondaryCtaText
            ) : (
              <Link href={secondaryCtaHref || "/comic-dna"} prefetch>
                {secondaryCtaText}
              </Link>
            )}
          </Button>
        </div>

        {/* Features/Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 motion-safe-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="space-y-2">
            <div className="text-3xl sm:text-4xl font-bold text-primary">500K+</div>
            <div className="text-sm text-muted-foreground">Comics Cataloged</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl sm:text-4xl font-bold text-secondary">50K+</div>
            <div className="text-sm text-muted-foreground">Active Collectors</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl sm:text-4xl font-bold text-accent">1M+</div>
            <div className="text-sm text-muted-foreground">Marketplace Trades</div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-8 pt-12 opacity-60 motion-safe-fade-in" style={{ animationDelay: "600ms" }}>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span>Trusted by collectors worldwide</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>100% secure transactions</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            <span>Expert authenticity verification</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-gradient {
          background: linear-gradient(
            135deg,
            hsl(var(--primary) / 0.05) 0%,
            hsl(var(--background)) 50%,
            hsl(var(--secondary) / 0.03) 100%
          );
        }

        .comic-burst {
          background: radial-gradient(
            circle,
            hsl(var(--accent) / 0.3) 0%,
            hsl(var(--accent) / 0.1) 40%,
            transparent 70%
          );
          border-radius: 50%;
          position: relative;
        }

        .comic-burst::before {
          content: "";
          position: absolute;
          inset: 10%;
          background: radial-gradient(
            circle,
            hsl(var(--primary) / 0.2) 0%,
            transparent 50%
          );
          border-radius: 50%;
        }

        @media (prefers-reduced-motion: no-preference) {
          .motion-safe-fade-in {
            animation: fade-in 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          
          .motion-safe-scale-in {
            animation: scale-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
}
