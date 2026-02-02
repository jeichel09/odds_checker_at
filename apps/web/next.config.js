/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // External logo sources
      'cdn.oddschecker.com',
      'logos.footystats.org',
      'upload.wikimedia.org',
      'logoeps.com',
      // CDN providers (for future use)
      'res.cloudinary.com',
      'images.unsplash.com',
    ],
    // Enable static imports from /public
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Image formats
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
