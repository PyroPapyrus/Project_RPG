'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign } from '@/types/campaign'
import { CreateCampaignButton } from '@/components/CreateCampaignButton'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LogoutButton from '@/components/LogoutButton'
import JoinCampaignModal from '@/components/modals/JoinCampaignModal'
import { CampaignCard } from '@/components/CampaignCard'
import { BackButton } from '@/components/ui/back-button'

// Importe o componente CampaignFilter e seus tipos
import { CampaignFilter, CampaignStatusFilter, CampaignSortBy } from '@/components/CampaignFilter'; // <--- Import CampaignFilter and types

// Importe os outros Modais
import EditCampaignModal from '@/components/modals/EditCampaignModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { toast } from 'react-toastify';

// Defina o tipo para o estado de filtros na página
interface DashboardFilters {
    status: CampaignStatusFilter;
    sortBy: CampaignSortBy;
  }

interface EditCampaignData {
  name: string
  description: string
  system: string
  max_players: number
  status: 'em_andamento' | 'hiato' | 'concluido'
}

export default function DashboardPage() {
  // Armazena os dados BRUTOS, não filtrados/ordenados diretamente do DB
  const [rawMasterCampaigns, setRawMasterCampaigns] = useState<Campaign[]>([])
  const [rawPlayerCampaigns, setRawPlayerCampaigns] = useState<Campaign[]>([])

  // Armazena os dados FILTRADOS e ORDENADOS para exibição na UI
  const [filteredMasterCampaigns, setFilteredMasterCampaigns] = useState<Campaign[]>([])
  const [filteredPlayerCampaigns, setFilteredPlayerCampaigns] = useState<Campaign[]>([])

  const [loading, setLoading] = useState(true)

  // --- ESTADOS PARA EXCLUSÃO E EDIÇÃO ---
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null)
  // --- FIM ESTADOS GERENCIADOS ---

  const [activeTab, setActiveTab] = useState<'master' | 'player'>('master')
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  // --- ESTADO PARA GERENCIAR OS FILTROS DA PÁGINA ---
  // ESTE estado é a fonte de verdade para os filtros
  const [campaignFilters, setCampaignFilters] = useState<DashboardFilters>({
    status: 'todos', // Valor padrão inicial
    sortBy: 'date_desc', // Valor padrão inicial (mais recentes primeiro)
  });

  const router = useRouter()
  const supabase = createClientComponentClient()

  // --- FUNÇÃO PARA BUSCAR CAMPANHAS (SEMPRE BUSCA TUDO SEM FILTRO/ORDENAÇÃO) ---
  // Esta função usa as queries que sabemos que funcionam para buscar dados brutos.
  const fetchRawCampaigns = useCallback(async () => {
    try {
      console.log("fetchRawCampaigns chamado");

      setLoading(true); // Move loading para o início da função de carregamento
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
         console.error("Usuário não autenticado, redirecionando.");
         setLoading(false);
         router.push('/login');
         return;
      }
      console.log("Usuário autenticado:", user.id);


      // --- BUSCAR CAMPANHAS DO MESTRE (QUERY ORIGINAL QUE FUNCIONAVA) ---
      // Sem filtro/ordenação aqui
      const { data: masterData, error: masterError } = await supabase
        .from('campaigns')
        .select(`
          *,
          players:campaign_players(count)
        `)
        .eq('master_id', user.id); // Filtro de mestre permanece


        console.log("Resultado Query Mestre (Raw):", { masterData, masterError });

        if(masterError) {
             console.error("Erro ao buscar campanhas do mestre:", masterError);
             toast.error('Erro ao buscar campanhas do mestre.');
              setLoading(false);
              return;
        }

        // Define um tipo para o resultado esperado da query Mestre
        type MasterCampaignRaw = Campaign & {
            players?: { count: number }[]; // A relação 'players' com count
        };

      const processedMasterData = (masterData as unknown as MasterCampaignRaw[] || []).map(campaign => ({
        ...campaign,
        players_count: campaign.players?.[0]?.count || 0
      })) as Campaign[];


        // --- BUSCAR CAMPANHAS DO JOGADOR (QUERY ORIGINAL QUE FUNCIONAVA) ---
        // Sem filtro/ordenação aqui
        let playerQuery = supabase
        .from('view_campaign_players_visible') // Usando a view
        .select(`
          campaigns:campaign_id (
            *,
            players:campaign_players(count)
          )
        `)
        .eq('user_id', user.id); // Filtro de jogador permanece


        const { data: playerData, error: playerError } = await playerQuery;

        console.log("Resultado Query Jogador (Raw):", { playerData, playerError });

        if(playerError) {
            console.error("Erro ao buscar campanhas do jogador:", playerError);
            toast.error('Erro ao carregar campanhas do jogador.');
             setLoading(false);
             return;
        }

      // --- PROCESSAR DADOS ---
      // Definindo um tipo mais claro para o resultado da view antes do map
      type PlayerCampaignRaw = {
        campaigns: Campaign & {
          players?: { count: number }[];
        };
      };

      // --- TRECHO CORRIGIDO PARA PROCESSAR playerData ---
      const processedPlayerData = ((playerData as unknown as PlayerCampaignRaw[] || []) as PlayerCampaignRaw[])
        .filter(item => item.campaigns && typeof item.campaigns === 'object' && !Array.isArray(item.campaigns))
        .map(item => ({
          ...item.campaigns,
          players_count: item.campaigns.players?.[0]?.count || 0
        })) as Campaign[];


      // --- Armazenar os dados brutos ---
      setRawMasterCampaigns(processedMasterData);
      setRawPlayerCampaigns(processedPlayerData);

      console.log('Dados Brutos do Mestre Buscados:', processedMasterData);
      console.log('Dados Brutos do Jogador Buscados:', processedPlayerData);

    } catch (error) {
      console.error('Erro ao carregar campanhas (catch geral):', error);
      toast.error('Ocorreu um erro ao carregar as campanhas.');
    } finally {
      // Define loading false APÓS buscar os dados brutos
      setLoading(false);
    }
  }, [supabase, router]); // Sem dependência de campaignFilters aqui

  // --- Efeito para buscar dados brutos ao montar ---
  useEffect(() => {
    fetchRawCampaigns();
  }, [fetchRawCampaigns]); // Depende da função fetchRawCampaigns


  // --- Efeito para filtrar e ordenar dados SEMPRE que filtros ou dados brutos mudam ---
  useEffect(() => {
    console.log("Aplicando filtros:", campaignFilters);

    const applyFiltersAndSort = (campaigns: Campaign[]): Campaign[] => {
      let filtered = campaigns;

      // Aplicar Filtro de Status
      if (campaignFilters.status !== 'todos') {
        filtered = filtered.filter(campaign => campaign.status === campaignFilters.status);
      }

      // Aplicar Ordenação
      const sorted = [...filtered].sort((a, b) => { // Cria uma cópia antes de ordenar para não modificar o array original
        if (campaignFilters.sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        } else if (campaignFilters.sortBy === 'name_desc') {
          return b.name.localeCompare(a.name);
        } else if (campaignFilters.sortBy === 'date_asc') {
          // Converte as datas para números (timestamps) para comparar
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else { // date_desc (Mais recentes primeiro)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      return sorted;
    };

    // Aplica os filtros/ordenação aos dados brutos e atualiza os estados filtrados
    setFilteredMasterCampaigns(applyFiltersAndSort(rawMasterCampaigns));
    setFilteredPlayerCampaigns(applyFiltersAndSort(rawPlayerCampaigns));

    console.log("Filtros aplicados. Mestre (filtrado):", filteredMasterCampaigns.length, "Jogador (filtrado):", filteredPlayerCampaigns.length);


  }, [campaignFilters, rawMasterCampaigns, rawPlayerCampaigns]); // Dependências: filtros E dados brutos


  // HANDLER QUE RECEBE FILTROS DO CampaignFilter - Memoizado e atualiza o estado da página
  const handleCampaignFilterChange = useCallback((filters: DashboardFilters) => {
    console.log("Dashboard: handleCampaignFilterChange chamado com filtros:", filters);
    setCampaignFilters(filters); // <-- ATUALIZA O ESTADO NA PÁGINA PAI. Isso dispara o useEffect acima para filtrar/ordenar.
    console.log("Dashboard: campaignFilters state updated.");
  }, []);


  // --- HANDLER PARA EXCLUIR CAMPANHA ---
  const handleConfirmDeleteCampaign = async () => {
    // ... (código existente da função handleConfirmDeleteCampaign) ...
    if (!campaignToDelete) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignToDelete.id);

      if (error) throw error;

      toast.success(`Campanha "${campaignToDelete.name}" excluída com sucesso.`);
      fetchRawCampaigns(); // Recarrega os dados BRUTOS após delete
    } catch (error: any) {
      console.error('Erro ao excluir campanha:', error);
      toast.error(`Erro ao excluir campanha: ${error.message || 'Desconhecido'}`);
    } finally {
      setLoading(false);
       setCampaignToDelete(null);
    }
  }


  // --- HANDLER PARA CLICAR EM EDITAR CAMPANHA ---
  const handleEditCampaignClick = (campaign: Campaign) => {
    setCampaignToEdit(campaign);
  };

  // --- HANDLER PARA QUANDO A CAMPANHA FOR ATUALIZADA ---
  const handleCampaignUpdated = () => {
    console.log("Dashboard: handleCampaignUpdated chamado.");
    setCampaignToEdit(null); // FECHA O MODAL
    console.log("Dashboard: campaignToEdit definido como null.");
    fetchRawCampaigns(); // Recarrega os dados BRUTOS após atualização
    console.log("Dashboard: fetchRawCampaigns chamado após atualização.");
  };

  return (

    <div className="bg-gray-100">
      <header className="bg-gray-800 text-white py-4">
        <div className="mx-auto px-4 flex justify-between items-center">
          <BackButton />
            <h1 className="text-2xl font-semibold">
              {activeTab === 'master' ? 'Minhas Campanhas' : 'Campanhas que Participo'}
            </h1>
          <LogoutButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
          <div className="flex space-x-4">
            <button 
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'master' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('master')}
            >
              <span>Minhas Campanhas</span>
              <span className={`${
                activeTab === 'master' ? 'bg-gray-600' : 'bg-gray-300'
              } px-2 py-0.5 rounded-full text-sm`}>
                {filteredMasterCampaigns.length}
              </span>
            </button>

            <button 
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'player' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('player')}
            >
              <span>Campanhas que jogo</span>
              <span className={`${
                activeTab === 'player' ? 'bg-gray-600' : 'bg-gray-300'
              } px-2 py-0.5 rounded-full text-sm`}>
                {filteredPlayerCampaigns.length}
              </span>
            </button>
          </div>
          {activeTab === 'master' ? (
              <CreateCampaignButton onSuccess={fetchRawCampaigns} />
            ) : (
              <button
                onClick={() => setJoinModalOpen(true)}
                className="bg-black text-white hover:bg-gray-900 rounded-full px-6 py-2 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Entrar em Campanha</span>
              </button>
            )}
        </div>

        {/* --- RENDERIZAÇÃO DO COMPONENTE DE FILTRO --- */}
        {/* PASSA O ESTADO 'campaignFilters' COMO PROP PARA O CAMPAIGNFILTER */}
      <div className="max-w-6xl mx-auto">
           {/* Garanta que CampaignFilter.tsx foi atualizado */}
           <CampaignFilter
            onFilterChange={handleCampaignFilterChange} // Handler para notificar o pai
            filters={campaignFilters} // <-- PASSE O ESTADO campaignFilters COMO PROP AQUI!
           />
      </div>
      {/* --- FIM COMPONENTE DE FILTRO --- */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {activeTab === 'master' ? (
            filteredMasterCampaigns.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-8">Você ainda não criou nenhuma campanha.</p>
            ) : (
              filteredMasterCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={handleEditCampaignClick}
                  onDelete={setCampaignToDelete}
                />
              ))
            )
          ) : (
            filteredPlayerCampaigns.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-8">Você ainda não participa de nenhuma campanha.</p>
            ) : (
              filteredPlayerCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  // Não passa onEdit/onDelete para campanhas de jogador
                />
              ))
            )
          )}
        </div>
      </main>

      {/* --- MODAL DE EDIÇÃO DE CAMPANHA --- */}
      {campaignToEdit && (
         <EditCampaignModal
            isOpen={!!campaignToEdit}
            onClose={() => setCampaignToEdit(null)}
            campaign={campaignToEdit}
            onCampaignUpdated={handleCampaignUpdated} // Chama o handler que busca dados brutos
         />
      )}
      {/* --- FIM MODAL DE EDIÇÃO --- */}

