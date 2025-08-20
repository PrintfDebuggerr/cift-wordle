// next.config.js
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

// public/manifest.json
{
  "name": "Çift Wordle - 2 Kişilik Kelime Oyunu",
  "short_name": "Çift Wordle",
  "description": "2 kişilik online Türkçe kelime oyunu. Arkadaşınla yarış!",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f23",
  "theme_color": "#6c5ce7",
  "orientation": "portrait",
  "categories": ["games", "entertainment", "social"],
  "lang": "tr",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png", 
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128", 
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Ana sayfa - Desktop"
    },
    {
      "src": "/screenshots/mobile-1.png", 
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Ana sayfa - Mobil"
    }
  ],
  "shortcuts": [
    {
      "name": "Hızlı Oyun",
      "short_name": "Hızlı",
      "description": "Hızlıca bir oyun başlat",
      "url": "/?quick=true",
      "icons": [
        {
          "src": "/icons/shortcut-quick.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}

// public/sw.js - Service Worker
const CACHE_NAME = 'cift-wordle-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Cache stratejileri
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first', 
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API istekleri için network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static dosyalar için cache-first
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Diğer istekler için stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request))
})

// Cache stratejisi fonksiyonları
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Cache first fallback:', error)
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request)

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME)
      cache.then((c) => c.put(request, networkResponse.clone()))
    }
    return networkResponse
  })

  return cachedResponse || fetchPromise
}

function isStaticAsset(request) {
  return request.destination === 'image' ||
         request.destination === 'script' ||
         request.destination === 'style' ||
         request.url.includes('/_next/static/')
}

// app/layout.tsx - PWA entegrasyonu
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Çift Wordle - 2 Kişilik Kelime Oyunu',
  description: '2 kişilik online Türkçe kelime oyunu. Arkadaşınla yarış!',
  keywords: ['wordle', 'kelime oyunu', 'türkçe', '2 kişilik', 'online'],
  authors: [{ name: 'Çift Wordle Team' }],
  creator: 'Çift Wordle Team',
  publisher: 'Çift Wordle',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Çift Wordle',
  },
  openGraph: {
    type: 'website',
    siteName: 'Çift Wordle',
    title: 'Çift Wordle - 2 Kişilik Kelime Oyunu',
    description: '2 kişilik online Türkçe kelime oyunu. Arkadaşınla yarış!',
    url: 'https://cift-wordle.vercel.app',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Çift Wordle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Çift Wordle - 2 Kişilik Kelime Oyunu', 
    description: '2 kişilik online Türkçe kelime oyunu. Arkadaşınla yarış!',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#6c5ce7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        {/* PWA meta tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Çift Wordle" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6c5ce7" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        {children}
        <PWAPrompt />
      </body>
    </html>
  )
}

// components/pwa-prompt.tsx
"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Kullanıcı daha önce reddetmemişse göster
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Service Worker kaydı
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    console.log(`User response to install prompt: ${outcome}`)
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📱</div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm mb-1">
                  Uygulamayı Yükle
                </h3>
                <p className="text-gray-400 text-xs mb-3">
                  Çift Wordle'u telefon ekranına ekle ve daha hızlı erişim sağla!
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="text-xs"
                  >
                    Yükle
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs"
                  >
                    Daha Sonra
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// lib/utils/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    this.recordMetric(name, end - start)
    return result
  }

  async measureAsyncTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    
    this.recordMetric(name, end - start)
    return result
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Son 100 ölçümü tut
    if (values.length > 100) {
      values.shift()
    }
  }

  getAverageTime(name: string): number {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return 0
    
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  getMetricSummary() {
    const summary: Record<string, { avg: number, count: number }> = {}
    
    for (const [name, values] of this.metrics) {
      summary[name] = {
        avg: this.getAverageTime(name),
        count: values.length
      }
    }
    
    return summary
  }

  // Core Web Vitals ölçümü
  measureCoreWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('LCP', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const firstEntry = entryList.getEntries()[0]
      this.recordMetric('FID', firstEntry.processingStart - firstEntry.startTime)
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    let clsValue = 0
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
          this.recordMetric('CLS', clsValue)
        }
      }
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// hooks/use-performance.ts
import { useEffect } from 'react'
import { PerformanceMonitor } from '@/lib/utils/performance'

export function usePerformanceMonitoring() {
  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance()
    monitor.measureCoreWebVitals()
  }, [])
}

// lib/utils/offline-detector.ts
export class OfflineDetector {
  private static instance: OfflineDetector
  private isOnline = navigator.onLine
  private listeners: Array<(isOnline: boolean) => void> = []

  static getInstance() {
    if (!OfflineDetector.instance) {
      OfflineDetector.instance = new OfflineDetector()
    }
    return OfflineDetector.instance
  }

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners()
    })
  }

  getStatus() {
    return this.isOnline
  }

  subscribe(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback)
    
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline))
  }
}

// hooks/use-offline-status.ts
import { useState, useEffect } from 'react'
import { OfflineDetector } from '@/lib/utils/offline-detector'

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const detector = OfflineDetector.getInstance()
    setIsOnline(detector.getStatus())
    
    return detector.subscribe(setIsOnline)
  }, [])

  return isOnline
}

