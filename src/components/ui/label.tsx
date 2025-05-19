// src/components/ui/label.tsx

import * as React from "react"
// Se você estiver usando Radix UI para primitivas, pode importar assim:
// import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils" // Importe sua função de utilidade para combinar classes (se você tiver uma)

// Define as propriedades do componente Label, estendendo as propriedades de uma tag <label> nativa
// e adicionando um ref.
const Label = React.forwardRef<
  React.ElementRef<"label">,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
  // Renderiza a tag <label> nativa
  <label
    // Combina classes padrão com classes passadas via prop className
    // A função cn (className) do '@/lib/utils' é comum em projetos com Tailwind e shadcn
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", // Classes Tailwind padrão para label
      className // Classes customizadas passadas para o componente
    )}
    ref={ref} // Passa a ref para o elemento label nativo
    {...props} // Passa todas as outras props (como htmlFor, onClick, etc.)
  />
))

// Define o nome de exibição do componente (útil em ferramentas de desenvolvimento React)
Label.displayName = "Label"

// Exporta o componente
export { Label }