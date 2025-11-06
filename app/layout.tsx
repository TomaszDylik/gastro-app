import './globals.css'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/components/providers/ToastProvider'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
