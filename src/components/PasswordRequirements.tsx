import { usePasswordValidation } from '@/lib/hooks/use-password-validation'

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const { requirements } = usePasswordValidation(password)

  return (
    <div className="text-sm">
      
      <ul className="space-y-1">
        {requirements.map((req, index: number) => {
          const isValid = req.regex.test(password)
          return (
            <li
              key={index}
              className={`flex items-center gap-2 ${
                isValid ? "text-green-600" : "text-red-600"
              }`}
            >
              <span className="material-symbols-rounded text-sm">
                {isValid ? "check" : "close"}
              </span>
              {req.text}
            </li>
          )
        })}
      </ul>
    </div>
  )
}