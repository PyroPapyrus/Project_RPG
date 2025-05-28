import { useState, useEffect } from 'react';
import { Lock, Unlock, Edit, Trash2, Save, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CloseModalButton } from '../ui/close-modal-button';
import { createPortal } from 'react-dom';
import { Textarea } from '../ui/textarea';
import ConfirmationModal from './ConfirmationModal';
import { ImageViewerModal } from './ImageViewerModal';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase';

interface SessionImage {
  id: string;
  description: string | null;
  is_private: boolean;
  image_base64: string;
}

interface ImageListModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: SessionImage[];
  onEdit: (image: SessionImage) => void;
  onDelete: (imageId: string, description: string | null) => void;
  onSave: (imageId: string, description: string, isPrivate: boolean) => Promise<void>;
  isEditing: boolean;
  onRefresh?: () => void; // Adicionado para a função de atualização
  isMaster: boolean;
}

export function ImageListModal({
  isOpen,
  onClose,
  images,
  isMaster,
  onEdit,
  onDelete,
  onSave,
  isEditing,
  onRefresh,
}: ImageListModalProps) {
const [editingImageId, setEditingImageId] = useState<string | null>(null);
const [editDescription, setEditDescription] = useState("");
const [editIsPrivate, setEditIsPrivate] = useState(false);
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [imageToDelete, setImageToDelete] = useState<{ id: string, description: string | null } | null>(null);
const [expandedImage, setExpandedImage] = useState<SessionImage | null>(null);
const [loading, setLoading] = useState(true);
const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const handleExpandImage = (image: SessionImage) => {
        setExpandedImage(image);
    };

    // NOVA FUNÇÃO: handleSaveModalEdit - Chamada pelo ImageViewerModal
      const handleSaveModalEdit = async (imageId: string, description: string, isPrivate: boolean) => {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('session_images')
            .update({
              description: description,
              is_private: isPrivate,
            })
            .eq('id', imageId);
    
          if (error) {
            throw new Error(error.message || 'Erro ao atualizar a imagem.');
          }
    
          // Update the expandedImage state immediately after successful save
          setExpandedImage(prevImage => {
            if (prevImage && prevImage.id === imageId) {
              return {
                ...prevImage,
                description: description,
                is_private: isPrivate
              };
            }
            return prevImage;
          });
    
          toast.success('Imagem atualizada com sucesso no modal!');
        } catch (err: any) {
          toast.error(`Erro ao salvar: ${err.message}`);
          console.error('Erro ao salvar edição no modal:', err);
        } finally {
          setLoading(false);
        }
      };
      const handleOpenConfirmModal = (imageId: string, imageName: string | null) => {
        setImageToDelete({ id: imageId, description: imageName });
        setIsConfirmModalOpen(true);
      };

  const handleCloseExpandedImage = () => {
    setExpandedImage(null);
  };

  const handleEditClick = (image: SessionImage) => {
    setEditingImageId(image.id);
    setEditDescription(image.description || "");
    setEditIsPrivate(image.is_private);
  };

  const handleSaveClick = async (imageId: string) => {
    try {
      await onSave(imageId, editDescription, editIsPrivate);
      setEditingImageId(null);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingImageId(null);
    setEditDescription("");
    setEditIsPrivate(false);
  };

  const handleDeleteClick = (imageId: string, description: string | null) => {
    setImageToDelete({ id: imageId, description });
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (imageToDelete) {
      await onDelete(imageToDelete.id, imageToDelete.description);
      setShowConfirmModal(false);
      setImageToDelete(null);
      // A atualização da lista acontecerá através do canal de tempo real
    }
  };

  // Adicione um useEffect para recarregar o modal quando ele for aberto
  useEffect(() => {
    if (isOpen) {
      // Se houver uma função de atualização fornecida pelas props, chame-a
      onRefresh?.();
    }
  }, [isOpen]);

  // Adicione este useEffect para escutar mudanças em tempo real
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('image_list_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'session_images'
        },
        () => {
          // Atualiza a lista quando houver mudanças
          onRefresh?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, onRefresh]);

  if (!isOpen) return null;

    // Check if any card is currently in editing mode outside the modal
    const isAnyCardEditing = editingImageId !== null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden m-4">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Imagens Salvas</h2>
            <CloseModalButton onClose={onClose} />
          </div>

          {images.length === 0 ? (
            <p className='text-center font-bold p-12'>Ainda não há nenhuma imagem salva aqui</p>
            ) : (

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="grid gap-4">
                {images.map((image) => (
                  <div 
                    key={image.id}
                    onClick={() => handleExpandImage(image)}
                    className="cursor-pointer flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-24 h-24 flex-shrink-0">
                      <img
                        src={image.image_base64}
                        alt={image.description || 'Imagem da sessão'}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-grow" onClick={(e) => e.stopPropagation()}>
                      {editingImageId === image.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Descrição da imagem"
                            rows={2}
                            className="w-full"
                          />
                          <label className="flex items-center text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={editIsPrivate}
                              onChange={(e) => setEditIsPrivate(e.target.checked)}
                              className="mr-2"
                            />
                            Privada
                          </label>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">
                            {image.description || 'Sem descrição'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {image.is_private ? (
                              <div className="flex items-center text-red-500">
                                <Lock className="h-4 w-4 mr-1" />
                                <span>Privada</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-green-500">
                                <Unlock className="h-4 w-4 mr-1" />
                                <span>Pública</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Botões de edição/exclusão */}
                    {isMaster && (
                      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {editingImageId === image.id ? (
                          <div className='space-x-2 p-3 rounded items-center flex'>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveClick(image.id);
                              }}
                              className="p-2 hover:bg-gray-200 h-auto text-green-500 hover:text-green-700"
                              title="Salvar Alterações"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                              className="p-2 hover:bg-gray-200 h-auto text-gray-500 hover:text-gray-700"
                              title="Cancelar Edição"
                            >
                              <XCircle className="text-black hover:text-gray-400 h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className='space-x-2 p-3 rounded items-center flex'>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(image);
                              }}
                              className="p-2 hover:bg-gray-200 h-auto text-blue-500 hover:text-blue-700"
                              title="Editar Imagem"
                              disabled={isEditing}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(image.id, image.description);
                              }}
                              className="p-2 hover:bg-gray-200 h-auto text-red-500 hover:text-red-700"
                              title="Excluir Imagem"
                              disabled={isEditing}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* ImageViewerModal */}
        <ImageViewerModal
            isOpen={!!expandedImage}
            onClose={handleCloseExpandedImage}
            imageSrc={expandedImage?.image_base64 || ''}
            imageDescription={expandedImage?.description}
            isPrivate={expandedImage?.is_private}
            isMaster={isMaster}
            onSaveModalEdit={handleSaveModalEdit} // NOVO: Passa a função de salvar edição do modal
            onDeleteImage={handleOpenConfirmModal} // Mantém para exclusão
            imageId={expandedImage?.id}
            isGlobalEditing={isAnyCardEditing} // Passa o estado de edição global para o modal
        />

      {showConfirmModal && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Exclusão"
          message="Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita."
          confirmButtonText="Excluir"
          cancelButtonText="Cancelar"
        />
      )}
    </>,
    document.body
  );
}