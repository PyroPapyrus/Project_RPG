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
    } else {
      toast.info("Algumas imagens falharam ao enviar. Verifique o console do navegador para detalhes.");
    }

    setUploading(false);
  };

  return (

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