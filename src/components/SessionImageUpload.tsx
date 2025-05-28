// src/components/session/SessionImageUpload.tsx

'use client';

import { useState, useEffect } from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';
// Adicione esta importação para usar o hook useSession
import { useSession } from '@supabase/auth-helpers-react';
import { Button } from './ui/button';
import { ImageListModal } from './modals/ImageListModal';

interface SessionImageUploadProps {
  sessionId: string;
  isMaster: boolean;  // Add this line
}

interface SessionImage {
  id: string;
  description: string | null;
  is_private: boolean;
  image_base64: string;
}

export default function SessionImageUpload({ sessionId, isMaster }: SessionImageUploadProps) {
  const supabase = createClientComponentClient();
  // Adicione esta linha para obter a sessão usando o hook useSession
  const session = useSession(); // <-- Agora 'session' está no escopo do componente

  const [images, setImages] = useState<ImageListType>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [privacies, setPrivacies] = useState<boolean[]>([]);
  const [uploading, setUploading] = useState(false);
  const [savedImages, setSavedImages] = useState<SessionImage[]>([]);
  const [isListModalOpen, setIsListModalOpen] = useState(false); // Novo estado para o modal de lista
  const [isMasterState, setIsMaster] = useState(false);

  const onChange = (imageList: ImageListType) => {
    setImages(imageList);
    setDescriptions(imageList.map(() => ''));
    setPrivacies(imageList.map(() => false));
  };

  // MOVA a função handleUpload AQUI DENTRO do componente
  const handleUpload = async () => {
    // Agora 'session' (obtido pelo hook acima) está acessível aqui
    
    console.log("--- handleUpload called ---"); // Primeiro log: a função foi chamada?
    console.log("Current session value:", session); // Segundo log: qual o valor da variável 'session'?
    console.log("Number of images selected:", images.length); // Terceiro log: quantas imagens estão no estado 'images'?
  
    
    if (!session) {
      toast.error('Você precisa estar logado para enviar imagens.');
      setUploading(false); // Garantir que o estado de upload seja falso
      return;
    }

    setUploading(true);
    let hasError = false;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      const imageBase64String = image.data_url;

      if (!imageBase64String) { // Verifica se a string Base64 existe
        hasError = true;
        toast.error(`Dados da imagem inválidos para a imagem no índice ${i}`);
        continue;
      }

      try {
        // Agora, insira diretamente no Supabase DB
        const { data, error } = await supabase
          .from('session_images')
          .insert({
            session_id: sessionId,
            image_base64: imageBase64String, // Nova coluna para o Base64
            description: descriptions[i],
            is_private: privacies[i],
          });

        if (error) {
          throw new Error(error.message || `Erro ao salvar imagem no banco de dados: ${error.code}`);
        }

        console.log(`Inserção da imagem Base64 bem-sucedida para imagem no índice ${i}:`, data);
        toast.success(`Imagem ${i + 1} enviada com sucesso!`);

      } catch (error: any) {
          toast.error(`Erro ao enviar imagem ${i + 1}: ${error.message}`);
          console.error(`Erro ao salvar imagem Base64 no Supabase DB para imagem no índice ${i}:`, error);
          hasError = true;
      }
    }

    if (!hasError) {
      setImages([]);
      setDescriptions([]);
      setPrivacies([]);
      toast.success("Todas as imagens foram enviadas com sucesso!");
      fetchSavedImages(); // Atualiza a lista após o upload bem-sucedido
    } else {
      toast.info("Algumas imagens falharam ao enviar. Verifique o console do navegador para detalhes.");
    }

    setUploading(false);
  };

  const fetchSavedImages = async () => {
    try {
      const { data, error } = await supabase
        .from('session_images')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Erro ao carregar imagens');
    }
  };

  const handleEditImage = async (image: SessionImage) => {
    // Implement edit functionality
    console.log('Edit image:', image);
  };

  const handleDeleteImage = async (imageId: string, description: string | null) => {
    try {
      const { error } = await supabase
        .from('session_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      
      toast.success('Imagem excluída com sucesso');
      fetchSavedImages(); // Atualiza a lista local
      // Emitir um evento personalizado para notificar outros componentes
      window.dispatchEvent(new CustomEvent('imageDeleted', { detail: imageId }));
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Erro ao excluir imagem');
    }
  };

  const handleSaveImage = async (imageId: string, description: string, isPrivate: boolean) => {
    try {
      const { error } = await supabase
        .from('session_images')
        .update({
          description: description,
          is_private: isPrivate,
        })
        .eq('id', imageId);

      if (error) throw error;
      
      toast.success('Imagem atualizada com sucesso');
      fetchSavedImages(); // Refresh the images list
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Erro ao atualizar imagem');
    }
  };

  // Add useEffect to fetch images when component mounts
  useEffect(() => {
    fetchSavedImages();
  }, [sessionId]);

  // Adicione um useEffect para escutar mudanças em tempo real
  useEffect(() => {
    const channel = supabase
      .channel(`session_images_${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'session_images',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Change received!', payload);
          // Atualiza a lista de imagens salvas quando houver qualquer mudança
          fetchSavedImages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const refreshImages = async () => {
    try {
      const { data, error } = await supabase
        .from('session_images')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedImages(data);
    } catch (error) {
      console.error('Error refreshing images:', error);
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-t-lg shadow px-4 py-2 mt-6">
      <div className="flex border-b-2 mb-2 justify-between items-center">
        <h3 className="text-lg font-semibold text-white items-center flex gap-1 mb-2">
          Imagens da Sessão
          <span className="material-symbols-rounded">add_photo_alternate</span>
        </h3>
        
        {/* Botão Ver Tudo acessível para todos */}
        <button
          onClick={() => setIsListModalOpen(true)}
          className="px-4 mb-2 py-2 bg-green-600 text-sm text-white rounded hover:bg-green-700"
        >
          Ver Tudo
        </button>
      </div>
        
      {/* Condicional para mostrar o uploader apenas para o mestre */}
      {isMaster && (
        <ImageUploading
          multiple
          value={images}
          onChange={onChange}
          maxNumber={10}
          dataURLKey="data_url"
        >
          {({
            imageList,
            onImageUpload,
            onImageRemoveAll,
            onImageUpdate,
            onImageRemove,
            isDragging,
            dragProps,
          }) => (
            <div className="upload__image-wrapper">
              <div className='space-x-3'>
                <button
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  style={isDragging ? { color: 'red' } : undefined}
                  onClick={onImageUpload}
                  {...dragProps}
                >
                  Importar Imagens
                </button>
                
                <button
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  onClick={onImageRemoveAll}
                >
                  Desfazer todas
                </button>
              </div>
              {imageList.map((image, index) => (
                <div key={index} className="mt-4 flex flex-col md:flex-row items-start md:items-center">
                  <img src={image.data_url} alt="" width="100" className="rounded" />
                  <div className="ml-4 flex-1">
                    <textarea
                      className="w-full border border-gray-300 rounded p-2"
                      rows={2}
                      placeholder="Descrição da imagem..."
                      value={descriptions[index]}
                      onChange={(e) => {
                        const newDescriptions = [...descriptions];
                        newDescriptions[index] = e.target.value;
                        setDescriptions(newDescriptions);
                      }}
                    />
                    <label className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        checked={privacies[index]}
                        onChange={(e) => {
                          const newPrivacies = [...privacies];
                          newPrivacies[index] = e.target.checked;
                          setPrivacies(newPrivacies);
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700">Privada</span>
                    </label>
                    <div className="mt-2 flex space-x-2">
                      <button
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        onClick={() => onImageUpdate(index)}
                      >
                        Atualizar
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => onImageRemove(index)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ImageUploading>
      )}

      {/* ImageListModal - Agora passa o isMaster para controlar os privilégios */}
      <ImageListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        images={savedImages}
        onEdit={handleEditImage}
        onDelete={handleDeleteImage}
        onSave={handleSaveImage}
        isEditing={false}
        isMaster={isMaster}
        onRefresh={refreshImages} // Passando a função de atualização
      />
      
      {images.length > 0 && (
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={handleUpload} // handleUpload agora está no escopo correto
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : 'Enviar Imagens'}
          </button>
        </div>
      )}
    </div>
  );
}