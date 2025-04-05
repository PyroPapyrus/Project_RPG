import LoginForm from '@/components/LoginForm'
import { BackButton } from '@/components/ui/back-button'

export default function LoginPage() {
  return (
    <div className="relative">
      <BackButton />
      <LoginForm />
    </div>
  )
} 