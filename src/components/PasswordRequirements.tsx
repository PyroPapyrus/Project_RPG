import { usePasswordValidation } from '@/lib/hooks/use-password-validation'

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const { requirements } = usePasswordValidation(password)

  return (
    <div className="text-sm space-y-1">
      <p className="text-gray-600">A senha deve conter:</p>
      <ul className="list-disc list-inside space-y-1">
        {requirements.map((req, index: number) => (
          <li
            key={index}
            className={req.regex.test(password) ? "text-green-600" : "text-gray-500"}
          >
            {req.text}
          </li>
        ))}
      </ul>
    </div>
  )
} 