'use client'

import { useEffect, useState, useCallback } from 'react' // Importe useCallback
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

// Importe os novos Modais
import EditCampaignModal from '@/components/modals/EditCampaignModal'; // <--- Importe o modal de edição
import ConfirmationModal from '@/components/modals/ConfirmationModal'; // <--- Importe o modal de confirmação
import { toast } from 'react-toastify'; // Importe o toast


export default function DashboardPage() {
  const [masterCampaigns, setMasterCampaigns] = useState<Campaign[]>([])
  const [playerCampaigns, setPlayerCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  // --- ESTADOS PARA EXCLUSÃO E EDIÇÃO (AGORA GERENCIADOS AQUI NA PÁGINA) ---
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null) // Armazena a campanha a ser excluída
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null) // Armazena a campanha a ser editada
  // --- FIM ESTADOS GERENCIADOS ---


  const [activeTab, setActiveTab] = useState<'master' | 'player'>('master')
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()


  // --- FUNÇÃO PARA CARREGAR CAMPANHAS (AGORA OTIMIZADA COM useCallback) ---
  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true); // Move loading para o início da função de carregamento
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
         setLoading(false);
         router.push('/login'); // Redirecionar se não autenticado
         return;
      }

      // --- BUSCAR CAMPANHAS DO MESTRE ---
      const { data: masterData, error: masterError } = await supabase
        .from('campaigns')
        .select(`
          *,
          players:campaign_players(count)
        `)
        .eq('master_id', user.id)
        .order('created_at');

        if(masterError) {
             console.error("Erro ao buscar campanhas do mestre:", masterError);
             // Tratar erro
        }

        // --- BUSCAR CAMPANHAS DO JOGADOR (usando a view) ---
        const { data: playerData, error: playerError } = await supabase
        .from('view_campaign_players_visible') // Usando a view
        .select(`
          campaigns:campaign_id (
            *,
            players:campaign_players(count)
          )
        `)
        .eq('user_id', user.id);

        if(playerError) {
            console.error("Erro ao buscar campanhas do jogador:", playerError);
            // Tratar erro
        }


      // --- PROCESSAR DADOS ---
      // Adicionando tratamento para caso os dados sejam null ou undefined
      const processedMasterData = (masterData || []).map(campaign => ({
        ...campaign, // Espalha as propriedades existentes
        players_count: campaign.players?.[0]?.count || 0
      })) as Campaign[]; // Garante o tipo

      // Definindo um tipo mais claro para o resultado da view antes do map
      type PlayerCampaignRaw = {
        campaigns: Campaign & {
          players?: { count: number }[];
        };
      };

      // --- TRECHO CORRIGIDO PARA PROCESSAR playerData ---
      const processedPlayerData = ((playerData || []) as unknown as PlayerCampaignRaw[]) // <-- Adicionado 'as unknown' aqui
        .filter(item => item.campaigns && typeof item.campaigns === 'object' && !Array.isArray(item.campaigns)) // Filtra itens inválidos
        .map(item => ({
          ...item.campaigns, // Espalha as propriedades da campanha aninhada
          players_count: item.campaigns.players?.[0]?.count || 0
        })) as Campaign[];
      // --- FIM TRECHO CORRIGIDO ---


      setMasterCampaigns(processedMasterData);
      setPlayerCampaigns(processedPlayerData);

      console.log('Processed Master Data:', processedMasterData); // Logar dados processados
      console.log('Processed Player Data:', processedPlayerData); // Logar dados processados

    } catch (error) {
      console.error('Erro ao carregar campanhas (catch geral):', error);
      toast.error('Ocorreu um erro ao carregar as campanhas.'); // Toast para erro geral
    } finally {
      setLoading(false); // Define loading como false no finally
    }
  }, [supabase, router]); // Adicionado router como dependência

  // --- USE EFFECT PARA CARREGAR AO MONTAR ---
  useEffect(() => {
     loadCampaigns(); // Chama a função de carregamento inicial
  }, [loadCampaigns]); // Dependência: loadCampaigns


  // --- HANDLER PARA EXCLUIR CAMPANHA (AGORA COM CALLBACK DE CONFIRMAÇÃO) ---
  // O handler original no CampaignCard agora apenas define campaignToDelete
  const handleConfirmDeleteCampaign = async () => { // Esta função é chamada pelo ConfirmationModal
    if (!campaignToDelete) return; // Garante que há uma campanha para deletar

    try {
      setLoading(true); // Mostra loading enquanto deleta
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignToDelete.id); // Usa o ID da campanha no estado campaignToDelete

      if (error) throw error;

      toast.success(`Campanha "${campaignToDelete.name}" excluída com sucesso.`); // Toast de sucesso
      // Não precisa mais chamar setDeletingCampaign(null) aqui, o onClose do modal fará isso no finally
      loadCampaigns(); // Recarrega a lista de campanhas
    } catch (error: any) {
      console.error('Erro ao excluir campanha:', error);
      toast.error(`Erro ao excluir campanha: ${error.message || 'Desconhecido'}`); // Toast de erro
    } finally {
      setLoading(false); // Remove loading
       setCampaignToDelete(null); // Garante que o estado seja limpo (fecha o modal de confirmação)
    }
  }
  // --- FIM HANDLER EXCLUIR ---


  // --- HANDLER PARA CLICAR EM EDITAR CAMPANHA ---
  const handleEditCampaignClick = (campaign: Campaign) => {
    setCampaignToEdit(campaign); // Define a campanha a ser editada no estado. Isso abrirá o modal.
  };
  // --- FIM HANDLER EDITAR ---

