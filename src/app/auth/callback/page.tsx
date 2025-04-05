'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/(authenticated)/dashboard')
      } else {
        router.push('/login')
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Processando autenticação...</h1>
        <p className="mt-2 text-gray-600">Por favor, aguarde enquanto redirecionamos você.</p>
      </div>
    </div>
  )
} 