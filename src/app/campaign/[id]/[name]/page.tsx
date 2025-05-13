'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import CampaignNotes from '@/components/CampaignNotes'

import { Campaign } from '@/types/campaign'
import { Session } from '@/types/session'
import { Button } from '@/components/ui/button'
import {
  Card, CardDescription, CardFooter,CardHeader, CardTitle} from "@/components/ui/card"
import CreateSessionModal from '@/components/modals/CreateSessionModal'
import EditSessionModal from '@/components/modals/EditSessionModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import EditWorldStoryModal from '@/components/modals/EditWorldStoryModal';
import { toast } from 'react-toastify'
import { FormInput } from '@/components/FormInput' // Importe o FormInput
import { SubmitButton } from '@/components/SubmitButton' // Importe o SubmitButton


interface PageProps {
  params: {
    id: string
    name: string
  }
}

const Page = ({ params }: PageProps) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
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


  const [userId, setUserId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  const fetchSessions = useCallback(async (campaignId: string) => {
     setSessionsLoading(true);
     const { data: sessionsData, error: sessionsError } = await supabase
         .from('sessions')
         .select('*')
         .eq('campaign_id', campaignId)
         .order('session_date', { ascending: false });

     if (!sessionsError) {
         setSessions(sessionsData || []);
     } else {
         console.error("Erro ao buscar sessões:", sessionsError);
         toast.error('Erro ao buscar sessões.');
         setSessions([]);
     }
     setSessionsLoading(false);
  }, [supabase]);

  // --- FUNÇÃO PARA CARREGAR DADOS INICIAIS ---
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

      // Buscar dados da campanha, incluindo world_story
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*') // O '*' deve incluir world_story
        .eq('id', params.id)
        .single()

      if (campaignError || !campaignData) {
         setLoading(false);
         toast.error('Campanha não encontrada ou erro ao carregar.');
         return;
      }

      const expectedSlug = campaignData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      if (expectedSlug !== params.name && params.name !== campaignData.id) {
         router.replace(`/campaign/${params.id}/${expectedSlug}`);
         setLoading(false);
         return;
      }

      let userIsAuthorized = false
      let userIsMaster = false
      if (campaignData.master_id === user.id) {
        userIsAuthorized = true
        userIsMaster = true
      } else {
        const { error: playerError, count } = await supabase
          .from('campaign_players')
          .select('user_id', { count: 'exact', head: true })
          .eq('campaign_id', params.id)
          .eq('user_id', user.id)

        if (!playerError && count && count > 0) {
          userIsAuthorized = true
        } else if (playerError) {
            console.error("Erro ao verificar status de jogador:", playerError);
        }
      }

      setCampaign(campaignData)
      setAuthorized(userIsAuthorized)
      setIsMaster(userIsMaster)

      if (userIsAuthorized) {
         fetchSessions(campaignData.id);
      } else {
         setSessions([]);
         setSessionsLoading(false);
      }

    } catch (error) {
      console.error("Erro ao carregar dados da campanha:", error);
      toast.error('Ocorreu um erro ao carregar a campanha.');
      setAuthorized(false);
    } finally {
      setLoading(false)
    }
  }, [supabase, params.id, params.name, router, fetchSessions]);

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
     fetchSessions(params.id);
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
          fetchSessions(params.id);
      }
  };

  const handleCancelDelete = () => {
      setIsDeleteConfirmOpen(false);
      setSessionToDelete(null);
  };
  // --- FIM HANDLERS EXCLUSÃO SESSÃO ---


    // --- NOVO HANDLER PARA ATUALIZAR world_story APÓS SALVAR NO MODAL ---
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
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!authorized || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-4">Campanha não encontrada ou acesso não autorizado.</p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Dashboard
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para o Dashboard
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
              <p className="text-gray-600 mb-1">{campaign.description}</p>
              <p className="text-sm text-gray-500">Sistema: {campaign.system}</p>
              {isMaster && campaign.invite_code && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Código de Convite:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono text-blue-700">{campaign.invite_code}</code>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(campaign.invite_code || '')
                    toast.info('Código copiado para a área de transferência!');
                  }}>
                    Copiar
                  </Button>
                </div>
              )}

             
      {/* --- TRECHO PARA world_story (AGORA UM BOTÃO QUE ABRE O MODAL) --- */}
      {isMaster && ( // Apenas o Mestre pode ver o botão de editar
       <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">História do Mundo</h2>
        {/* Botão que abre o modal de edição */}
        <Button variant="outline" onClick={() => setIsWorldStoryModalOpen(true)}>
         Editar História do Mundo
        </Button>
       </div>
      )}
      {/* --- FIM TRECHO world_story (BOTÃO) --- */}

      {/* Exibir world_story para todos (somente leitura) */}
      {/* Removemos a condição !isMaster para que todos vejam */}
       {campaign.world_story && ( // Exibe se houver conteúdo
          <div className={`mt-8 ${isMaster ? 'hidden md:block' : ''}`}> {/* Opcional: esconder para mestre em telas grandes se quiser que ele use SÓ o modal */}
           {/* <h2 className="text-2xl font-semibold mb-4">História do Mundo</h2> REMOVIDO - título já está acima do botão*/}
           {/* Renderiza o texto */}
           <div className="prose max-w-none"> {/* Use classes 'prose' para estilização básica de texto */}
             <p>{campaign.world_story}</p>
           </div>
          </div>
       )}
       {/* Fim Exibição world_story */}


            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 flex flex-col lg:flex-row gap-8">
          {/* Coluna de Sessões */}
          <div className="w-full lg:w-2/3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Sessões da Campanha</h2>
              {isMaster && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Criar Nova Sessão
                </Button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-2">
              {sessionsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">Carregando sessões...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">Ainda não há sessões registradas para esta campanha.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <Card key={session.id}>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-gray-800">{session.name}</CardTitle>
                        <CardDescription className="text-sm text-gray-500 pt-1">
                          Data: {new Date(session.session_date).toLocaleDateString('pt-BR', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t bg-gray-50/50">
                        <div>
                          {session.goal ? (
                            <span className="text-xs font-medium text-blue-700">{session.goal}</span>
                          ) : (
                            <span className="text-xs text-gray-400">Sem relatório</span>
                          )}
                        </div>
                        <div className="space-x-2 flex-shrink-0">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/campaign/${params.id}/${params.name}/session/${session.id}`)}>
                            Ver Detalhes
                          </Button>
                          {isMaster && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEditButtonClick(session)}>
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-100 hover:text-red-700"
                                onClick={() => handleDeleteButtonClick(session)}
                              >
                                Excluir
                              </Button>
                            </>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DE NOTAS DA CAMPANHA */}
          <div className="w-full lg:w-1/3 border-l pl-8 hidden lg:block"> {/* Adicionado hidden lg:block para esconder em telas pequenas */}
            <h2 className="text-2xl font-semibold mb-6">Notas da Campanha</h2>
            {campaign && userId && (
              <CampaignNotes campaignId={campaign.id} />
            )}
          </div>
        </div>
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
            message={`Tem certeza que deseja excluir a sessão "${sessionToDelete.name}"? Esta ação não pode ser desfeita.`}
            onConfirm={handleConfirmDelete}
            title="Confirmar Exclusão da Sessão" // Título específico
            confirmButtonText="Excluir Sessão" // Texto específico
            isConfirmDestructive={true}
         />
      )}

       {/* --- MODAL DE EDIÇÃO DE WORLD_STORY --- */}
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

    </>
  )
}

export default Page