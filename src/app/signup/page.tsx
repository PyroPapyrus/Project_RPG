import SignUpForm from '@/components/SignUpForm'
import { BackButton } from '@/components/ui/back-button'

export default function SignUpPage() {
  return (
    <div className="relative">
      <BackButton />
      <SignUpForm />
    </div>
  )
} 