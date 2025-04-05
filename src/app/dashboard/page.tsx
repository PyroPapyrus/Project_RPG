'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign } from '@/types/campaign'
import { CreateCampaignButton } from '@/components/CreateCampaignButton'
import { useRouter } from 'next/navigation'
import { Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { FormInput } from '@/components/FormInput'
import { cn } from '@/lib/utils'
import { generateCampaignLink } from '@/lib/campaign-access'

interface EditCampaignData {
  name: string
  description: string
  system: string
  max_players: number
}

export default function DashboardPage() {
  const [masterCampaigns, setMasterCampaigns] = useState<Campaign[]>([])
  const [playerCampaigns, setPlayerCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [editFormData, setEditFormData] = useState<EditCampaignData>({
    name: '',
    description: '',
    system: '',
    max_players: 8
  })
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const toggleDescription = (campaignId: string) => {
    const newExpandedDescriptions = new Set(expandedDescriptions)
    if (expandedDescriptions.has(campaignId)) {
      newExpandedDescriptions.delete(campaignId)
    } else {
      newExpandedDescriptions.add(campaignId)
    }
    setExpandedDescriptions(newExpandedDescriptions)
  }

  const loadCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar campanhas onde o usuário é mestre
      const { data: masterData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('master_id', user.id)
        .order('created_at', { ascending: false })

      // Buscar campanhas onde o usuário é jogador
      const { data: playerData } = await supabase
        .from('campaign_players')
        .select('campaigns(*)')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })

      setMasterCampaigns(masterData || [])
      const playerCampaignsData = playerData?.map(item => item.campaigns) || []
      setPlayerCampaigns(playerCampaignsData as unknown as Campaign[])
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error

      loadCampaigns()
    } catch (error) {
      console.error('Erro ao excluir campanha:', error)
    } finally {
      setDeletingCampaign(null)
    }
  }

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setEditFormData({
      name: campaign.name,
      description: campaign.description,
      system: campaign.system,
      max_players: campaign.max_players
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: editFormData.name,
          description: editFormData.description,
          system: editFormData.system,
          max_players: editFormData.max_players
        })
        .eq('id', editingCampaign.id)

      if (error) throw error

      setIsEditModalOpen(false)
      setEditingCampaign(null)
      loadCampaigns()
    } catch (error: any) {
      setEditError(error.message || 'Erro ao atualizar campanha')
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [supabase])

  const CampaignCard = ({ campaign, isMaster = false }: { campaign: Campaign, isMaster?: boolean }) => (
    <div
      key={campaign.id}
      className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-semibold">{campaign.name}</h3>
        {isMaster && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={() => handleEditClick(campaign)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {deletingCampaign === campaign.id ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                >
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeletingCampaign(null)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                onClick={() => setDeletingCampaign(campaign.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <p className={cn(
          "text-gray-600 transition-all duration-200",
          !expandedDescriptions.has(campaign.id) && "line-clamp-2"
        )}>
          {campaign.description}
        </p>
        {campaign.description.length > 100 && (
          <button
            onClick={() => toggleDescription(campaign.id)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            {expandedDescriptions.has(campaign.id) ? (
              <>
                Ver menos
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Ver mais
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500">Sistema: {campaign.system}</span>
        <button
          onClick={() => router.push(`/campaign/${campaign.name.toLowerCase().replace(/ /g, '-')}`)}
          className="text-blue-600 hover:text-blue-800"
        >
          Ver detalhes →
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <CreateCampaignButton onSuccess={loadCampaigns} />
      </div>

      <Tabs defaultValue="master" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="master">
            Campanhas como Mestre
            {masterCampaigns.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {masterCampaigns.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="player">
            Campanhas como Jogador
            {playerCampaigns.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
                {playerCampaigns.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="master">
          {masterCampaigns.length === 0 ? (
            <p className="text-gray-500">Você ainda não criou nenhuma campanha.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masterCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} isMaster={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="player">
          {playerCampaigns.length === 0 ? (
            <p className="text-gray-500">Você ainda não participa de nenhuma campanha.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Edição */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Editar Campanha</h2>
            
            {editError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <FormInput
                id="name"
                name="name"
                type="text"
                placeholder="Nome da Campanha"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                maxLength={50}
              />

              <FormInput
                id="description"
                name="description"
                type="textarea"
                placeholder="Descrição"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                required
                maxLength={250}
              />

              <FormInput
                id="system"
                name="system"
                type="text"
                placeholder="Sistema (D&D 5e, Pathfinder, etc.)"
                value={editFormData.system}
                onChange={(e) => setEditFormData({ ...editFormData, system: e.target.value })}
                required
              />

              <div className="space-y-1">
                <label htmlFor="max_players" className="block text-sm font-medium text-gray-700">
                  Limite de Jogadores
                </label>
                <p className="text-sm text-gray-500 mb-1">
                  Defina o número máximo de jogadores que poderão participar da campanha (sem contar você, o mestre).
                </p>
                <FormInput
                  id="max_players"
                  name="max_players"
                  type="number"
                  placeholder="Ex: 5"
                  value={editFormData.max_players.toString()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value > 20) {
                      setEditFormData({ ...editFormData, max_players: 20 })
                    } else {
                      setEditFormData({ ...editFormData, max_players: value })
                    }
                  }}
                  required
                  min={1}
                  max={20}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingCampaign(null)
                    setEditError(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 