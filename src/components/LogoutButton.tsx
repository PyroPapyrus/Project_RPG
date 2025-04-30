'use client'

import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from './ui/button'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      Log-out
    </Button>
  )
} 