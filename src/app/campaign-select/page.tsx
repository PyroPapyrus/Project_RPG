import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  description: string
  system: string
  created_at: string
  master_id: string
  max_players: number
}

export default async function CampaignSelect({
  searchParams,
}: {
  searchParams: { name: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const campaignName = searchParams.name?.replace(/-/g, ' ')
  
  if (!campaignName) {
    redirect('/dashboard')
  }

  // Busca campanhas onde o usuário é mestre
  const { data: masterCampaigns } = await supabase
    .from('campaigns')
    .select('*')
    .ilike('name', campaignName)
    .eq('master_id', user.id)
    .order('created_at', { ascending: false })

  // Busca campanhas onde o usuário é jogador
  const { data: playerCampaignsIds } = await supabase
    .from('campaign_players')
    .select('campaign_id')
    .eq('player_id', user.id)

  let playerCampaigns: Campaign[] = []
  
  if (playerCampaignsIds && playerCampaignsIds.length > 0) {
    const campaignIds = playerCampaignsIds.map(pc => pc.campaign_id)
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .ilike('name', campaignName)
      .in('id', campaignIds)
      .order('created_at', { ascending: false })
    
    if (campaigns) {
      playerCampaigns = campaigns
    }
  }

  const allCampaigns = [...(masterCampaigns || []), ...(playerCampaigns || [])]

  if (allCampaigns.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Campanha não encontrada</h1>
        <p className="mb-4">Não foi encontrada nenhuma campanha com o nome "{campaignName}" que você tenha acesso.</p>
        <Button asChild>
          <Link href="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    )
  }

  if (allCampaigns.length === 1) {
    const campaign = allCampaigns[0]
    const campaignSlug = campaign.name.toLowerCase().replace(/ /g, '-')
    redirect(`/campaign/${campaign.id}/${campaignSlug}`)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Selecione a Campanha</h1>
      <p className="mb-6">
        Existem múltiplas campanhas com o nome "{campaignName}". Por favor, selecione qual delas você deseja acessar:
      </p>
      <div className="grid gap-4">
        {allCampaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <CardTitle>{campaign.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-muted-foreground">{campaign.description}</p>
              <p className="mb-4 text-sm">
                <strong>Sistema:</strong> {campaign.system}
                <br />
                <strong>Criada em:</strong>{' '}
                {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                <br />
                <strong>Seu papel:</strong>{' '}
                {campaign.master_id === user.id ? 'Mestre' : 'Jogador'}
              </p>
              <Button asChild>
                <Link
                  href={`/campaign/${campaign.id}/${campaign.name
                    .toLowerCase()
                    .replace(/ /g, '-')}`}
                >
                  Acessar esta campanha
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 