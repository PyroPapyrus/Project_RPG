'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Users } from 'lucide-react'
import CampaignNotes from '@/components/CampaignNotes'

// Importar tipos existentes
import { type Campaign as CampaignBase } from '@/types/campaign' // Renomeado para evitar conflito
import { type Session } from '@/types/session'

// Importar outros componentes/ícones
import { Button } from '@/components/ui/button'
import {Card, CardDescription, CardFooter,CardHeader, CardTitle} from "@/components/ui/card"
import CreateSessionModal from '@/components/modals/CreateSessionModal'
import EditSessionModal from '@/components/modals/EditSessionModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import EditWorldStoryModal from '@/components/modals/EditWorldStoryModal';
import PlayersManagementModal from '@/components/modals/PlayersManagementModal';
import { toast } from 'react-toastify' // Verifique se 'react-toastify' é o que você usa (antes usou 'react-hot-toast')
import { BackButton } from '@/components/ui/back-button'
import LeaveCampaignButton from '@/components/LeaveCampaignButton'

// --- NOVO TIPO para o estado 'campaign' com a contagem de jogadores ---
// Este tipo estende o seu tipo CampaignBase e adiciona a estrutura para a contagem
interface CampaignWithPlayerCount extends CampaignBase {
    // A estrutura aninhada que vem da seleção embutida 'players:campaign_players(count)'
    players?: { count: number }[];
    // Uma propriedade para armazenar a contagem achatada para fácil acesso
    players_count: number;
}
// --- FIM NOVO TIPO ---

interface PageProps {
 params: {
  id: string
  name: string
 }
}

