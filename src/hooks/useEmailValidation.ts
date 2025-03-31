import { useState } from 'react';
import { checkEmailExists } from '@/lib/auth';

export function useEmailValidation() {
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = async (email: string) => {
    setError(null);

    if (!email || !email.includes('@')) {
      return;
    }

    setIsCheckingEmail(true);
    try {
      const exists = await checkEmailExists(email);
      setEmailExists(exists);
      if (exists) {
        setError("Este e-mail já está cadastrado. Tente recuperar a senha.");
      }
    } catch (err) {
      console.error('Erro ao verificar email:', err);
      setError("Erro ao verificar o email. Tente novamente.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  return {
    emailExists,
    isCheckingEmail,
    error,
    validateEmail
  };
} 