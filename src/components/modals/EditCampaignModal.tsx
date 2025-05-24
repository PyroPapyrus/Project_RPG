// src/components/modals/EditCampaignModal.tsx

'use client'; // Garante que é um componente cliente

import { useState, FormEvent, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Campaign } from '@/types/campaign'; // Importa o tipo Campaign

// Componentes reutilizados do seu projeto
import { Button } from '@/components/ui/button'; // Seu botão padrão
import { FormInput } from '@/components/FormInput'; // Seu input de formulário
import { SubmitButton } from '@/components/SubmitButton'; // Seu botão de submit com loading
import { ErrorPopup } from '@/components/ErrorPopup'; // Seu popup de erro
import { CloseModalButton } from '@/components/ui/close-modal-button'; // Botão de fechar modal

// Interface para os dados do formulário de edição de campanha
interface EditCampaignFormData {
  name: string;
  description: string;
  system: string;
  max_players: number;
  status: 'em_andamento' | 'hiato' | 'concluido';
  // Quaisquer outros campos editáveis da campanha
  world_story: string | null; // Adicionado com base no seu tipo Campaign
  invite_code: string | null; // Adicionado com base no seu tipo Campaign (talvez não editável, mas incluído por completeza)
}

// Interface de Props para este componente Modal de Edição de Campanha
interface EditCampaignModalProps {
  isOpen: boolean;                          // Controla se o modal está visível
  onClose: () => void;                      // Função para fechar o modal (chamada ao cancelar ou fechar)
  campaign: Campaign | null;                // A campanha a ser editada (será null quando fechado)
  onCampaignUpdated: (updatedCampaign: Campaign) => void; // Callback após atualizar a campanha com sucesso
}

