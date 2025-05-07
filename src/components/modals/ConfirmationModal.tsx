// src/components/modals/ConfirmationModal.tsx

'use client'; // Garante que é um componente cliente

import { Button } from '@/components/ui/button'; // Importe o seu componente Button

// Interface de Props para o Modal de Confirmação
interface ConfirmationModalProps {
  isOpen: boolean;                 // Controla se o modal está visível
  onClose: () => void;             // Função para fechar o modal (chamada ao cancelar ou fechar)
  message: string;                 // A mensagem de confirmação a ser exibida
  onConfirm: () => void;           // Função a ser chamada se o usuário confirmar
  title?: string;                  // Título opcional do modal (padrão: "Confirmar Ação")
  cancelButtonText?: string;       // Texto opcional para o botão Cancelar (padrão: "Cancelar")
  confirmButtonText?: string;      // Texto opcional para o botão Confirmar (padrão: "Confirmar")
  isConfirmDestructive?: boolean;  // Se o botão de confirmação deve ter estilo destrutivo (vermelho) (padrão: false)
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  message,
  onConfirm,
  title = "Confirmar Ação", // Valor padrão para o título
  cancelButtonText = "Cancelar", // Valor padrão para o texto do botão Cancelar
  confirmButtonText = "Confirmar", // Valor padrão para o texto do botão Confirmar
}: ConfirmationModalProps) {

  // Se não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  // Renderização do Modal
  return (
    // Fundo escuro fixo que ocupa toda a tela e centraliza o conteúdo
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      {/* Container do Conteúdo do Modal */}
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl transform transition-all duration-300 ease-in-out scale-100">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center mb-4">
          {/* Título do Modal */}
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          {/* Botão de Fechar (opcional, chama onClose) */}
          {/* Você pode adicionar um ícone 'X' aqui */}
        </div>

        {/* Corpo do Modal: a mensagem de confirmação */}
        <div className="mb-6 text-gray-700">
          <p>{message}</p>
        </div>

        {/* Rodapé do Modal: Botões de Ação */}
        <div className="flex justify-end space-x-3">
          {/* Botão Cancelar */}
          <Button
            variant="outline" // Use a variante apropriada
            onClick={onClose} // Chama a função para fechar/cancelar
          >
            {cancelButtonText}
          </Button>
          {/* Botão Confirmar */}
          <Button
            // Condicionalmente aplica a variante destrutiva (vermelha)
            onClick={onConfirm} // Chama a função de confirmação
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}