import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/layout/AppShell'
import SessionWrapper from '@/components/auth/SessionWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FamiliaBudget - Control Financiero Familiar',
  description: 'Gestión de gastos e ingresos familiares',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50`}>
        <SessionWrapper>
          <AppShell>{children}</AppShell>
        </SessionWrapper>
      </body>
    </html>
  )
}
