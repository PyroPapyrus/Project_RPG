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
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, disabled = false, isEditing = true, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
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
        disabled={ disabled || !isEditing}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"