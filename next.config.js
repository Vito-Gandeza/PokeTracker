/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'znvwokdnmwbkuavsxqin.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },

  // Optimize performance
  poweredByHeader: false,
  reactStrictMode: true,

  // Configure caching and performance
  onDemandEntries: {
    // Keep pages in memory for 300 seconds (5 minutes)
    maxInactiveAge: 300 * 1000,
    // Have 5 pages in memory at most
    pagesBufferLength: 5,
  },

  // Configure build optimization
  swcMinify: true,

  // Configure runtime settings
  experimental: {
    // Optimize server components
    serverComponentsExternalPackages: [],
    // Optimize client-side navigation
    optimizeCss: true,
  },
};

module.exports = nextConfig;
