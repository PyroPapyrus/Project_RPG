'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign } from '@/types/campaign'
import { CreateCampaignButton } from '@/components/CreateCampaignButton'
import { useRouter } from 'next/navigation'
import { Trash2, Pencil, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/FormInput'
import LogoutButton from '@/components/LogoutButton'
import JoinCampaignModal from '@/components/modals/JoinCampaignModal'

interface EditCampaignData {
  name: string
  description: string
  system: string
  max_players: number
  status: 'em_andamento' | 'hiato' | 'concluido'
}

export default function DashboardPage() {
  const [masterCampaigns, setMasterCampaigns] = useState<Campaign[]>([])
  const [playerCampaigns, setPlayerCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [activeTab, setActiveTab] = useState<'master' | 'player'>('master')
  const [editFormData, setEditFormData] = useState<EditCampaignData>({
    name: '',
    description: '',
    system: '',
    max_players: 8,
    status: 'em_andamento'
  })
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const loadCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar campanhas onde o usuário é mestre com contagem de jogadores
      const { data: masterData } = await supabase
        .from('campaigns')
        .select(`
          *,
          players:campaign_players(count)
        `)
        .eq('master_id', user.id)
        .order('created_at')

      // Buscar campanhas onde o usuário é jogador com contagem de jogadores
      const { data: playerData } = await supabase
        .from('campaign_players')
        .select(`
          campaigns(
            *,
            players:campaign_players(count)
          )
        `)
        .eq('player_id', user.id)
        .order('created_at')

      // Processar os dados para incluir a contagem de jogadores
      const processedMasterData = (masterData || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        system: campaign.system,
        created_at: campaign.created_at,
        max_players: campaign.max_players,
        status: campaign.status,
        master_id: campaign.master_id,
        world_story: campaign.world_story,
        invite_code: campaign.invite_code,
        players_count: campaign.players?.[0]?.count || 0
      })) as Campaign[]

      const processedPlayerData = (playerData || []).map(item => ({
        id: item.campaigns.id,
        name: item.campaigns.name,
        description: item.campaigns.description,
        system: item.campaigns.system,
        created_at: item.campaigns.created_at,
        max_players: item.campaigns.max_players,
        status: item.campaigns.status,
        master_id: item.campaigns.master_id,
        world_story: item.campaigns.world_story,
        invite_code: item.campaigns.invite_code,
        players_count: item.campaigns.players?.[0]?.count || 0
      })) as Campaign[]

      setMasterCampaigns(processedMasterData)
      setPlayerCampaigns(processedPlayerData)
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
      max_players: campaign.max_players,
      status: campaign.status
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
          max_players: editFormData.max_players,
          status: editFormData.status
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
      className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow h-[330px] flex flex-col"
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
      <div className="flex-grow overflow-y-auto">
        <div className="space-y-2">
          <p className="text-gray-600">
            {campaign.description}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">
            {activeTab === 'master' ? 'Minhas Campanhas' : 'Campanhas que Participo'}
          </h1>
          <LogoutButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button 
              className={`px-6 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                activeTab === 'master' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('master')}
            >
              <span>Minhas Campanhas</span>

              <span className={`${
                activeTab === 'master' ? 'bg-gray-600' : 'bg-gray-300'
              } px-2 py-0.5 rounded-full text-sm`}>
                {masterCampaigns.length}
              </span>
            </button>
            <button 
              className={`px-6 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                activeTab === 'player' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('player')}
            >
              <span>Campanhas que jogo</span>
              <span className={`${
                activeTab === 'player' ? 'bg-gray-600' : 'bg-gray-300'
              } px-2 py-0.5 rounded-full text-sm`}>
                {playerCampaigns.length}
              </span>
            </button>
          </div>
          {activeTab === 'master' ? (
              <CreateCampaignButton onSuccess={loadCampaigns} />
            ) : (
              <button
                onClick={() => setJoinModalOpen(true)}
                className="bg-black text-white hover:bg-gray-900 rounded-full px-6 py-2 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Entrar em Campanha</span>
              </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTab === 'master' ? (
            masterCampaigns.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-8">Você ainda não criou nenhuma campanha.</p>
            ) : (
              masterCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] h-[330px] flex flex-col"
                  onClick={() => router.push(`/campaign/${campaign.id}/sessions`)}
                >
                  <div className="bg-gray-800 text-white p-4">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <h3 className="text-xl font-semibold break-words max-w-[60%]">{campaign.name}</h3>
                      <div className="flex items-center space-x-4 min-w-[200px] justify-end">
                        <span className={`text-sm px-3 py-1 rounded-full whitespace-nowrap ${
                          campaign.status === 'concluido' 
                            ? 'bg-red-100 text-red-600' 
                            : campaign.status === 'hiato'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {campaign.status === 'concluido' 
                            ? 'Concluído' 
                            : campaign.status === 'hiato'
                            ? 'Em Hiato'
                            : 'Em Andamento'}
                        </span>
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditClick(campaign)}
                            className="text-gray-300 hover:text-yellow-400"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeletingCampaign(campaign.id)}
                            className="text-gray-300 hover:text-red-400"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 flex-grow overflow-y-auto">
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        {campaign.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">{campaign.system}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-500">{campaign.players_count}/{campaign.max_players}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            playerCampaigns.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-8">Você ainda não participa de nenhuma campanha.</p>
            ) : (
              playerCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] h-[330px] flex flex-col"
                  onClick={() => router.push(`/campaign/${campaign.id}/sessions`)}
                >
                  <div className="bg-gray-800 text-white p-4">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <h3 className="text-xl font-semibold break-words max-w-[60%]">{campaign.name}</h3>
                      <div className="flex items-center space-x-4 min-w-[200px] justify-end">
                        <span className={`text-sm px-3 py-1 rounded-full whitespace-nowrap ${
                          campaign.status === 'concluido' 
                            ? 'bg-red-100 text-red-600' 
                            : campaign.status === 'hiato'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {campaign.status === 'concluido' 
                            ? 'Concluído' 
                            : campaign.status === 'hiato'
                            ? 'Em Hiato'
                            : 'Em Andamento'}
                        </span>
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditClick(campaign)}
                            className="text-gray-300 hover:text-yellow-400"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeletingCampaign(campaign.id)}
                            className="text-gray-300 hover:text-red-400"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 flex-grow overflow-y-auto">
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        {campaign.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">{campaign.system}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-500">{campaign.players_count}/{campaign.max_players}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </main>

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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                maxLength={50}
              />

              <FormInput
                id="description"
                name="description"
                type="textarea"
                placeholder="Descrição"
                value={editFormData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditFormData({ ...editFormData, description: e.target.value })}
                required
                maxLength={500}
              />

              <FormInput
                id="system"
                name="system"
                type="text"
                placeholder="Sistema (D&D 5e, Pathfinder, etc.)"
                value={editFormData.system}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, system: e.target.value })}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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

              <div className="space-y-1">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status da Campanha
                </label>
                <select
                  id="status"
                  name="status"
                  value={editFormData.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditFormData({ ...editFormData, status: e.target.value as 'em_andamento' | 'hiato' | 'concluido' })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="em_andamento">Em Andamento</option>
                  <option value="hiato">Em Hiato</option>
                  <option value="concluido">Concluído</option>
                </select>
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

      {/* Modal de Entrada em Campanha */}
      <JoinCampaignModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={loadCampaigns}
      />

    </div>
  )
} 