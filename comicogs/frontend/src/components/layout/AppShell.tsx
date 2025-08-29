'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import Navbar from '@/components/ui/patterns/Navbar'
import { Breadcrumbs } from './Breadcrumbs'

interface AppShellProps {
  children: React.ReactNode
  className?: string
  showHeader?: boolean
  showBreadcrumbs?: boolean
  showFooter?: boolean
  fullWidth?: boolean
  pageTitle?: string
  pageDescription?: string
}

export function AppShell({
  children,
  className,
  showHeader = true,
  showBreadcrumbs = true,
  showFooter = true,
  fullWidth = false,
  pageTitle,
  pageDescription,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {showHeader && (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Navbar />
        </header>
      )}

      {/* Main content area */}
      <main className="flex-1 flex flex-col">
        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <div className={cn(
            'border-b border-border/40 bg-muted/30',
            !fullWidth && 'container mx-auto'
          )}>
            <div className="py-3">
              <Breadcrumbs />
            </div>
          </div>
        )}

        {/* Page header */}
        {(pageTitle || pageDescription) && (
          <div className={cn(
            'border-b border-border/40 bg-background',
            !fullWidth && 'container mx-auto'
          )}>
            <div className="py-6 space-y-2">
              {pageTitle && (
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {pageTitle}
                </h1>
              )}
              {pageDescription && (
                <p className="text-lg text-muted-foreground">
                  {pageDescription}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Page content */}
        <div className={cn(
          'flex-1',
          fullWidth ? 'w-full' : 'container mx-auto',
          className
        )}>
          <div className="py-6">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="mt-auto border-t border-border/40 bg-muted/30">
          <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Platform</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Marketplace
                    </a>
                  </li>
                  <li>
                    <a href="/collection" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Collection
                    </a>
                  </li>
                  <li>
                    <a href="/wantlist" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Wantlist
                    </a>
                  </li>
                  <li>
                    <a href="/grading" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Grading
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Community</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="/forum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Forum
                    </a>
                  </li>
                  <li>
                    <a href="/guides" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Guides
                    </a>
                  </li>
                  <li>
                    <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Support
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Resources</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="/api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      API Docs
                    </a>
                  </li>
                  <li>
                    <a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Privacy
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Connect</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="https://twitter.com/comicogs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/comicogs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a href="https://discord.gg/comicogs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Discord
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  © 2024 Comicogs. All rights reserved.
                </p>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                  <span className="text-xs text-muted-foreground">
                    Built with Next.js, Tailwind CSS, and shadcn/ui
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

// Layout variants for different page types
export function MarketplaceShell({ children, ...props }: Omit<AppShellProps, 'pageTitle'>) {
  return (
    <AppShell
      pageTitle="Marketplace"
      pageDescription="Discover and trade comic books with collectors worldwide"
      {...props}
    >
      {children}
    </AppShell>
  )
}

export function CollectionShell({ children, ...props }: Omit<AppShellProps, 'pageTitle'>) {
  return (
    <AppShell
      pageTitle="Collection"
      pageDescription="Organize and manage your comic book collection"
      {...props}
    >
      {children}
    </AppShell>
  )
}

export function AdminShell({ children, ...props }: Omit<AppShellProps, 'showFooter'>) {
  return (
    <AppShell
      showFooter={false}
      className="bg-muted/30"
      {...props}
    >
      <div className="bg-background rounded-lg shadow-sm border border-border p-6">
        {children}
      </div>
    </AppShell>
  )
}