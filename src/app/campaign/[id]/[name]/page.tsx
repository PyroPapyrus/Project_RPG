// src/app/campaign/[id]/[name]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import CampaignNotes from '@/components/CampaignNotes'; 

// Tipos (Importe o seu tipo Campaign também)
import { Campaign } from '@/types/campaign' // Assumindo que você tem este arquivo
import { Session } from '@/types/session'   // <-- Importa o novo tipo

// Componentes de UI (Importe os que você usa)
import { Button } from '@/components/ui/button'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// Importe um componente de Loading, se tiver um padrão
// import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Importa o Modal que vamos criar
import CreateSessionModal from '@/components/modals/CreateSessionModal'

interface PageProps {
  params: {
    id: string // campaign UUID
    name: string // campaign slug/name
  }
}

const Page = ({ params }: PageProps) => {
  // Estados existentes
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true) // Loading geral da página/campanha
  const [authorized, setAuthorized] = useState(false)

  // Novos Estados
  const [isMaster, setIsMaster] = useState(false)              // O usuário logado é o mestre?
  const [sessions, setSessions] = useState<Session[]>([])      // Lista de sessões da campanha
  const [sessionsLoading, setSessionsLoading] = useState(true) // Loading específico das sessões
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false) // Controla visibilidade do modal de criação

  const router = useRouter()
  // Cria o cliente Supabase específico para componentes Client-Side
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setSessionsLoading(true);
      setAuthorized(false);
      setIsMaster(false);
      setCampaign(null);
      setSessions([]);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return; // Usuário não logado, sai cedo
        }

        // 1. Busca a campanha pelo ID
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', params.id)
          .single();

        if (campaignError || !campaignData) {
          console.error('Campanha não encontrada ou erro:', campaignError);
          return; // Campanha não existe ou erro na busca
        }

        // 2. Validação do slug (opcional, mas bom ter)
        const expectedSlug = campaignData.name.toLowerCase().replace(/ /g, '-');
        if (expectedSlug !== params.name) {
          router.replace(`/campaign/${params.id}/${expectedSlug}`);
          return; // Redireciona para a URL correta e para a execução atual
        }

        // 3. Verifica autorização (Mestre ou Jogador)
        let userIsAuthorized = false;
        let userIsMaster = false;
        if (campaignData.master_id === user.id) {
          // Usuário é o mestre
          userIsAuthorized = true;
          userIsMaster = true;
        } else {
          // Verifica se o usuário está na tabela 'campaign_players'
          const { error: playerError, count } = await supabase
            .from('campaign_players')
            .select('*', { count: 'exact', head: true }) // Só verifica se existe
            .eq('campaign_id', params.id)
            .eq('user_id', user.id);

          if (playerError && playerError.code !== 'PGRST116') { // Ignora erro 'not found'
            console.error('Erro ao verificar jogador:', playerError);
          } else if (count && count > 0) {
            // Usuário é um jogador cadastrado
            userIsAuthorized = true;
          }
        }

        // Atualiza estados de campanha e autorização
        setCampaign(campaignData);
        setAuthorized(userIsAuthorized);
        setIsMaster(userIsMaster); // Define se é o mestre para renderização condicional

        // 4. Se autorizado, busca as sessões da campanha
        if (userIsAuthorized) {
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .eq('campaign_id', params.id)
            .order('session_date', { ascending: false }); // Ordena pelas mais recentes

          if (sessionsError) {
            console.error("Erro ao buscar sessões:", sessionsError);
            setSessions([]);
          } else {
            setSessions(sessionsData || []);
          }
        } else {
           console.log('Usuário não autorizado para ver esta campanha.');
        }

      } catch (error) {
        console.error('Erro geral ao carregar dados da campanha:', error);
        setAuthorized(false); // Garante desautorizado em caso de erro
      } finally {
        setLoading(false); // Desativa loading geral
        setSessionsLoading(false); // Desativa loading das sessões
      }
    };

    loadData();
  }, [supabase, params.id, params.name, router]); // Dependências do useEffect

  // ----- RENDERIZAÇÃO -----

  // Estado de Loading Inicial (Campanha)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Substitua pelo seu componente de LoadingSpinner se tiver */}
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Estado Não Autorizado ou Campanha Não Encontrada
  if (!authorized || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-4">Campanha não encontrada ou acesso não autorizado.</p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Dashboard
        </Button>
      </div>
    );
  }

  // Estado Autorizado - Renderiza a página da campanha
  return (
    <> {/* Usa Fragment para permitir renderizar o Modal fora do container principal */}
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho da Campanha */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(campaign.invite_code);
                    alert('Código copiado para a área de transferência!');
                  }}
                >
                  Copiar
                </Button>
              </div>
            )}

              {/* Pode adicionar status, nº de jogadores, etc. aqui */}
            </div>
            {/* Área para botões de ação do Mestre sobre a CAMPANHA (ex: Editar Campanha) */}
          </div>
        </div>

               {/* ===== ÁREA PRINCIPAL (Sessões e Futuro Chat) ===== */}
        {/* Usa Flexbox para criar layout de colunas (lg:flex-row = colunas lado a lado em telas grandes) */}
        <div className="mt-12 border-t pt-8 flex flex-col lg:flex-row gap-8">

          {/* Coluna da Esquerda: Sessões (com scroll) */}
          {/* Ocupa 2/3 da largura em telas grandes (lg:w-2/3), largura total em telas pequenas */}
          <div className="w-full lg:w-2/3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Sessões da Campanha</h2>
              {isMaster && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Criar Nova Sessão
                </Button>
              )}
            </div>

            {/* Container da Lista com Altura Máxima e Scroll */}
            {/* Defina uma altura máxima adequada (ex: max-h-[70vh] ou max-h-[600px]) */}
            {/* overflow-y-auto adiciona scroll vertical apenas quando necessário */}
            <div className="max-h-[70vh] overflow-y-auto pr-2"> {/* pr-2 para dar espaço para a barra de rolagem */}
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
                    <Card key={session.id} className="w-full overflow-hidden">
                      <CardHeader className="pb-4"> {/* Ajustado padding */}
                        {/* Nome e Data */}
                        <CardTitle className="text-lg font-semibold text-gray-800">{session.name}</CardTitle> {/* Ajustado estilo do título */}
                        <CardDescription className="text-sm text-gray-500 pt-1">
                          Data: {new Date(session.session_date).toLocaleDateString('pt-BR', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </CardDescription>
                      </CardHeader>

                      {/* O CardContent pode ser omitido se não houver conteúdo principal aqui */}
                      {/* Ou usado para algo muito breve, ex: */}
                      {/* <CardContent className="pt-0 pb-4">
                        <p className="text-sm text-gray-600 italic">
                          {session.description.substring(0, 70)}... {/* Exemplo de snippet
                        </p>
                      </CardContent> */}

                      <CardFooter className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t bg-gray-50/50"> {/* Adicionada borda superior */}
                        {/* Status do Relatório (Indicador Simples) */}
                        <div>
                          {session.report ? (
                            <span className="text-xs font-medium text-blue-700">Relatório disponível</span>
                          ) : (
                            <span className="text-xs text-gray-400">Sem relatório</span>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="space-x-2 flex-shrink-0">
                          {/* BOTÃO DE NAVEGAÇÃO */}
                          <Button
                             variant="outline"
                             size="sm"
                             onClick={() => router.push(`/campaign/${params.id}/${params.name}/session/${session.id}`)} // <-- NAVEGAÇÃO
                          >
                              Ver Detalhes
                          </Button>
                          {isMaster && (
                            <>
                              {/* Botão Editar (funcionalidade futura) */}
                              <Button variant="outline" size="sm" onClick={() => alert(`Editar Sessão ID: ${session.id}`)}>Editar</Button>
                              {/* Botão Excluir (funcionalidade futura) */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-100 hover:text-red-700"
                                onClick={() => alert(`Excluir Sessão ID: ${session.id}`)} // Adicionar confirmação real depois
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
            </div> {/* Fim do container com scroll */}
          </div> {/* Fim da Coluna da Esquerda (Sessões) */}

          {/* Coluna da Direita: Placeholder para o Chat Futuro */}
          {/* Ocupa 1/3 da largura em telas grandes (lg:w-1/3), some ou fica abaixo em telas pequenas */}
          {/* Você pode ocultar isso (hidden lg:block) ou deixar visível para desenvolvimento */}
          <div className="w-full lg:w-1/3 border-l pl-8 hidden lg:block">
            <h2 className="text-2xl font-semibold mb-6">Notas da Campanha</h2>
            {campaign && (
              <CampaignNotes campaignId={campaign.id} userId={campaign.master_id} />
            )}
          </div>


        </div> {/* Fim da Área Principal Flexbox/Grid */}


        {/* Adicionar outras seções aqui (Jogadores, Chat, etc.) no futuro */}

      </div> {/* Fim do container principal */}


      {/* Renderização do Modal de Criação (Fora do container principal para sobrepor tudo) */}
      {/* Só renderiza se a campanha existir e o usuário for o mestre */}
      {campaign && isMaster && (
         <CreateSessionModal
            // Controle de visibilidade
            isOpen={isCreateModalOpen}
            // Função para fechar o modal (passada para o componente filho)
            onClose={() => setIsCreateModalOpen(false)}
            // Passa o ID da campanha atual para o modal saber onde criar a sessão
            campaignId={campaign.id}
            // Função Callback: O que fazer quando uma sessão for criada com sucesso
            onSessionCreated={(newSession) => {
                // Adiciona a nova sessão ao início da lista no estado local
                // Isso atualiza a UI sem precisar recarregar a página
                setSessions(prevSessions => [newSession, ...prevSessions]);
                // O modal já deve se fechar sozinho ao chamar onClose internamente
            }}
         />
      )}
    </> // Fim do Fragment
  );
}

export default Page;