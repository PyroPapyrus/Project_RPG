'use client'

import { useState, useEffect } from 'react'
import { signUp } from '@/lib/auth'
import Link from 'next/link'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { PasswordRequirements } from './PasswordRequirements'
import { FeedbackMessage } from './FeedbackMessage'
import { ErrorPopup } from './ErrorPopup'
import { FormInput } from './FormInput'
import { SubmitButton } from './SubmitButton'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ message: string; email: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { passwordValidation, validatePassword } = usePasswordValidation()

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password);
      if (result.user) {
        setSuccess({
          message: result.message,
          email: email
        });
      }
    } catch (err: any) {
      setError(err.message || "Não foi possível criar a conta. Tente novamente.");
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
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
              onChange={handleEmailChange}
              disabled={loading}
              required
              className="rounded-t-md"
            />
            
            <FormInput
              id="password"
              name="password"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
              required
            />

            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirmar Senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className="rounded-b-md"
            />
          </div>

          <PasswordRequirements validation={passwordValidation} />

          {success && !error && (
            <FeedbackMessage
              type="success"
              message={success.message}
              additionalMessage={`Enviamos um email de confirmação para ${success.email}`}
            />
          )}

          <div>
            <SubmitButton
              loading={loading}
              loadingText="Criando conta..."
              buttonText="Criar conta"
            />
          </div>

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