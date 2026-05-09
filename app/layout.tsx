import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: 'PNG Website Builders - Build Stunning Websites with AI',
  description: 'Create beautiful, responsive websites in seconds using the power of AI. No coding required. Start with 3 free credits.',
  keywords: ['AI website builder', 'website generator', 'AI web design', 'no-code website'],
  openGraph: {
    title: 'PNG Website Builders - Build Stunning Websites with AI',
    description: 'Create beautiful, responsive websites in seconds using the power of AI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PNG Website Builders - Build Stunning Websites with AI',
    description: 'Create beautiful, responsive websites in seconds using the power of AI.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-background">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
