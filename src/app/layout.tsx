import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import SwRegister from './sw-register';

// Downloaded at build time and served from this origin: no runtime requests to Google.
// A variable font, so every weight the screens use (400–900) is included.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'NBC ESS - Employee Self-Service',
  description: 'National Basics Company - Employee Self-Service Portal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NBC ESS',
  },
  icons: {
    icon: '/favicon.png?v=2',
    shortcut: '/favicon.png?v=2',
    apple: '/icons/icon-192.png?v=2',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F1A2E',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/png" href="/favicon.png?v=2" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png?v=2" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png?v=2" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <SwRegister />
      </body>
    </html>
  );
}
