'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FormInput } from '@/components/FormInput'
import { SubmitButton } from '@/components/SubmitButton'
import { ErrorPopup } from '@/components/ErrorPopup'
import { BackButton } from '@/components/ui/back-button'
import Image from 'next/image'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email ou senha incorretos.")
        }
        throw error
      }

      if (!data.session) {
        throw new Error("Não foi possível criar uma sessão.")
      }

      // Forçar um refresh da página para garantir que o middleware pegue a nova sessão
      router.refresh()
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Falha no login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='bg-gray-900 min-h-screen '>
      <Image
        src="/images/rpg-camp-bg.png"
        alt="RPG Background"
        fill
        className="object-cover opacity-50"
        priority
      />
            
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
      <header className='bg-gray-800 relative flex justify-center items-center'>
        <div className='absolute left-4'>
          <BackButton />
        </div>

        <img 
          src="/images/logo.png" 
          alt="logo Story&Plot" 
          className="w-80" 
        />
      </header>

      <div className="relative bg-opacity-25 flex justify-center items-center min-h-[calc(100vh-6rem)]">
        <div className="bg-gray-200 rounded-lg shadow-md p-8 w-full max-w-xl">
          <div className='text-center mb-40'>
            <h2 className="text-3xl font-bold ">
              Entre na sua conta
            </h2>

            <p className='mt-3'>aaaaaaaaaaaaaaaaaaa</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <FormInput
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              
              <FormInput
                id="password"
                name="password"
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <SubmitButton
              loading={loading}
              loadingText="Entrando..."
              buttonText="Entrar"
            />

            <div className="text-sm text-center">
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Não tem uma conta? Cadastre-se
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}