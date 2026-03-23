import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My PWA App',
  description: 'A Progressive Web App',
  manifest: '/ticketing/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0070f3" />
        <link rel="manifest" href="/ticketing/manifest.json" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}