export default function EditCampaignModal({
  isOpen,
  onClose,
  campaign, // Recebe a campanha para editar
  onCampaignUpdated
}: EditCampaignModalProps) {

  const supabase = createClientComponentClient();
  // Inicializa o estado do formulário com dados padrão (serão preenchidos no useEffect)
  const [formData, setFormData] = useState<EditCampaignFormData>({
    name: '',
    description: '',
    system: '',
    max_players: 8, // Valor padrão inicial
    status: 'em_andamento', // Valor padrão inicial
    world_story: null,
    invite_code: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Efeito para popular o formulário quando a prop 'campaign' mudar (ou quando o modal abrir com uma campanha)
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description,
        system: campaign.system,
        max_players: campaign.max_players || 8, // Usar 8 como fallback se for null/undefined
        status: campaign.status || 'em_andamento', // Usar padrão como fallback
        world_story: campaign.world_story,
        invite_code: campaign.invite_code,
      });
      setError(null); // Limpa erros anteriores ao abrir para editar
    } else {
        // Se o modal estiver fechando (campaign se torna null), resetar o form e estados
         setFormData({
            name: '', description: '', system: '', max_players: 8, status: 'em_andamento',
            world_story: null, invite_code: null
         });
         setError(null);
         setLoading(false);
    }
  }, [campaign]); // Dependência: campaign prop

  // Lida com o envio do formulário (Atualização)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!campaign) { // Garante que há uma campanha para editar
        setError("Nenhuma campanha selecionada para editar.");
        return;
    }

    // Validação básica
    if (!formData.name || !formData.description || !formData.system) {
      setError("Nome, Descrição e Sistema são obrigatórios.");
      return;
    }
     if (formData.max_players < 1 || formData.max_players > 20) {
        setError("Limite de jogadores deve ser entre 1 e 20.");
        return;
     }


    setError(null);
    setLoading(true);

    try {
      // --- LÓGICA DE ATUALIZAÇÃO ---
      const { data, error: updateError } = await supabase
        .from('campaigns')
        .update({ // Use .update()
          name: formData.name,
          description: formData.description,
          system: formData.system,
          max_players: formData.max_players,
          status: formData.status,
          world_story: formData.world_story, // Incluindo outros campos se forem editáveis
          // invite_code geralmente NÃO é editável aqui, remova se necessário
        })
        .eq('id', campaign.id) // Condição: Atualizar APENAS a campanha com o ID correto
        .select() // Pede para retornar o registro ATUALIZADO
        .single(); // Espera que apenas um registro seja retornado (o que foi atualizado)

      if (updateError) {
        console.error("Supabase Update Error (Campaign):", updateError);
        throw new Error(updateError.message || "Erro ao atualizar a campanha no banco de dados.");
      }

       if (!data) {
          throw new Error("Não foi possível obter os dados da campanha atualizada.");
       }

      // Sucesso!
      onCampaignUpdated(data as Campaign); // Chama o callback passando a campanha ATUALIZADA
      // O callback na página pai fechará o modal

    } catch (err: any) {
      console.error("Erro ao editar campanha:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false); // Garante que o loading termine
    }
  };

  // Se não estiver aberto OU NÃO TIVER CAMPANHA para editar, não renderiza nada
  if (!isOpen || !campaign) {
    return null;
  }

  // Renderização do Modal (similar aos outros modais)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">

        <div className='flex justify-between pb-2 mb-2 border-b-2'>
          <h2 className="text-2xl font-bold">Editar Campanha</h2>
          <CloseModalButton onClose={onClose} />
        </div>
        {/* Popup de Erro */}
        {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">

          <label className="block text-sm font-medium text-gray-700">
            Nome da Campanha
          </label>
          <FormInput
            id="edit_campaign_name" // ID único para este modal
            name="name"
            type="text"
            placeholder="Nome da Campanha"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            maxLength={40}
            style={{ border: '1px solid #ccc', borderRadius: '0px' }}
          />
            
          <label className="block text-sm font-medium text-gray-700 mt-2">
            Descrição breve
          </label>
          <FormInput
            id="edit_campaign_description"
            name="description"
            type="textarea"
            placeholder="Faça uma descrição breve que contextualize sua campanha!"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
            required
            maxLength={500}
            style={{ border: '1px solid #ccc', borderRadius: '0px' }}
          />
          <p className="-mt-2 text-xs text-gray-500">
            {formData.description.length}/500 caracteres
          </p>

          <label className="block text-sm font-medium text-gray-700 mt-2">
            Sistema da Campanha
          </label>
          <FormInput
            id="edit_campaign_system"
            name="system"
            type="text"
            placeholder="D&D 5e, Pathfinder, etc."
            value={formData.system}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, system: e.target.value })}
            required
            maxLength={40}
            style={{ border: '1px solid #ccc', borderRadius: '0px' }}
          />

          <label className="block text-sm font-medium text-gray-700 mt-2">
            Limite de Jogadores
          </label>
          <p className="text-sm text-gray-500 mb-1">
            Defina o número máximo de jogadores que poderão participar da campanha (sem contar você, o mestre).
          </p>
          <FormInput
            id="edit_campaign_max_players" // ID único
            name="max_players"
            type="number"
            placeholder="Ex: 5"
            value={formData.max_players.toString()} // Input type="number" espera string
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseInt(e.target.value);
                // Adicionar validação básica no cliente (pode ser no backend também)
                if (!isNaN(value)) { // Verifica se o parsing foi bem-sucedido
                  setFormData({ ...formData, max_players: value });
                } else if (e.target.value === '') { // Permite limpar o campo
                  setFormData({ ...formData, max_players: 0 }); // Ou outro valor padrão/nulo
                }
            }}
            required
            min={1} // Validação HTML5
            max={20} // Validação HTML5
            style={{ border: '1px solid #ccc', borderRadius: '0px' }}
          />

          <label className="block text-sm font-medium text-gray-700 mt-2">
            Status da Campanha
          </label>
          <select
            id="edit_campaign_status" // ID único
            name="status"
            value={formData.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as 'em_andamento' | 'hiato' | 'concluido' })}
            className="block w-full pl-3 py-2 border border-gray-300 focus:border-blue-500 sm:text-sm"
          >
            <option value="em_andamento">Em Andamento</option>
            <option value="hiato">Em Hiato</option>
            <option value="concluido">Concluído</option>
          </select>

          {/* Botões de Ação */}
          <div className="space-y-2 mt-2">

            {/* Botão Salvar */}
            <SubmitButton
              loading={loading}
              loadingText="Salvando..."
              buttonText="Salvar Alterações"
              // Outras props
            />

            {/* Botão Cancelar */}
            <Button
              type="button" // Importante ser 'button'
              variant="outline"
              onClick={onClose} // Chama onClose das props
              disabled={loading}
              className="w-full text-lg"
            >
              Cancelar
            </Button>
                
          </div>
        </form>
      </div>
    </div>
   
  );
}