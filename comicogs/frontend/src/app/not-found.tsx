'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <AppShell
      pageTitle="Page Not Found"
      pageDescription="The page you're looking for doesn't exist"
      showBreadcrumbs={false}
    >
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-[120px] font-bold text-muted-foreground/20 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-lg text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button asChild size="lg">
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          
          <Button variant="outline" size="lg" asChild>
            <Link href="/search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Comics
            </Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 text-sm text-muted-foreground">
          <p className="mb-3">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/comics" 
              className="hover:text-primary transition-colors underline"
            >
              Browse Comics
            </Link>
            <Link 
              href="/marketplace" 
              className="hover:text-primary transition-colors underline"
            >
              Marketplace
            </Link>
            <Link 
              href="/collection" 
              className="hover:text-primary transition-colors underline"
            >
              My Collection
            </Link>
            <Link 
              href="/help" 
              className="hover:text-primary transition-colors underline"
            >
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}