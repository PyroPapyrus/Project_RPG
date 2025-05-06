'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FormInput } from '@/components/FormInput'
import { SubmitButton } from '@/components/SubmitButton'
import { ErrorPopup } from '@/components/ErrorPopup'
import { PasswordRequirements } from '@/components/PasswordRequirements'
import { FeedbackMessage } from '@/components/FeedbackMessage'
import { usePasswordValidation } from '@/lib/hooks/use-password-validation'
import { BackButton } from '@/components/ui/back-button'
import Image from 'next/image'

export default function SignUpPage() {
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
    <div className='bg-gray-900 min-h-screen'>
      <Image
        src="/images/bg-login-cadastro.gif"
        alt="RPG Background"
        fill
        className="object-cover opacity-80"
        priority
      />

      <header className='bg-gray-800/30 shadow-md relative flex justify-center items-center'>
        <div className='absolute left-4'>
          <BackButton />
        </div>
      
        <a href="/">
          <img 
            src="/images/logo.png" 
            alt="logo Story&Plot" 
            className="w-80" 
          />
        </a>
      </header>

      <div className="relative flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="bg-gray-200/60 backdrop-blur-sm rounded-lg shadow-md p-8 w-full max-w-xl">
          <div className='text-center mb-5'>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              CADASTRE-SE
            </h2>

            <p className='mt-3'>Crie sua conta</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">

              <div className='bg-white border shadow-md border-gray-300 rounded-md flex items-center'>
                <span className="material-symbols-rounded px-2" style={{ fontSize: '20px' }}>
                  mail
                </span>
                <div className='flex-1'>
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
                </div>
              </div>

              <div className='bg-white border shadow-md border-gray-300 rounded-md flex items-center'>
                <span className="material-symbols-rounded px-2" style={{ fontSize: '20px' }}>
                  lock
                </span>
                <div className='flex-1'>
                  <FormInput
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    showPasswordToggle
                  />
                </div>
              </div>

              <div className='bg-white border shadow-md border-gray-300 rounded-md flex items-center'>
                <span className="material-symbols-rounded px-2" style={{ fontSize: '20px' }}>
                  lock_reset
                </span>
                <div className='flex-1'>
                  <FormInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirme a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    showPasswordToggle
                  />
                </div>
              </div>
          
            </div>

            <PasswordRequirements password={password} />

            {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
            {success && (
              <FeedbackMessage
                message="Conta criada com sucesso! Redirecionando para o login..."
                type="success"
              />
            )}

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
    </div>
  )
}