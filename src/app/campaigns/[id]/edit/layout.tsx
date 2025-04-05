'use client'

import AuthGuard from '@/components/AuthGuard'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'

export default function EditCampaignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link href="/(authenticated)/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/(authenticated)/campaigns" className="text-gray-600 hover:text-gray-900">
                  Campanhas
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Editar Campanha</h1>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
} 