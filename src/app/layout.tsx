// ============================================================
// Root Layout — App Shell
// ============================================================
// WHY this structure:
// - Server Component (no 'use client') — minimal JS shipped
// - Geist font loaded via next/font for optimal loading
// - AuthListener runs once on mount to sync auth state
// - Toaster provides app-wide notifications
// - Header/Footer provide consistent navigation
// ============================================================
import { InstallPrompt } from '@/components/pwa/install-prompt';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AuthListener } from '@/components/layout/auth-listener';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Source Asia — Flight Management',
    template: '%s | Source Asia',
  },
  description:
    'Modern flight booking and management platform. Search flights, book seats in real-time, and manage your bookings with ease.',
  keywords: ['flight booking', 'airline', 'seat selection', 'travel'],
  authors: [{ name: 'Dhruv Mohan Shukla' }],
  openGraph: {
    title: 'Source Asia — Flight Management',
    description: 'Modern flight booking and management platform',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
         <InstallPrompt />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
        <AuthListener />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#fafafa',
            },
          }}
        />
      </body>
    </html>
  );
}