{/* --- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
      {campaignToDelete && (
         <ConfirmationModal
            isOpen={!!campaignToDelete}
            onClose={() => setCampaignToDelete(null)}
            message={`Tem certeza que deseja excluir a campanha "${campaignToDelete.name}"? Esta ação não pode ser desfeita. Todas as sessões, notas e dados de jogadores relacionados também serão excluídos!`}
            onConfirm={handleConfirmDeleteCampaign} // Chama o handler que busca dados brutos
            title="Confirmar Exclusão da Campanha"
            confirmButtonText="Excluir Campanha"
            isConfirmDestructive={true}
         />
      )}
      {/* --- FIM MODAL CONFIRMAÇÃO --- */}
      
      {/* Modal de Entrada em Campanha */}
      <JoinCampaignModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={fetchRawCampaigns} // Chama fetchRawCampaigns ao sucesso
      />

    {/*<div className='absolute'>
        <nav className='flex fixed bottom-[235px] right-[200px] px-4 py-5 bg-black rounded-[25px] shadow-md'>
          <div className='text-white flex flex-col gap-10'>
              <span className="material-symbols-rounded" style={{ fontSize: '45px' }}>
                filter_list
              </span>

              <span className="material-symbols-rounded" style={{ fontSize: '45px' }}>
                settings
              </span>

              <span className="material-symbols-rounded" style={{ fontSize: '45px' }}>
                account_circle
              </span>
          </div>
        </nav>
      </div>*/}

      <div className='absolute'>
        <nav className='fixed bottom-0 left-1/2 transform -translate-x-1/2 px-10 pb-1 pt-2 bg-black rounded-tr-xl rounded-tl-xl '>
          <div className='text-white flex gap-10'>
              <span className="material-symbols-rounded" style={{ fontSize: '40px' }}>
                filter_list
              </span>

              <span className="material-symbols-rounded" style={{ fontSize: '40px' }}>
                settings
              </span>

              <span className="material-symbols-rounded" style={{ fontSize: '40px' }}>
                account_circle
              </span>
          </div>
        </nav>
      </div>
    </div>
  )
}