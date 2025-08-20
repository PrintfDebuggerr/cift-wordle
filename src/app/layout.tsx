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
      </body>
    </html>
  )
}

