import { useMemo } from 'react'

interface PasswordRequirement {
  text: string
  regex: RegExp
}

interface PasswordValidation {
  isValid: boolean
  requirements: PasswordRequirement[]
}

export function usePasswordValidation(password: string): PasswordValidation {
  const requirements = useMemo<PasswordRequirement[]>(() => [
    {
      text: 'Pelo menos 8 caracteres',
      regex: /.{8,}/
    },
    {
      text: 'Pelo menos uma letra maiúscula',
      regex: /[A-Z]/
    },
    {
      text: 'Pelo menos uma letra minúscula',
      regex: /[a-z]/
    },
    {
      text: 'Pelo menos um número',
      regex: /[0-9]/
    },
    {
      text: 'Pelo menos um caractere especial',
      regex: /[!@#$%^&*(),.?":{}|<>]/
    }
  ], [])

  const isValid = useMemo(() => {
    if (!password) return false
    return requirements.every(requirement => requirement.regex.test(password))
  }, [password, requirements])

  return {
    isValid,
    requirements
  }
} 