// --- HANDLER PARA QUANDO A CAMPANHA FOR ATUALIZADA NO MODAL ---
  const handleCampaignUpdated = () => {
       console.log("Dashboard: handleCampaignUpdated chamado."); // Mantenha para debug
       setCampaignToEdit(null); // <--- ADICIONE ESTA LINHA DE VOLTA! ISSO FECHA O MODAL.
       console.log("Dashboard: campaignToEdit definido como null."); // Mantenha para debug
       loadCampaigns(); // Recarrega a lista de campanhas
       console.log("Dashboard: loadCampaigns chamado."); // Mantenha para debug
       // O toast de sucesso já está dentro do EditCampaignModal (ou adicione aqui se preferir)
    };
    // --- FIM HANDLER CAMPANHA ATUALIZADA ---


  if (loading) {
    // Use o estado loading geral para mostrar o spinner enquanto carrega TUDO
     return (
      <div className="flex items-center justify-center min-h-screen">
         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
       </div>
     );
   }

  // Se não está carregando E não tem campanhas mestre nem jogador, e não tem um erro genérico visível
  // Pode ser que não esteja autorizado ou não encontrou as campanhas
  const noCampaignsLoaded = !loading && masterCampaigns.length === 0 && playerCampaigns.length === 0;
  const potentialAuthError = !loading && !masterCampaigns.length && !playerCampaigns.length; // Indicador simples


  // Considere se você quer mostrar uma mensagem diferente se o usuário não estiver autorizado
  // ou se simplesmente não encontrou nenhuma campanha
   /*
   if (potentialAuthError && !userId) { // Se não carregou campanhas E não tem userId (deveria ter redirecionado)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-gray-500 mb-4">Acesso não autorizado. Faça login novamente.</p>
                 <Button onClick={() => router.push('/login')}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Ir para Login
                 </Button>
            </div>
        );
   }
   */


  return (

    <div className="bg-gray-100 min-h-screen"> {/* Adicionado min-h-screen para ocupar a altura */}
      <header className="bg-gray-800 text-white py-4 shadow-md"> {/* Adicionado shadow-md */}
        <div className="container mx-auto px-4 flex justify-between items-center"> {/* Usar container mx-auto */}
          <BackButton />
          <h1 className="text-xl font-semibold"> {/* Reduzido tamanho da fonte */}
            {activeTab === 'master' ? 'Minhas Campanhas' : 'Campanhas que Participo'}
          </h1>
          <LogoutButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8"> {/* Usar container mx-auto */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"> {/* Adicionado gap e flex-col/sm:flex-row */}
          <div className="flex space-x-2 sm:space-x-4"> {/* Ajustado espaçamento para telas pequenas */}
            <button
              className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors text-sm sm:text-base ${ // Ajustado padding e tamanho da fonte
                activeTab === 'master'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('master')}
            >
              <span>Minhas Campanhas</span>
              <span className={`${
                activeTab === 'master' ? 'bg-gray-600' : 'bg-gray-300 text-gray-700' // Consistência na cor do badge
              } px-2 py-0.5 rounded-full text-xs`}> {/* Ajustado tamanho da fonte do badge */}
                {masterCampaigns.length}
              </span>
            </button>

            <button
              className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors text-sm sm:text-base ${ // Ajustado padding e tamanho da fonte
                activeTab === 'player'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('player')}
            >

              <span>Campanhas que jogo</span>
              <span className={`${
                activeTab === 'player' ? 'bg-gray-600' : 'bg-gray-300 text-gray-700' // Consistência na cor do badge
              } px-2 py-0.5 rounded-full text-xs`}> {/* Ajustado tamanho da fonte do badge */}
                {playerCampaigns.length}
              </span>
            </button>
          </div>
          {activeTab === 'master' ? (
              // CreateCampaignButton já controla seu próprio modal
              <CreateCampaignButton onSuccess={loadCampaigns} />
            ) : (
              <Button // Usando seu componente Button agora
                onClick={() => setJoinModalOpen(true)}
                 variant="default" // Exemplo: usar a variante default
                 className="rounded-full px-4 py-2 text-sm sm:text-base" // Ajustado padding/tamanho da fonte
              >
                <Plus className="h-4 w-4 mr-1" /> {/* Ajustado tamanho do ícone */}
                <span>Entrar em Campanha</span>
              </Button>
            )}
        </div>

        {/* --- LISTA DE CAMPANHAS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"> {/* Aumentado para 3 colunas em telas grandes */}
          {loading ? ( // Mostra loading se o estado loading geral for true
              <p className="text-gray-500 col-span-full text-center py-8">Carregando campanhas...</p> // Col-span-full para centralizar
          ) : activeTab === 'master' ? (
            masterCampaigns.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">Você ainda não criou nenhuma campanha.</p> // Col-span-full para centralizar
            ) : (
              masterCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  // Handlers para as ações na CampaignCard
                  onEdit={handleEditCampaignClick} // <--- Define a campanha a ser editada no estado campaignToEdit
                  onDelete={setCampaignToDelete} // <--- Define a campanha a ser deletada no estado campaignToDelete
                />
              ))
            )
          ) : ( // activeTab === 'player'
            playerCampaigns.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">Você ainda não participa de nenhuma campanha.</p> // Col-span-full para centralizar
            ) : (
              playerCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                   // Não passa onEdit/onDelete para campanhas de jogador (se essa for a regra)
                />
              ))
            )
          )}
        </div>
         {/* --- FIM LISTA DE CAMPANHAS --- */}

      </main>

      {/* --- MODAL DE EDIÇÃO DE CAMPANHA --- */}
      {/* Renderiza o modal se campaignToEdit NÃO FOR NULL */}
      {campaignToEdit && (
         <EditCampaignModal
            isOpen={!!campaignToEdit} // Aberto se campaignToEdit não for null
            onClose={() => setCampaignToEdit(null)} // Fechar modal limpando o estado
            campaign={campaignToEdit} // Passa a campanha a ser editada
            onCampaignUpdated={handleCampaignUpdated} // Callback após salvar
         />
      )}
      {/* --- FIM MODAL DE EDIÇÃO --- */}


      {/* --- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
      {/* Renderiza o modal se campaignToDelete NÃO FOR NULL */}
      {campaignToDelete && (
         <ConfirmationModal
            isOpen={!!campaignToDelete} // Aberto se campaignToDelete não for null
            onClose={() => setCampaignToDelete(null)} // Chamado ao cancelar/fechar (limpa estado)
            message={`Tem certeza que deseja excluir a campanha "${campaignToDelete.name}"? Esta ação não pode ser desfeita. Todas as sessões, notas e dados de jogadores relacionados também serão excluídos!`} // Mensagem específica
            onConfirm={handleConfirmDeleteCampaign} // Chamado ao confirmar (executa delete)
            title="Confirmar Exclusão da Campanha" // Título específico
            confirmButtonText="Excluir Campanha" // Texto específico para o botão de confirmação
            isConfirmDestructive={true} // Indica que a ação é destrutiva (botão vermelho)
         />
      )}
      {/* --- FIM MODAL CONFIRMAÇÃO --- */}


      {/* Modal de Entrada em Campanha */}
      <JoinCampaignModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={loadCampaigns} // Recarrega campanhas após entrar em uma
      />

       {/* Opcional: Renderiza os toasts */}
       {/* <ToastContainer /> */}


    </div>
  )
}