const Page = ({ params }: PageProps) => {
  // Mude o tipo do estado 'campaign' para o novo tipo com contagem
 const [campaign, setCampaign] = useState<CampaignWithPlayerCount | null>(null)
 const [loading, setLoading] = useState(true)
 const [authorized, setAuthorized] = useState(false)
 const [isMaster, setIsMaster] = useState(false)
 const [sessions, setSessions] = useState<Session[]>([])
 const [sessionsLoading, setSessionsLoading] = useState(true)
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

 // --- ESTADOS PARA EDIÇÃO/EXCLUSÃO DE SESSÃO ---
 const [isEditModalOpen, setIsEditModalOpen] = useState(false)
 const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null)
 const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
 const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
 // --- FIM ESTADOS SESSÃO ---

 // --- ESTADO PARA world_story ---
 const [isWorldStoryModalOpen, setIsWorldStoryModalOpen] = useState(false);
 // --- FIM NOVOS ESTADOS world_story ---

  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);

 const [userId, setUserId] = useState<string | null>(null)

 const router = useRouter()
 const supabase = createClientComponentClient()

 const fetchSessions = useCallback(async (campaignId: string) => {
  setSessionsLoading(true);
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('session_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (!sessionsError) {
    setSessions(sessionsData || []);
  } else {
    console.error("Erro ao buscar sessões:", sessionsError);
    toast.error('Erro ao buscar sessões.');
    setSessions([]);
  }
  setSessionsLoading(false);
 }, [supabase]);

  // --- FUNÇÃO PARA CARREGAR DADOS INICIAIS (COM CONTAGEM DE JOGADORES) ---
  const loadData = useCallback(async () => {
    setLoading(true)
    setAuthorized(false)
    setIsMaster(false)
    setCampaign(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
         setLoading(false);
         router.push('/login');
         return;
      }
      setUserId(user.id)

      // Buscar dados da campanha, incluindo world_story E contagem de jogadores
      // --- MODIFICAR SELECT PARA INCLUIR CONTAGEM DE JOGADORES ---
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        // Seleciona todas as colunas da campanha (*), e a contagem de jogadores (players:campaign_players(count))
        .select(`
          *,
          players:campaign_players(count)
        `)
        // --- FIM MODIFICAÇÃO ---
        .eq('id', params.id)
        .single() as { data: CampaignWithPlayerCount | null, error: any }; // Usar o novo tipo com contagem na type assertion


      if (campaignError || !campaignData) {
         setLoading(false);
         toast.error('Campanha não encontrada ou erro ao carregar.');
         return;
      }

      // --- PROCESSAR DADOS PARA ADICIONAR CONTADOR FACILMENTE ---
      const processedCampaignData: CampaignWithPlayerCount = {
          ...campaignData, // Copia todas as propriedades existentes da campanha (incluindo as colunas originais e 'players')
          players_count: campaignData.players?.[0]?.count || 0 // Acessa a contagem do array 'players' e adiciona como 'players_count', default 0 se nulo/vazio
      };
      // --- FIM PROCESSAMENTO ---


      const expectedSlug = processedCampaignData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      if (expectedSlug !== params.name && params.name !== processedCampaignData.id) {
         router.replace(`/campaign/${processedCampaignData.id}/${expectedSlug}`); // Usar o ID real da campanha
         setLoading(false);
         return;
      }

      let userIsAuthorized = false
      let userIsMaster = false
      // Usar processedCampaignData para as verificações de mestre/autorização
      if (processedCampaignData.master_id === user.id) {
        userIsAuthorized = true
        userIsMaster = true
      } else {
        // Verificar se o usuário é um jogador (essa lógica está correta para verificar se ELE é um jogador específico)
        // Esta query não busca a contagem total, apenas verifica se o usuário logado existe como jogador nesta campanha.
        // Não precisa modificar esta query.
        const { error: playerError, count } = await supabase
          .from('campaign_players')
          .select('user_id', { count: 'exact', head: true })
          .eq('campaign_id', processedCampaignData.id) // Usar processedCampaignData.id
          .eq('user_id', user.id)

        if (!playerError && count && count > 0) {
          userIsAuthorized = true
        } else if (playerError) {
            console.error("Erro ao verificar status de jogador:", playerError);
        }
      }

      setCampaign(processedCampaignData) // Definir o estado com os dados processados, incluindo players_count
      setAuthorized(userIsAuthorized)
      setIsMaster(userIsMaster)

      if (userIsAuthorized) {
         fetchSessions(processedCampaignData.id); // Passar o ID da campanha para buscar sessões
      } else {
         setSessions([]);
         setSessionsLoading(false);
      }

    } catch (error: any) { // Capturar erro como any
      console.error("Erro ao carregar dados da campanha:", error);
      toast.error('Ocorreu um erro ao carregar a campanha.');
      setAuthorized(false);
    } finally {
      setLoading(false)
    }
  }, [supabase, params.id, params.name, router, fetchSessions]); // Verificar dependências se necessário. Adicionado fetchSessions

  useEffect(() => {
    loadData()
  }, [loadData]);


  // --- HANDLER PARA CLICAR NO BOTÃO EDITAR SESSÃO ---
  const handleEditButtonClick = (session: Session) => {
     setSessionToEdit(session);
     setIsEditModalOpen(true);
  };
  // --- FIM HANDLER EDITAR SESSÃO ---

  // --- HANDLER PARA QUANDO A SESSÃO FOR ATUALIZADA ---
  const handleSessionUpdated = () => {
     setIsEditModalOpen(false);
     setSessionToEdit(null);
     fetchSessions(params.id); // Passar o ID da campanha para buscar sessões novamente
     toast.success('Sessão atualizada com sucesso.');
  };
  // --- FIM HANDLER SESSÃO ATUALIZADA ---


  // --- HANDLERS PARA CONFIRMAÇÃO DE EXCLUSÃO DE SESSÃO ---
  const handleDeleteButtonClick = (session: Session) => {
      setSessionToDelete(session);
      setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!sessionToDelete || !userId) return;

      setIsDeleteConfirmOpen(false); // Fecha o modal de confirmação
      setSessionsLoading(true);

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionToDelete.id);

      setSessionsLoading(false);

      if (error) {
          console.error("Erro ao excluir sessão:", error);
          toast.error('Erro ao excluir a sessão.');
      } else {
          toast.success('Sessão excluída com sucesso.');
          setSessionToDelete(null);
          fetchSessions(params.id); // Passar o ID da campanha para buscar sessões novamente
      }
  };

  // --- FIM HANDLERS EXCLUSÃO SESSÃO ---


    // --- HANDLER PARA ATUALIZAR world_story APÓS SALVAR NO MODAL ---
  const handleWorldStorySaved = (updatedWorldStory: string | null) => {
        // Atualiza o estado da campanha com o novo world_story
        if (campaign) {
            setCampaign({
                ...campaign,
                world_story: updatedWorldStory // Usa o conteúdo retornado/salvo
            });
        }
        setIsWorldStoryModalOpen(false); // Fecha o modal
    };
    // --- FIM NOVO HANDLER ---


    // HANDLER para quando a lista de jogadores for atualizada
    const handlePlayersUpdated = () => {
      setIsPlayersModalOpen(false); // Fecha o modal
      loadData(); // Recarrega todos os dados da campanha, incluindo a contagem de jogadores
      toast.success('Jogador removido com sucesso!');
    };


  if (loading) {
    return (
      <div className="flex bg-gray-900 items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!authorized || !campaign) {
    return (
      <div className="flex flex-col bg-gray-900 items-center justify-center min-h-screen">
        <p className="text-white mb-4">Campanha não encontrada ou acesso não autorizado.</p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Dashboard
        </Button>
      </div>
    )
  }   

  return (
    <>
      <div className="flex min-h-screen justify-between">

        <aside className="bg-gray-800 text-white max-w-[420px] max-h-screen break-words overflow-y-auto w-full">
          <header className='bg-gray-900 py-[11px] px-2'>
            <BackButton href='/dashboard'></BackButton>
          </header>
          <div className="pr-5 pl-5 py-5">
            
            <p className='font-bold'>Nome da Campanha</p>
            <p className="text-2xl mb-4 bg-gray-700 px-4 py-1">{campaign.name}</p>
              {/*<p className="text-gray-600 mb-1">{campaign.description}</p>*/}
            <div className='grid grid-cols-2 gap-x-3 gap-y-4'>
              <div>
                <p className='font-bold'>Status</p>
                <p className={`bg-gray-700 px-4 py-1 whitespace-nowrap ${
                  campaign.status === 'concluido' 
                    ? 'text-red-600 font-bold' 
                    : campaign.status === 'hiato'
                    ? 'text-yellow-600 font-bold'
                    : 'text-green-600 font-bold'
                  }`}>
                  {campaign.status === 'concluido' 
                    ? 'Concluído' 
                    : campaign.status === 'hiato'
                    ? 'Em Hiato'
                    : 'Em Andamento'}
                  </p>
              </div>

              <div>
                <p className='font-bold'>Data</p>
                <p className="bg-gray-700 px-4 py-1">
                  {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <p className='font-bold'>Sistema</p>
                <p className='bg-gray-700 px-4 py-1'>{campaign.system}</p>
              </div>

              <div>
                <p className='font-bold'>Jogadores</p>
                <p className='flex justify-content-start mb-4 px-4 bg-gray-700 py-1'>
                  {campaign.players_count}/{campaign.max_players}
                  <span className='material-symbols-rounded' >person</span>
                </p>
              </div>
              
            </div>

            {isMaster && campaign.invite_code && (
              <div className="justify-self-start">
                <p className='font-bold'>Código de Convite</p>
                <div className='flex'>
                  <p className="bg-gray-700 px-6 py-1 text-cyan-400">{campaign.invite_code}</p>
                  <Button 
                    size="sm" 
                    className='rounded-l-none'
                    onClick={() => {
                      navigator.clipboard.writeText(campaign.invite_code || '')

                      const messageDiv = document.createElement('div');
                      messageDiv.textContent = 'Código copiado!';
                      messageDiv.className = 'ml-3 px-3 py-1 bg- font-bold';
                      
                      const container = document.querySelector('#invite-code-container');
                      container?.appendChild(messageDiv);
                      
                      setTimeout(() => messageDiv.remove(), 5000);
                    }}>
                    <span className='material-symbols-rounded' style={{ fontSize: '18px' }}>
                      content_copy
                    </span>
                  </Button>
                  <div id="invite-code-container"></div>
                </div>
              </div>
            )}


             {/* Botão para abrir o modal de gerenciamento de jogadores */}
            {isMaster && (
              <div className="mt-4">
                <Button 
                  onClick={() => setIsPlayersModalOpen(true)}
                  className="w-full justify-center">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Jogadores
                </Button>
              </div>
            )}
            
            
            {/*DIVISOR ESTÉTICO ENTRE OS CAMPOS DA CAMPANHA E O WORLD STORY*/}
            <div className='flex pb-2 mt-6 mb-2 border-b-2'></div>
            
            {/* --- TRECHO PARA world_story --- */}
            
            <div className="bg-black pb-8 mt-8 rounded">
              <div className='flex px-3 py-1 items-center justify-between'>
                <h2 className="whitespace-no-wrap font-bold">História/Contexto da Campanha</h2>
                {isMaster && ( // Apenas o Mestre pode ver o botão de editar
                  <Button className='p-1 hover:bg-white text-white hover:text-black' 
                    variant="ghost" 
                    size='sm' 
                    onClick={() => setIsWorldStoryModalOpen(true)}>
                    <span className="material-symbols-rounded">
                      edit_square
                    </span>
                  </Button>
                )}
              </div>
            
              {/* Exibir world_story para todos (somente leitura) */}
              <div className='max-w-[420px] bg-white shadow-lg shadow-black text-black -mx-2 p-3 rounded-tl-2xl rounded-br-2xl rounded'> 
                {campaign.world_story ? (
                  <p>{campaign.world_story}</p>
                ) : (
                  <p className="text-gray-400 pb-[70px] italic max-w-[420px]">
                    Escreva aqui a história/contextualização do mundo da sua campanha
                  </p>
                )}
              </div>
              {/* Fim Exibição world_story */}
            </div>
            
          </div>
        </aside>

        <div className="max-h-screen bg-gray-500 w-full overflow-y-auto">
          {/* Container for sessions content */}
          <div className="flex-col h-full">
            {/* Header fixed only within this column */}
            <div className="fixed w-[calc(100%-840px)] bg-black/50 px-[55px] py-[14px] z-10">
              <header className="flex items-center justify-between pr-4">
                <h2 className="text-3xl text-white font-bold">Sessões da Campanha</h2>
                {isMaster && (
                  <Button 
                    className='-my-2'
                    onClick={() => setIsCreateModalOpen(true)}>
                    Criar Nova Sessão
                  </Button>
                )}

                {authorized && !isMaster && campaign && userId && (
                  <LeaveCampaignButton
                    campaignId={campaign.id}
                    campaignName={campaign.name}
                    userId={userId}
                    isMaster={isMaster} // Passa o estado isMaster
                    authorized={authorized} // Passa o estado authorized
                    // Se quisesse um callback, passaria aqui: onLeaveSuccess={handleSomethingAfterLeave}
                  />
                )}
              </header>
            </div>

            {/* Sessions content with padding */}
            <div className="p-4 pt-[80px]">
              <div>
                {sessionsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <p className="text-white text-xl">Carregando sessões...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="flex justify-center items-center h-32">
                    <p className="text-white text-xl">Ainda não há sessões registradas para esta campanha.</p>
                  </div>
                ) : (
                  <div className="space-y-5 mx-auto max-w-[900px]">
                    {sessions.map((session) => (
                      <Card key={session.id}>
                        <CardHeader className="grid grid-cols-2 gap-2 bg-gray-700 rounded-t-lg border-2 border-black">
                          <CardTitle className="col-start-1 col-end-3 text-xl text-white font-bold break-words">
                            {session.name}
                            
                          </CardTitle>
                          <div className='col-span-2 col-end-7 justify-self-end'>
                          {isMaster && (
                              <div className='space-x-2 flex'>
                                <Button
                                  className="text-yellow-500 bg-white/10 hover:bg-yellow-500 hover:text-yellow-700" 
                                  size="sm"
                                  onClick={() => handleEditButtonClick(session)}>
                                  <Pencil className="h-5 w-5" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="text-red-500 bg-white/10 hover:bg-red-700 hover:text-red-300"
                                  onClick={() => handleDeleteButtonClick(session)}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <CardDescription className="flex gap-2 text-sm text-white pt-1">
                            Data: {new Date(session.session_date ?? '').toLocaleDateString('pt-BR')}
                            
                            <p>({new Date(session.session_date ?? '').toLocaleDateString('pt-BR', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })})</p>
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="border-2 border-t-0 border-black rounded-b-lg bg-white p-4">
                          <div className="w-full">
                              {session.goal ? (
                                <div className="text-md font-medium text-black break-words">
                                  {session.goal}
                                </div>
                              ) : (
                                <div className="text-md text-gray-400">
                                  Sem resumo objetivo
                                </div>
                              )}

                            <div className="flex justify-end">
                              <Button 
                                className='text-black'
                                variant="outline"
                                size="sm" 
                                onClick={() => router.push(`/campaign/${params.id}/${params.name}/session/${session.id}`)}
                              >
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DE NOTAS DA CAMPANHA */}
        <aside className="text-white bg-gray-800 w-full hidden lg:block max-w-[420px] max-h-screen break-words overflow-y-auto"> {/* Adicionado hidden lg:block para esconder em telas pequenas */}
            {campaign && userId && (
              <CampaignNotes campaignId={campaign.id} />
            )}
        </aside>
      </div>

      {/* MODAL DE CRIAÇÃO DE SESSÃO */}
      {campaign && isMaster && (
        <CreateSessionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          campaignId={campaign.id}
          onSessionCreated={(newSession) =>
            setSessions(prev => [newSession, ...prev])
          }
        />
      )}

      {/* MODAL DE EDIÇÃO DE SESSÃO */}
      {campaign && isMaster && sessionToEdit && (
         <EditSessionModal
            isOpen={!!isEditModalOpen} // Use o estado booleano para controlar
            onClose={() => { setIsEditModalOpen(false); setSessionToEdit(null); }}
            session={sessionToEdit}
            onSessionUpdated={handleSessionUpdated}
         />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE SESSÃO */}
      {isDeleteConfirmOpen && sessionToDelete && (
         <ConfirmationModal
            isOpen={!!isDeleteConfirmOpen} // Use o estado booleano para controlar
            onClose={() => { setIsDeleteConfirmOpen(false); setSessionToDelete(null); }}
            message={<>Tem certeza que deseja excluir a sessão 
              <span className='font-bold break-words'> "{sessionToDelete.name}"</span>?
              Esta ação não pode ser desfeita.</>
            }
            onConfirm={handleConfirmDelete}
            title="DESEJA EXCLUIR A SESSÃO?" // Título específico
            confirmButtonText="Excluir Sessão" // Texto específico
            isConfirmDestructive={true}
         />
      )}

       {/* MODAL DE EDIÇÃO DE WORLD_STORY */}
       {campaign && isMaster && ( // Só renderiza se houver campanha e for Mestre
          <EditWorldStoryModal
              isOpen={isWorldStoryModalOpen} // Controlado pelo novo estado
              onClose={() => setIsWorldStoryModalOpen(false)} // Fecha definindo o estado como falso
              campaignId={campaign.id} // Passa o ID da campanha
              initialWorldStory={campaign.world_story} // Passa o conteúdo atual do world_story
              onSaveSuccess={handleWorldStorySaved} // Chama o handler quando salvar no modal
          />
      )}
      {/* --- FIM MODAL --- */}

        {/* MODAL DE GERENCIAMENTO DE JOGADORES */}
      {campaign && isMaster && (
        <PlayersManagementModal
          isOpen={isPlayersModalOpen}
          onClose={() => setIsPlayersModalOpen(false)}
          campaignId={campaign.id}
          onPlayerRemoved={handlePlayersUpdated} // <--- CORRIGIDO PARA onPlayerRemoved
        />
      )}


    </>
  )
}

export default Page