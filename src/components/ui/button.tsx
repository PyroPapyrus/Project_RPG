import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Slot } from "@radix-ui/react-slot"
import { cn } from '@/lib/utils' // Assumindo que cn vem de um utils que combina classes

// Interface ButtonProps - Adicionando 'destructive' ao tipo do variant
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' // <--- Adicionado 'destructive' aqui
  size?: 'default' | 'sm' | 'lg'
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            // Estilos para as variantes existentes
            'bg-indigo-600 text-white hover:bg-indigo-700': variant === 'default',
            'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50': variant === 'outline',
            'hover:bg-gray-100 text-gray-700': variant === 'ghost',

            // --- NOVOS ESTILOS PARA A VARIANTE DESTRUCTIVE ---
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500': variant === 'destructive', // Exemplo: fundo vermelho, texto branco, hover mais escuro, ring vermelho
            // --- FIM NOVOS ESTILOS ---

            // Estilos para os tamanhos
            'h-10 px-4 py-2': size === 'default',
            'h-8 px-3 text-sm': size === 'sm',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className // Permite classes customizadas passadas via prop
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"