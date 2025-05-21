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

  useEffect(() => {
    // ... (código useEffect existente, sem alterações aqui)
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
      .channel(`session_images_channel:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_images', filter: `session_id=eq.${sessionId}` },
        async (payload) => {
          console.log('Realtime change received!', payload);
          if (payload.eventType === 'INSERT') {
            const newImage = payload.new as SessionImage;
            if (isMaster || !newImage.is_private) {
              setImages((prevImages) => [newImage, ...prevImages]);
              toast.info('Nova imagem adicionada à sessão!');
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedImagePartial = payload.new as SessionImage;

            if (!updatedImagePartial.image_base64) {
                const { data: fullImage, error: fetchError } = await supabase
                    .from('session_images')
                    .select('*')
                    .eq('id', updatedImagePartial.id)
                    .single();

                if (fetchError || !fullImage) {
                    console.error('Erro ao re-buscar imagem completa:', fetchError);
                    toast.error('Erro ao atualizar imagem (falha ao buscar detalhes).');
                    return;
                }
                setImages((prevImages) =>
                    prevImages.map((img) => (img.id === fullImage.id ? fullImage as SessionImage : img))
                );
            } else {
                setImages((prevImages) =>
                    prevImages.map((img) => (img.id === updatedImagePartial.id ? updatedImagePartial : img))
                );
            }
            toast.info('Imagem da sessão atualizada!');
          }
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

      if (error) {
        throw new Error(error.message || 'Erro ao atualizar a imagem.');
      }

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
          description: description, // Usa os valores passados do modal
          is_private: isPrivate,   // Usa os valores passados do modal
        })
        .eq('id', imageId);

      if (error) {
        throw new Error(error.message || 'Erro ao atualizar a imagem.');
      }

      toast.success('Imagem atualizada com sucesso no modal!');
      // Não precisa chamar handleCancelEdit aqui, pois o modal gerencia seu próprio estado
      // A atualização do Supabase via Realtime (evento UPDATE) irá atualizar o estado 'images' globalmente
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
    setIsConfirmModalOpen(false);
    setImageToDelete(null);

    try {
      const { error } = await supabase
        .from('session_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        throw new Error(error.message || 'Erro ao excluir a imagem.');
      }

      setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));

      toast.success(`Imagem "${imageName || 'sem nome'}" excluída com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao excluir: ${err.message}`);
      console.error('Erro ao excluir imagem:', err);
    } finally {
      setLoading(false);
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


  // ... (código de loading, error, images.length === 0)

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-6">
      <h3 className="text-lg font-semibold mb-2">Imagens da Sessão</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative border rounded-lg overflow-hidden group cursor-pointer"
            onClick={() => handleExpandImage(image)}
          >
            {image.image_base64 ? (
              <img
                src={image.image_base64}
                alt={image.description || 'Imagem da sessão'}
                className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                <ImageOff className="h-12 w-12" />
                <p>Imagem não disponível</p>
              </div>
            )}
            <div className="p-2 bg-white text-gray-800 text-sm">
              {editingImageId === image.id ? (
                // --- Modo de Edição (Card Normal) ---
                <div className="space-y-2">
                  <Textarea
                    value={editingDescription}
                    onChange={(e) => { e.stopPropagation(); setEditingDescription(e.target.value); }}
                    placeholder="Descrição da imagem"
                    rows={2}
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label className="flex items-center text-sm text-gray-700" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={editingPrivacy}
                      onChange={(e) => { e.stopPropagation(); setEditingPrivacy(e.target.checked); }}
                      className="mr-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                    Privada
                  </label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(image.id); }}
                      disabled={loading}
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                // --- Modo de Visualização (Card Normal) ---
                <>
                  <p className="font-medium line-clamp-2">{image.description || 'Sem descrição'}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    {image.is_private ? (
                      <>
                        <Lock className="h-3 w-3 mr-1" />
                        <span>Privada</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3 mr-1" />
                        <span>Pública</span>
                      </>
                    )}
                  </div>
                  {isMaster && (
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
                  )}
                </>
              )}
            </div>
          </div>
        ))}
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