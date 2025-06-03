import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Slot } from "@radix-ui/react-slot"
import { cn } from '@/lib/utils' // Assumindo que cn vem de um utils que combina classes

// Interface ButtonProps - Adicionando 'destructive' ao tipo do variant
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon'
  asChild?: boolean
  isEditing?: boolean
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, loading, loadingText, disabled = false, isEditing = true, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          `inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${(!isEditing || disabled) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`,
          {
            'bg-indigo-600 text-white hover:bg-indigo-700': variant === 'default',
            'border border-gray-300 bg-white text-gray-700 hover:bg-gray-200': variant === 'outline',
            'hover:bg-gray-100 text-gray-700': variant === 'ghost',
            'text-indigo-600 underline-offset-4 hover:underline': variant === 'link',
            'h-10 px-4 py-2': size === 'default',
            'h-8 px-2 text-sm': size === 'sm',
            'h-10 px-2 text-md, rounded-full': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        disabled={loading || disabled || !isEditing}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingText}
          </span>
        ) : (
          children
        )}
      </Comp>
    )
  }
)

Button.displayName = "Button"