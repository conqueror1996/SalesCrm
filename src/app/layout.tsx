import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Brick Sales CRM - AI Powered',
  description: 'Intelligent lead management and sales conversion tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
