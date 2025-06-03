'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface LogoutButtonProps {
  className?: string
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button
      variant='outline'
      onClick={handleSignOut}
      className={cn(
        'text-red-600 border-red-600 hover:bg-red-400/20', // base styles
        className // custom styles that can override base styles
      )}
    >
      Sair da Conta
    </Button>
  )
}