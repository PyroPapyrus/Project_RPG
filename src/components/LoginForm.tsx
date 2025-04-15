'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FormInput } from './FormInput'
import { SubmitButton } from './SubmitButton'
import { ErrorPopup } from './ErrorPopup'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entre na sua conta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
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
  )
} 