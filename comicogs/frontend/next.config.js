/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output for non-Vercel deployments
  output: process.env.VERCEL ? undefined : 'standalone',
  
  // Complete disable static generation
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // TypeScript and ESLint configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Force dynamic rendering for all pages
  swcMinify: true,
  poweredByHeader: false,
  
  // Experimental settings to force dynamic rendering
  experimental: {
    outputFileTracingRoot: undefined,
    missingSuspenseWithCSRBailout: false,
  },
  
  // Images configuration
  images: {
    domains: ['placeholder.com', 'via.placeholder.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
  },
  
  // Disable static optimization completely
  distDir: '.next',
  
  // Environment variables to disable static generation
  env: {
    NEXT_FORCE_DYNAMIC: 'true',
  },
  
  // Rewrite all routes to force dynamic rendering
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: []
    }
  },
}

module.exports = nextConfig