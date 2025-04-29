// src/components/session/SessionImageUpload.tsx

'use client';

import { useState } from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';
// Adicione esta importação para usar o hook useSession
import { useSession } from '@supabase/auth-helpers-react';

interface SessionImageUploadProps {
  sessionId: string;
}

// Esta constante pode ficar fora do componente se quiser
const EDGE_FUNCTION_NAME = 'upload-session-image';

export default function SessionImageUpload({ sessionId }: SessionImageUploadProps) {
  const supabase = createClientComponentClient();
  // Adicione esta linha para obter a sessão usando o hook useSession
  const session = useSession(); // <-- Agora 'session' está no escopo do componente

  const [images, setImages] = useState<ImageListType>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [privacies, setPrivacies] = useState<boolean[]>([]);
  const [uploading, setUploading] = useState(false);

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
      const file = image.file;

      if (!file) {
        hasError = true;
        toast.error(`Arquivo inválido para a imagem no índice ${i}`);
        continue;
      }

      // Prepara os dados para enviar para a Edge Function usando FormData
      const formData = new FormData();
      formData.append('file', file);
      // Agora 'sessionId' (prop), 'descriptions', 'privacies' (estado) estão acessíveis
      formData.append('sessionId', sessionId);
      formData.append('description', descriptions[i]);
      formData.append('isPrivate', String(privacies[i]));

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`, {
          method: 'POST',
          headers: {
            // 'session.access_token' agora está acessível
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || `Erro na Edge Function: Status ${response.status}`);
        }

        const result = await response.json();
        console.log(`Upload e salvamento via Edge Function bem-sucedido para ${file.name}:`, result);
        toast.success(`Imagem ${file.name} enviada com sucesso!`);

      } catch (error: any) {
        toast.error(`Erro ao enviar imagem ${file.name}: ${error.message}`);
        console.error(`Erro ao chamar Edge Function para ${file.name}:`, error);
        hasError = true;
      }
    }

    if (!hasError) {
      // 'setImages', 'setDescriptions', 'setPrivacies' estão acessíveis
      setImages([]);
      setDescriptions([]);
      setPrivacies([]);
    } else {
      toast.info("Algumas imagens falharam ao enviar. Verifique o console do navegador e os logs da Edge Function para detalhes.");
    }

    setUploading(false); // 'setUploading' está acessível
  };


  return (
    // O restante do seu JSX que usa onChange, handleUpload, images, uploading etc.
    // pode permanecer o mesmo.
    <div className="bg-white rounded-lg shadow p-4 mt-6">
      <h3 className="text-lg font-semibold mb-2">Imagens da Sessão</h3>
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
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              style={isDragging ? { color: 'red' } : undefined}
              onClick={onImageUpload}
              {...dragProps}
            >
              Selecionar Imagens
            </button>
            &nbsp;
            <button
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              onClick={onImageRemoveAll}
            >
              Remover Todas
            </button>
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