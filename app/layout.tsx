import './globals.css';
import type { Metadata } from 'next';
import { MotionConfig } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeScript } from '@/components/ThemeScript';

export const metadata: Metadata = {
  title: {
    default: 'CareerProof AI',
    template: '%s | CareerProof AI',
  },
  description: 'Build your portfolio. Prove your skills. Get career-ready.',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  openGraph: {
    title: 'CareerProof AI',
    description: 'Build your portfolio. Prove your skills. Get career-ready.',
    type: 'website',
    siteName: 'CareerProof AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareerProof AI',
    description: 'Build your portfolio. Prove your skills. Get career-ready.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
