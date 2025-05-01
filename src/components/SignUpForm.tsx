'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FormInput } from './FormInput'
import { SubmitButton } from './SubmitButton'
import { ErrorPopup } from './ErrorPopup'
import { PasswordRequirements } from './PasswordRequirements'
import { FeedbackMessage } from './FeedbackMessage'
import { usePasswordValidation } from '@/lib/hooks/use-password-validation'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const passwordValidation = usePasswordValidation(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!passwordValidation.isValid) {
        throw new Error("A senha não atende aos requisitos mínimos.")
      }

      if (password !== confirmPassword) {
        throw new Error("As senhas não coincidem.")
      }

      // Tentar criar o usuário
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      // Verificar se houve erro
      if (error) {
        // Verificar se o erro é de usuário já registrado
        if (error.message.includes("User already registered") || 
            error.message.includes("already registered") ||
            error.message.includes("already exists")) {
          throw new Error("Este email já está cadastrado.")
        }
        throw error
      }

      // Verificar se o usuário foi criado
      if (!data.user) {
        throw new Error("Não foi possível criar o usuário.")
      }

      // Verificar se o usuário foi realmente criado (não apenas verificado)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error("Este email já está cadastrado.")
      }

      // Se chegou aqui, o usuário foi criado com sucesso
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Falha no cadastro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }
  
  const isFormValid = email.trim() !== '' && password.trim() !== '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
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

            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirme a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />

            <PasswordRequirements password={password} />

            {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
            {success && (
              <FeedbackMessage
                message="Conta criada com sucesso! Redirecionando para o login..."
                type="success"
              />
            )}

          </div>

          <SubmitButton
            loading={loading}
            loadingText="Criando conta..."
            buttonText="Cadastrar"
            isValid={isFormValid}
          />

          <div className="text-sm text-center">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Já tem uma conta? Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}