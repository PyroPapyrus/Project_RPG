'use client'

import AuthGuard from '@/components/AuthGuard'
import LogoutButton from '@/components/LogoutButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>

        <main className="py-10, margin-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

    </AuthGuard>
  )
} 