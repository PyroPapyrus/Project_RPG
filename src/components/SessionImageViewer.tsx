// src/components/session/SessionImageViewer.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ImageOff, Lock, Unlock, Trash2, Edit, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageViewerModal } from '@/components/modals/ImageViewerModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

interface SessionImage {
  id: string;
  session_id: string;
  image_base64: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
}

interface SessionImageViewerProps {
  sessionId: string;
  isMaster: boolean;
  userId: string;
}

export default function SessionImageViewer({ sessionId, isMaster, userId }: SessionImageViewerProps) {
  const supabase = createClientComponentClient();
  const [images, setImages] = useState<SessionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null); // Continua para edição fora do modal
  const [editingDescription, setEditingDescription] = useState<string>(''); // Continua para edição fora do modal
  const [editingPrivacy, setEditingPrivacy] = useState<boolean>(false); // Continua para edição fora do modal

  const [expandedImage, setExpandedImage] = useState<SessionImage | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{ id: string; description: string | null } | null>(null);

  // Primeiro, adicione um novo estado para controlar o loading do toggle
  const [updatingPrivacyId, setUpdatingPrivacyId] = useState<string | null>(null);

  // Adicione um listener para o evento personalizado
  useEffect(() => {
    const handleImageDeleted = (event: CustomEvent) => {
      const deletedImageId = event.detail;
      setImages(prevImages => prevImages.filter(img => img.id !== deletedImageId));
    };

    window.addEventListener('imageDeleted', handleImageDeleted as EventListener);

    return () => {
      window.removeEventListener('imageDeleted', handleImageDeleted as EventListener);
    };
  }, []);

  // Modifique o useEffect existente para incluir o fetchSessionImages
  useEffect(() => {
    const fetchSessionImages = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('session_images')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Erro ao buscar imagens da sessão:', fetchError);
        setError('Não foi possível carregar as imagens da sessão.');
        toast.error('Erro ao carregar imagens.');
        setLoading(false);
        return;
      }

      const filteredImages = data.filter(image => {
        if (isMaster) {
          return true;
        } else {
          return !image.is_private;
        }
      });
      setImages(filteredImages as SessionImage[]);
      setLoading(false);
    };

    fetchSessionImages();

    const channel = supabase
      .channel(`session_images_${sessionId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_images',
          filter: `session_id=eq.${sessionId}`
        },
        async () => {
          // Recarrega as imagens quando houver qualquer mudança
          await fetchSessionImages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isMaster, supabase]);

  // handleEditClick agora é APENAS para a edição nos cards fora do modal
  const handleEditClick = (image: SessionImage) => {
    setEditingImageId(image.id);
    setEditingDescription(image.description || '');
    setEditingPrivacy(image.is_private);
  };

  const handleCancelEdit = () => {
    setEditingImageId(null);
    setEditingDescription('');
    setEditingPrivacy(false);
  };

  const handleSaveEdit = async (imageId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('session_images')
        .update({
          description: editingDescription,
          is_private: editingPrivacy,
        })
        .eq('id', imageId);

      if (error) throw error;

      // Emitir evento de atualização
      window.dispatchEvent(new CustomEvent('imageUpdated', { 
        detail: { imageId, description: editingDescription, isPrivate: editingPrivacy } 
      }));

      toast.success('Imagem atualizada com sucesso!');
      handleCancelEdit();
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
      console.error('Erro ao salvar edição:', err);
    } finally {
      setLoading(false);
    }
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

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setImageToDelete(null);
  };

  const executeDeleteImage = async () => {
    if (!imageToDelete) return;

    const { id: imageId, description: imageName } = imageToDelete;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('session_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // Emitir evento de exclusão
      window.dispatchEvent(new CustomEvent('imageDeleted', { detail: imageId }));

      setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
      toast.success(`Imagem "${imageName || 'sem nome'}" excluída com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao excluir: ${err.message}`);
      console.error('Erro ao excluir imagem:', err);
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
      setImageToDelete(null);
    }
  };

  const handleExpandImage = (image: SessionImage) => {
    setExpandedImage(image);
  };

  const handleCloseExpandedImage = () => {
    setExpandedImage(null);
  };

  // Check if any card is currently in editing mode outside the modal
  const isAnyCardEditing = editingImageId !== null;

  // Adicione a função handleTogglePrivacy
  const handleTogglePrivacy = async (e: React.MouseEvent, image: SessionImage) => {
    e.stopPropagation();
    if (!isMaster) return;
    
    try {
      const newPrivateStatus = !image.is_private;
      
      const { error } = await supabase
        .from('session_images')
        .update({ is_private: newPrivateStatus })
        .eq('id', image.id);

      if (error) throw error;

      // Atualiza apenas a imagem específica no estado local
      setImages(prevImages =>
        prevImages.map(img =>
          img.id === image.id
            ? { ...img, is_private: newPrivateStatus }
            : img
        )
      );

    } catch (err: any) {
      toast.error('Erro ao alterar privacidade da imagem');
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur-sm px-4">
      {loading ? (
        <div className="p-4 flex items-center justify-center">
          <p className="text-white font-bold">Carregando imagens...</p>
        </div>
        ) : images.length === 0 ? (
        <div className="p-4 flex items-center justify-center">
          <p className="text-white font-bold">Ainda não há nenhuma imagem aqui</p>
          <span className="material-symbols-rounded text-white mx-2">no_photography</span>
        </div>
        ) : (
        <div className="rounded-md flex overflow-x-auto">
          <div className="flex gap-2 py-3 mb-2 min-w-min">
            {images.map((image) => (
              <div
                key={image.id}
                className="cursor-pointer flex-none w-[100px] transition-transform hover:scale-[1.02]"
                onClick={() => handleExpandImage(image)}
                >
                <div className='w-full duration-200 transform-all group-hover:scale-105'>
                  <div className={`flex absolute rounded-tl-md rounded-br-md ${isMaster ? 'cursor-pointer hover:bg-gray-700' : ''} bg-gray-600 px-1 py-1 items-center`}
                    onClick={(e) => isMaster && handleTogglePrivacy(e, image)}
                    title={isMaster ? `Clique para tornar ${image.is_private ? 'pública' : 'privada'}` : image.is_private ? 'Privada' : 'Pública'}
                  >
                    {updatingPrivacyId === image.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                    ) : image.is_private ? (
                      <Lock className="h-4 w-4 text-red-500" />
                      ) : (
                      <Unlock className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {image.image_base64 ? (
                    <img
                      src={image.image_base64}
                      alt={image.description || 'Imagem da sessão'}
                      className="border w-full rounded-lg transform-all border-gray-600 h-[95px] items-center object-cover duration-200 transform-all group-hover:scale-105"
                    />
                    ) : (
                    <div className="h-[80px] bg-gray-200 flex items-center justify-center text-gray-500">
                      <ImageOff className="h-12 w-12" />
                      <p>Imagem não disponível</p>
                    </div>
                  )}
                </div>
                  
                  <>
                  {/*<p className="font-medium line-clamp-2">{image.description || 'Sem descrição'}</p>*/}
                  
                  {/*{isMaster && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleEditClick(image); }}
                        className="p-1 h-auto text-blue-500 hover:text-blue-700"
                        title="Editar Imagem"
                        disabled={expandedImage !== null || isAnyCardEditing} // Desabilita se o modal estiver aberto ou outro card estiver em edição
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleOpenConfirmModal(image.id, image.description); }}
                        className="p-1 h-auto text-red-500 hover:text-red-700"
                        title="Excluir Imagem"
                        disabled={expandedImage !== null || isAnyCardEditing} // Desabilita se o modal estiver aberto ou outro card estiver em edição
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}*/}
                  </>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={executeDeleteImage}
        title="Confirmar Exclusão de Imagem"
        message={`Você tem certeza que deseja excluir essa imagem? Esta ação é irreversível.`}
        confirmButtonText="Excluir"
        cancelButtonText="Cancelar"
        isConfirmDestructive={true}
      />
    </div>
  );
}