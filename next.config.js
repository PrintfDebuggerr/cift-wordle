/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA ve performance ayarları
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Optimizasyon ayarları
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analizi için
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle size analizi
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }
    
    return config
  },

  // Headers optimizasyonu
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options', 
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

