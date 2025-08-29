/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // Enable static export
  images: { 
    unoptimized: true,        // Disable image optimization for static export
    domains: ['placeholder.com'] // Add any image domains you use
  },
  trailingSlash: true,        // Add trailing slashes for better static hosting
  basePath: process.env.NODE_ENV === 'production' ? '/comicogs' : '', // Adjust for your repo name
  assetPrefix: process.env.NODE_ENV === 'production' ? '/comicogs' : '',
  
  // Disable API routes for static export
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Environment variables for build
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
}

module.exports = nextConfig
