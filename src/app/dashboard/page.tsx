'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign } from '@/types/campaign'
import { CampaignCard } from '@/components/CampaignCard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface CampaignPlayer {
  campaigns: Campaign
}

export default function DashboardPage() {
  const [masterCampaigns, setMasterCampaigns] = useState<Campaign[]>([])
  const [playerCampaigns, setPlayerCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Buscar campanhas onde o usuário é mestre
        const { data: masterData } = await supabase
          .from('campaigns')
          .select('*')
          .eq('master_id', user.id)

        // Buscar campanhas onde o usuário é jogador
        const { data: playerData } = await supabase
          .from('campaign_players')
          .select('campaigns(*)')
          .eq('player_id', user.id)

        setMasterCampaigns(masterData || [])
        
        // Corrigir tipagem dos dados retornados
        const playerCampaignsData = (playerData as unknown as CampaignPlayer[] || []).map(item => item.campaigns)
        setPlayerCampaigns(playerCampaignsData)
      } catch (error) {
        console.error('Erro ao carregar campanhas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Minhas Campanhas</h1>
          <Button onClick={() => router.push('/campaigns/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        <div className="space-y-8">
          {/* Campanhas como Mestre */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Como Mestre</h2>
            {masterCampaigns.length === 0 ? (
              <p className="text-gray-500">Você ainda não criou nenhuma campanha.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {masterCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} role="master" />
                ))}
              </div>
            )}
          </section>

          {/* Campanhas como Jogador */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Como Jogador</h2>
            {playerCampaigns.length === 0 ? (
              <p className="text-gray-500">Você ainda não participa de nenhuma campanha.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playerCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} role="player" />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
} 