// src/components/ui/image-viewer-modal.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { X, Lock, Unlock, Edit, Trash2, Save, XCircle } from 'lucide-react'; // Adicionado Save e XCircle
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea
import { createPortal } from 'react-dom';
import { CloseModalButton } from '../ui/close-modal-button';

// Adicionar props para o modo mestre e as funções de ação
interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageDescription?: string | null;
  isPrivate?: boolean;
  isMaster?: boolean;
  imageId?: string; // ID da imagem para ações

  // Funções de callback para SessionImageViewer
  onDeleteImage?: (imageId: string, imageName: string | null) => void;
  onSaveModalEdit?: (imageId: string, description: string, isPrivate: boolean) => Promise<void>; // Nova prop para salvar edição
  onCancelModalEdit?: () => void; // Nova prop para cancelar edição (resetar o global)
  isGlobalEditing?: boolean; // Se há alguma edição globalmente (para desabilitar botões)
}

export function ImageViewerModal({
  isOpen,
  onClose,
  imageSrc,
  imageDescription,
  isPrivate,
  isMaster,
  imageId,
  onDeleteImage,
  onSaveModalEdit,
  onCancelModalEdit,
  isGlobalEditing, // Recebe o estado de edição global
}: ImageViewerModalProps) {
  // Estado interno para controlar o modo de edição dentro do modal
  const [isEditingModal, setIsEditingModal] = React.useState(false);
  const [modalDescription, setModalDescription] = React.useState(imageDescription || '');
  const [modalIsPrivate, setModalIsPrivate] = React.useState(isPrivate || false);

  // Efeito para sincronizar a descrição e privacidade quando o modal é aberto
  React.useEffect(() => {
    if (isOpen) {
      setModalDescription(imageDescription || '');
      setModalIsPrivate(isPrivate || false);
      setIsEditingModal(false); // Inicia sempre em modo de visualização
    }
  }, [isOpen, imageDescription, isPrivate]);

  if (!isOpen) return null;

  const handleEditClick = () => {
    setIsEditingModal(true);
  };

  const handleSaveClick = async () => {
    if (onSaveModalEdit && imageId) {
      await onSaveModalEdit(imageId, modalDescription, modalIsPrivate);
      setIsEditingModal(false); // Sai do modo de edição após salvar
      // onCancelModalEdit && onCancelModalEdit(); // Chama a função global para limpar o editingImageId
      // A atualização do estado 'images' no SessionImageViewer pelo callback já vai re-renderizar
    }
  };

  const handleCancelClick = () => {
    setModalDescription(imageDescription || ''); // Volta para a descrição original
    setModalIsPrivate(isPrivate || false);     // Volta para a privacidade original
    setIsEditingModal(false);                 // Sai do modo de edição
    // onCancelModalEdit && onCancelModalEdit(); // Não precisa chamar aqui, pois não iniciamos um edição globalmente com handleEditClick
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg p-4 flex flex-col md:flex-row max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de Fechar Modal */}
        <div className='absolute top-3 right-4 z-10'>
          <CloseModalButton onClose={onClose} /> 
        </div>
        {/* Coluna da Imagem */}
        <div className="flex-grow flex items-center justify-center overflow-hidden mb-4 md:mb-0 md:mr-4">
          <img
            src={imageSrc}
            alt={imageDescription || 'Imagem expandida'}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Coluna da Descrição e Status */}
        <div className="flex-shrink-0 w-full md:w-80 flex flex-col pt-4 md:pt-0 md:pl-4 border-t md:border-t-0 md:border-l border-gray-200">
          <div className="flex-grow overflow-y-auto pr-2">
            {isEditingModal ? (
              // Modo de Edição no Modal
              <div className="space-y-3">
                <Textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Descrição da imagem"
                  rows={4} // Mais linhas para edição no modal
                  className="w-full"
                />
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={modalIsPrivate}
                    onChange={(e) => setModalIsPrivate(e.target.checked)}
                    className="mr-2"
                  />
                  Privada
                </label>
              </div>
            ) : (
              // Modo de Visualização no Modal
              <>
                {imageDescription && (
                  <p className="text-gray-800 text-base font-semibold mb-2 whitespace-pre-wrap break-words">
                    {imageDescription}
                  </p>
                )}
                {!imageDescription && <p className="text-gray-500 italic">Nenhuma descrição fornecida.</p>}
              </>
            )}
          </div>

          {isPrivate !== undefined && ( // Status de privacidade sempre visível, fora da lógica de edição
            <div className="pt-2 text-center text-gray-600 text-sm flex items-center justify-center">
              {isPrivate ? (
                <>
                  <span className='text-red-600 flex items-center'>
                    <Lock className=" h-4 w-4 mr-1" />
                    Privada
                  </span>
                </>
              ) : (
                <>
                  <span className='text-green-600 flex items-center'>
                    <Unlock className="h-4 w-4 mr-1" />
                    Pública
                  </span>
                </>
              )}
            </div>
          )}

          {/* Botões de Ação (Edição/Exclusão) no Modal */}
          {isMaster && imageId && ( // Renderiza apenas se for mestre e tiver ID da imagem
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200">
              {isEditingModal ? (
                // Botões de Salvar/Cancelar quando em modo de edição
                <>
                  <Button
                    size="sm"
                    onClick={handleSaveClick}
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={isGlobalEditing} // Desabilita se outra edição global estiver ativa
                  >
                    <Save className="h-4 w-4 mr-2" /> Salvar Edição
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelClick}
                    disabled={isGlobalEditing}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Cancelar
                  </Button>
                </>
              ) : (
                // Botões de Editar/Excluir quando em modo de visualização
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditClick} // Agora apenas alterna o modo de edição do modal
                    className="p-1 h-auto text-blue-500 hover:text-blue-700 w-full justify-center"
                    title="Editar Imagem"
                    disabled={isGlobalEditing} // Desabilita se outra edição global estiver ativa
                  >
                    <Edit className="h-5 w-5 mr-2" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(); // Fecha o modal de visualização
                      onDeleteImage && onDeleteImage(imageId!, imageDescription ?? null);
                    }}
                    className="p-1 h-auto text-red-500 hover:text-red-700 w-full justify-center"
                    title="Excluir Imagem"
                    disabled={isGlobalEditing} // Desabilita se outra edição global estiver ativa
                  >
                    <Trash2 className="h-5 w-5 mr-2" /> Excluir
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}