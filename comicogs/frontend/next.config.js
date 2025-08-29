/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output for non-Vercel deployments
  output: process.env.VERCEL ? undefined : 'standalone',
  // Increase static generation timeout
  staticPageGenerationTimeout: 120,
  // Skip problematic static pages during build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Temporarily disable static optimization for problematic pages
  experimental: {
    outputFileTracingRoot: undefined,
    missingSuspenseWithCSRBailout: false,
  },
  images: {
    domains: ['placeholder.com', 'via.placeholder.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Optimize for production
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig