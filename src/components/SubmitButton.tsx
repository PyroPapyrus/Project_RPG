// src/components/SubmitButton.tsx

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Slot } from "@radix-ui/react-slot" // Se você usar radix-ui Slot
import { cn } from '@/lib/utils' // Se você usar cn para combinar classes

// Se SubmitButton renderiza um Button customizado em vez de <button> nativo
// import { Button } from '@/components/ui/button'

// Interface SubmitButtonProps - Adicionando a prop onClick
interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { // Extendendo para incluir props nativas como onClick
  loading: boolean;
  disabled?: boolean;
  loadingText?: string;
  buttonText: string;
  asChild?: boolean; // Se usar Slot
  // Não precisamos mais adicionar onClick aqui explicitamente se estendermos ButtonHTMLAttributes
}

export const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({
    loading,
    disabled = false,
    loadingText = "Carregando...",
    buttonText,
    className,
    asChild = false,
    // Remova 'onClick' daqui se estender ButtonHTMLAttributes e não precisar tratá-lo explicitamente aqui
    ...props // Coleta todas as outras props, incluindo onClick, type, etc.
  }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp // Renderiza <button> ou Slot
        type="submit" // Mantém type="submit" para forms
        disabled={loading || disabled} // Desabilita se estiver carregando ou explicitamente disabled
        className={cn(
          "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50", // Suas classes de estilização
          className // Permite classes customizadas
        )}
        ref={ref}
        // Não precisa passar onClick explicitamente aqui se ele já vem em ...props
        // onClick={onClick} // <-- Remova se ButtonHTMLAttributes já inclui e você passa ...props
        {...props} // Passa todas as outras props, incluindo o handler onClick se fornecido
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingText}
          </span>
        ) : (
          buttonText
        )}
      </Comp>
    )
  }
)

SubmitButton.displayName = "SubmitButton"