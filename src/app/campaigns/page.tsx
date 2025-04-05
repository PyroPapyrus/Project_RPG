'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  description: string
  master_id: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadCampaigns = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('master_id', user.id)

      if (error) {
        console.error('Erro ao carregar campanhas:', error)
        return
      }

      setCampaigns(data || [])
      setLoading(false)
    }

    loadCampaigns()
  }, [supabase])

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Todas as Campanhas</h1>
        <Button onClick={() => router.push('/(authenticated)/campaigns/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Você ainda não tem nenhuma campanha.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{campaign.name}</h2>
              <p className="text-gray-600 mb-4">{campaign.description}</p>
              <Button
                variant="outline"
                onClick={() => router.push(`/(authenticated)/campaigns/${campaign.id}`)}
              >
                Ver Detalhes
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 