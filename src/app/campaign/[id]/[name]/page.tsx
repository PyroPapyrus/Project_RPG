'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import CampaignNotes from '@/components/CampaignNotes'

import { Campaign } from '@/types/campaign'
import { Session } from '@/types/session'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from "@/components/ui/card"
import CreateSessionModal from '@/components/modals/CreateSessionModal'

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
  const [userId, setUserId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setSessionsLoading(true)
      setAuthorized(false)
      setIsMaster(false)
      setCampaign(null)
      setSessions([])

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', params.id)
          .single()

        if (campaignError || !campaignData) return

        const expectedSlug = campaignData.name.toLowerCase().replace(/ /g, '-')
        if (expectedSlug !== params.name) {
          router.replace(`/campaign/${params.id}/${expectedSlug}`)
          return
        }

        let userIsAuthorized = false
        let userIsMaster = false
        if (campaignData.master_id === user.id) {
          userIsAuthorized = true
          userIsMaster = true
        } else {
          const { error: playerError, count } = await supabase
            .from('campaign_players')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', params.id)
            .eq('user_id', user.id)

          if (!playerError && count && count > 0) {
            userIsAuthorized = true
          }
        }

        setCampaign(campaignData)
        setAuthorized(userIsAuthorized)
        setIsMaster(userIsMaster)

        if (userIsAuthorized) {
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .eq('campaign_id', params.id)
            .order('session_date', { ascending: false })

          if (!sessionsError) {
            setSessions(sessionsData || [])
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
        setSessionsLoading(false)
      }
    }

    loadData()
  }, [supabase, params.id, params.name, router])

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
                    navigator.clipboard.writeText(campaign.invite_code)
                    alert('Código copiado para a área de transferência!')
                  }}>
                    Copiar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 flex flex-col lg:flex-row gap-8">
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
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t bg-gray-50/50">
                        <div>
                          {session.report ? (
                            <span className="text-xs font-medium text-blue-700">Relatório disponível</span>
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
                              <Button variant="outline" size="sm">Editar</Button>
                              <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-100 hover:text-red-700">
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

          <div className="w-full lg:w-1/3 border-l pl-8 hidden lg:block">
            <h2 className="text-2xl font-semibold mb-6">Notas da Campanha</h2>
            {campaign && userId && (
              <CampaignNotes campaignId={campaign.id} />
            )}
          </div>
        </div>
      </div>

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
    </>
  )
}

export default Page