// components/offline-banner.tsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useOfflineStatus } from '@/hooks/use-offline-status'

export function OfflineBanner() {
  const isOnline = useOfflineStatus()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-2 px-4 text-center text-sm font-medium"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
        >
          📡 İnternet bağlantısı yok - Çevrimdışı moddasınız
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// tailwind.config.js - Gelişmiş yapılandırma
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom spacing for mobile-first design
      spacing: {
        'safe-area-inset-top': 'env(safe-area-inset-top)',
        'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
        'safe-area-inset-left': 'env(safe-area-inset-left)',
        'safe-area-inset-right': 'env(safe-area-inset-right)',
      },
      
      // Neon color palette
      colors: {
        purple: {
          50: '#f5f3ff',
          100: '#ede9fe', 
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6c5ce7', // Main brand color
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3c1361',
        },
        neon: {
          pink: '#ff006b',
          blue: '#00d4ff', 
          green: '#00ff88',
          purple: '#6c5ce7',
          yellow: '#ffd700',
        }
      },

      // Game-specific animations
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },

      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(180deg)' },
          '100%': { transform: 'rotateY(0deg)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' }
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(108, 92, 231, 0.5)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(108, 92, 231, 0.8)' 
          }
        },
        'bounce-in': {
          '0%': { 
            transform: 'scale(0.3) translateY(20px)',
            opacity: '0'
          },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': {
            transform: 'scale(1) translateY(0)',
            opacity: '1'
          }
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },

      // Mobile-first breakpoints
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px', 
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },

      // Typography optimized for mobile
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },

      // Glassmorphism utilities
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      }
    },
  },
  plugins: [
    // Touch-friendly utilities
    function({ addUtilities }) {
      addUtilities({
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.neon-glow': {
          'box-shadow': '0 0 20px currentColor',
        },
        '.safe-area-p': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)', 
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        }
      })
    }
  ],
}

// package.json scripts eklentileri
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true npm run build",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "tsx scripts/seed-words.ts",
    "generate": "prisma generate",
    "test": "jest",
    "test:watch": "jest --watch",
    "lighthouse": "lhci autorun",
    "bundle-analyzer": "ANALYZE=true npm run build"
  },
  "dependencies": {
    // ... mevcut dependencies
    "workbox-window": "^7.0.0"
  },
  "devDependencies": {
    // ... mevcut devDependencies  
    "@lhci/cli": "^0.12.0",
    "webpack-bundle-analyzer": "^4.9.0"
  }
}

// .lighthouserc.js - Performance monitoring
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}

// Deployment scripti
// scripts/deploy.sh
#!/bin/bash

echo "🚀 Çift Wordle Deployment başlıyor..."

# Environment kontrol
if [ "$1" = "production" ]; then
  echo "📦 Production build başlıyor..."
  export NODE_ENV=production
else
  echo "🔧 Development build başlıyor..."
  export NODE_ENV=development
fi

# Dependencies kurulumu
echo "📦 Dependencies kuruluyor..."
npm ci

# Type checking
echo "🔍 Type checking..."
npm run type-check

# Linting
echo "✅ Linting..."
npm run lint

# Database migration
echo "🗄️ Database migration..."
npm run db:migrate

# Build
echo "🏗️ Build başlıyor..."
npm run build

# Performance analizi (production'da)
if [ "$1" = "production" ]; then
  echo "⚡ Performance analizi..."
  npm run lighthouse
fi

echo "✅ Deployment tamamlandı!"

# README.md dosyası
# 🎮 Çift Wordle - 2 Kişilik Kelime Oyunu

Modern, responsive ve performanslı 2 kişilik online Türkçe kelime oyunu.

## ✨ Özellikler

- 🎯 **2 Oyun Modu**: Sırayla ve Düello modları
- 📱 **Mobil-First**: Tüm cihazlarda mükemmel deneyim
- ⚡ **Real-time**: Socket.io ile anlık multiplayer
- 🎨 **Modern UI**: Glassmorphism ve neon efektler
- 🔊 **Ses & Haptik**: Kapsamlı ses efektleri ve titreşim
- 💬 **Chat Sistemi**: Oyun içi mesajlaşma
- 📊 **PWA**: Offline çalışma ve app-like deneyim
- 🚀 **Performance**: 90+ Lighthouse skoru

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Socket.io, Prisma
- **Database**: SQLite/PostgreSQL
- **State**: Zustand
- **Animasyon**: Framer Motion
- **PWA**: Service Worker, Web App Manifest

## 🚀 Kurulum

```bash
# Repo klonla
git clone https://github.com/your-username/cift-wordle.git
cd cift-wordle

# Dependencies kur
npm install

# Environment setup
cp .env.example .env.local

# Database setup
npm run db:push
npm run db:seed

# Development başlat
npm run dev
```

## 📱 Mobil Optimizasyon

- Touch-friendly 44px+ dokunma hedefleri
- Safe area desteği (iPhone notch)
- Haptic feedback
- Swipe gestures
- Bottom sheet modaller
- PWA install prompt

## 🎯 Performance Hedefleri

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **Bundle Size**: < 500KB
- **Lighthouse**: 90+

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.