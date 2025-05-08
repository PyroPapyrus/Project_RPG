// src/components/modals/EditWorldStoryModal.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';

// Componentes reutilizados
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/FormInput';
import { SubmitButton } from '@/components/SubmitButton';
import { ErrorPopup } from '@/components/ErrorPopup';

interface EditWorldStoryModalProps {
  isOpen: boolean; // Controla a visibilidade do modal
  onClose: () => void; // Função para fechar o modal (cancelar ou após salvar)
  campaignId: string; // ID da campanha para saber qual world_story atualizar
  initialWorldStory: string | null; // Conteúdo atual do world_story para carregar no modal
  onSaveSuccess: (updatedWorldStory: string | null) => void; // Callback após salvar com sucesso
}

export default function EditWorldStoryModal({
  isOpen,
  onClose,
  campaignId,
  initialWorldStory,
  onSaveSuccess,
}: EditWorldStoryModalProps) {
  const supabase = createClientComponentClient();
  const [worldStory, setWorldStory] = useState<string | null>(initialWorldStory); // Estado interno para o conteúdo editável
  const [loading, setLoading] = useState(false); // Estado de loading para o salvamento
  const [error, setError] = useState<string | null>(null); // Estado para erros

  // Efeito para carregar o conteúdo inicial quando o modal abre ou initialWorldStory muda
  useEffect(() => {
    setWorldStory(initialWorldStory);
    setError(null); // Limpa o erro ao abrir/atualizar
    setLoading(false); // Garante que o loading esteja falso ao abrir
  }, [initialWorldStory, isOpen]); // Depende do conteúdo inicial e se o modal está aberto

  // Handler para salvar a História do Mundo
  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); // Previne o recarregamento da página se usado em um form

    if (!campaignId) {
      setError('ID da campanha não fornecido.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ world_story: worldStory }) // Atualiza o campo com o estado interno
        .eq('id', campaignId) // Onde o ID é o da campanha atual
        .select('world_story') // Pede para retornar o campo atualizado de volta
        .single(); // Espera um único resultado

      if (error) throw error;

      // Se data retornar o campo atualizado, use-o; caso contrário, use o estado local
      const updatedContent = data ? data.world_story : worldStory;

      toast.success('História do Mundo salva com sucesso!');
      onSaveSuccess(updatedContent); // Chama o callback no componente pai
      // Não feche o modal aqui; onSaveSuccess no pai deve fechá-lo após atualizar o estado global
      // onClose(); // O pai gerencia o fechamento via estado isOpen

    } catch (err: any) {
      console.error('Erro ao salvar world_story:', err);
      setError(err.message || 'Erro ao salvar a História do Mundo.');
      toast.error('Falha ao salvar a História do Mundo.');
    } finally {
      setLoading(false);
    }
  };

  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  // Renderização do Modal
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl shadow-xl transform transition-all duration-300 ease-in-out scale-100"> {/* Aumentei o max-w para 5xl para deixar mais largo */}
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Editar História do Mundo</h2>
          {/* Botão de Fechar */}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
            ✕
          </Button>
        </div>

        {/* Popup de Erro */}
        {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

        {/* Formulário (ou apenas a área de texto e botão) */}
        {/* Usamos um form para que o SubmitButton funcione corretamente, mesmo com um textarea */}
        <form onSubmit={handleSave} className="space-y-5 mt-4">
          <div className="space-y-1">
            <label htmlFor="world_story_modal" className="block text-sm font-medium text-gray-700 sr-only"> {/* sr-only: esconde visualmente mas mantém para leitores de tela */}
               Conteúdo da História do Mundo
            </label>
            <FormInput
              id="world_story_modal"
              name="world_story_modal"
              type="textarea" // Define como textarea
              placeholder="Escreva a história do mundo da sua campanha aqui..."
              value={worldStory || ''} // Usa o estado interno
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWorldStory(e.target.value)} // Atualiza o estado interno
              rows={15} // Define um número de linhas para o textarea
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" // resize-y permite redimensionar verticalmente
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button" // Importante para não submeter o form
              variant="outline"
              onClick={onClose} // Chama a função de fechar passada por props
              disabled={loading}
            >
              Cancelar
            </Button>
            <SubmitButton
              loading={loading}
              loadingText="Salvando..."
              buttonText="Salvar"
              // SubmitButton dentro de um form aciona o onSubmit do form
              // Não precisa de onClick aqui se o type for submit
            />
          </div>
        </form>
      </div>
    </div>
  );
}