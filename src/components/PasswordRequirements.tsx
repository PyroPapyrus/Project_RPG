interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface PasswordRequirementsProps {
  validation: PasswordValidation;
}

export function PasswordRequirements({ validation }: PasswordRequirementsProps) {
  return (
    <div className="text-sm space-y-1">
      <p className="text-gray-600">A senha deve conter:</p>
      <ul className="list-disc list-inside space-y-1">
        <li className={validation.minLength ? "text-green-600" : "text-gray-500"}>
          Pelo menos 8 caracteres
        </li>
        <li className={validation.hasUppercase ? "text-green-600" : "text-gray-500"}>
          Pelo menos uma letra maiúscula
        </li>
        <li className={validation.hasNumber ? "text-green-600" : "text-gray-500"}>
          Pelo menos um número
        </li>
        <li className={validation.hasSpecialChar ? "text-green-600" : "text-gray-500"}>
          Pelo menos um caractere especial (!@#$%^&amp;*(),.?&quot;:{}|&lt;&gt;)
        </li>
      </ul>
    </div>
  );
} 