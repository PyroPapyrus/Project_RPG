// src/components/modals/ConfirmationModal.tsx

'use client'; // Garante que é um componente cliente

import { Button } from '@/components/ui/button'; // Importe o seu componente Button
import { CloseModalButton } from '../ui/close-modal-button';
import { createPortal } from 'react-dom';

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
  title = "Confirmar Ação",
  cancelButtonText = "Cancelar",
  confirmButtonText = "Confirmar",
}: ConfirmationModalProps) {
  // Se não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  // Renderização do Modal
  return createPortal(
    // Fundo escuro fixo que ocupa toda a tela e centraliza o conteúdo
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container do Conteúdo do Modal */}
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center pb-3 mb-3 border-b-2">
          {/* Título do Modal */}
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          {/* Botão de Fechar (opcional, chama onClose) */}
          <CloseModalButton onClose={onClose} />
        </div>

        {/* Corpo do Modal: a mensagem de confirmação */}
        <div className="mb-6 text-gray-700">
          <p>{message}</p>
        </div>

        {/* Rodapé do Modal: Botões de Ação */}
        <div className="flex flex-col space-y-2">
          {/* Botão Cancelar */}
          <Button
            variant="outline" // Use a variante apropriada
            onClick={onClose} // Chama a função para fechar/cancelar
            className='w-full'
          >
            {cancelButtonText}
          </Button>
          {/* Botão Confirmar */}
          <Button
            // Condicionalmente aplica a variante destrutiva (vermelha)
            onClick={onConfirm} // Chama a função de confirmação
            className='bg-red-600 text-white hover:bg-red-800' // Estilo do botão
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}