import { useState } from 'react';

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function usePasswordValidation() {
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    setPasswordValidation({
      minLength,
      hasUppercase,
      hasNumber,
      hasSpecialChar,
    });

    if (!minLength) return "A senha deve ter pelo menos 8 caracteres.";
    if (!hasUppercase) return "A senha deve ter pelo menos uma letra maiúscula.";
    if (!hasNumber) return "A senha deve ter pelo menos um número.";
    if (!hasSpecialChar) return "A senha deve ter pelo menos um caractere especial.";

    return null;
  };

  return {
    passwordValidation,
    validatePassword
  };
} 