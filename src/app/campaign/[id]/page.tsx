'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign } from '@/types/campaign'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PageProps {
  params: {
    id: string
  }
}

const Page = ({ params }: PageProps) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Primeiro, busca a campanha
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', params.id)
          .single()

        if (campaignError) throw campaignError

        if (campaignData) {
          // Verifica se o usuário é mestre
          if (campaignData.master_id === user.id) {
            setCampaign(campaignData)
            setAuthorized(true)
            setLoading(false)
            return
          }

          // Se não for mestre, verifica se é jogador
          const { data: playerData, error: playerError } = await supabase
            .from('campaign_players')
            .select('*')
            .eq('campaign_id', params.id)
            .eq('player_id', user.id)
            .single()

          if (playerError && playerError.code !== 'PGRST116') { // Ignora erro de "não encontrado"
            throw playerError
          }

          if (playerData) {
            setCampaign(campaignData)
            setAuthorized(true)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar campanha:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCampaign()
  }, [supabase, params.id])

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
        <p className="text-gray-500 mb-4">Campanha não encontrada ou acesso não autorizado</p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
            <p className="text-gray-600">{campaign.description}</p>
            <p className="text-sm text-gray-500 mt-2">Sistema: {campaign.system}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page 