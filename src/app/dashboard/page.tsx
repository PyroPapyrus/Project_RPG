'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign } from '@/types/campaign'
import { CreateCampaignButton } from '@/components/CreateCampaignButton'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/FormInput'
import LogoutButton from '@/components/LogoutButton'
import JoinCampaignModal from '@/components/modals/JoinCampaignModal'
import { CampaignCard } from '@/components/CampaignCard'
import { BackButton } from '@/components/ui/back-button'

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

      // Buscar campanhas onde o usuário é jogador com contagem de jogadores, agora usando uma view que possibilita
      // que a busca ocorra sem causar repercussão infinita só com base em RLS
      const { data: playerData } = await supabase
      .from('view_campaign_players_visible')
      .select(`
        campaigns:campaign_id (
          *,
          players:campaign_players(count)
        )
      `)
        .eq('user_id', user.id)
      


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

      type CampaignWithCount = {
        campaigns: Campaign & {
          players?: { count: number }[];
        };
      };
      
      const processedPlayerData = ((playerData || []) as CampaignWithCount[])
        .filter(item => item.campaigns && !Array.isArray(item.campaigns)) // Evita erro se vier array
        .map(item => ({
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
        })) as Campaign[];

      setMasterCampaigns(processedMasterData)
      setPlayerCampaigns(processedPlayerData)

      console.log('Player Data Raw:', playerData)
      console.log('Processed Player Data:', processedPlayerData)
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
  
  return (

    <div className="bg-gray-100">
      <header className="bg-gray-800 text-white py-4">
        <div className="mx-auto px-4 flex justify-between items-center">
          <BackButton />
            <h1 className="text-2xl font-semibold">
              {activeTab === 'master' ? 'Minhas Campanhas' : 'Campanhas que Participo'}
            </h1>
          <LogoutButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {activeTab === 'master' ? (
            masterCampaigns.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-8">Você ainda não criou nenhuma campanha.</p>
            ) : (
              masterCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={handleEditClick}
                  onDelete={(id) => setDeletingCampaign(id)}
                />
              ))
            )
          ) : (
            playerCampaigns.length === 0 ? (
              <p className="text-gray-500 col-span-2 text-center py-8">Você ainda não participa de nenhuma campanha.</p>
            ) : (
              playerCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                />
              ))
            )
          )}
        </div>
      </main>

      {/* Modal de Edição */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Editar Campanha</h2>
            
            {editError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                {editError}
              </div>
            )}

            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <FormInput
                id="name"
                name="name"
                type="text"
                placeholder="Descent into Avernus, Curse of Strahd, etc."
                value={editFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                maxLength={40}
                style={{ border: '1px solid #ccc', borderRadius: '0px' }}
              />

              <label className="block text-sm font-medium text-gray-700 mt-2">
                Descrição breve
              </label>
              <FormInput
                id="description"
                name="description"
                type="textarea"
                placeholder="Faça uma descrição breve que contextualize sua campanha!"
                value={editFormData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditFormData({ ...editFormData, description: e.target.value })}
                required
                maxLength={500}
                style={{ border: '1px solid #ccc', borderRadius: '0px' }}
              />
              <p className="-mt-2 text-xs text-gray-500">
                {editFormData.description.length}/500 caracteres
              </p>

              <label className="block text-sm font-medium text-gray-700 mt-2">
                  Sistema da Campanha
              </label>
              <FormInput
                id="system"
                name="system"
                type="text"
                placeholder="D&D 5e, Pathfinder, etc."
                value={editFormData.system}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFormData({ ...editFormData, system: e.target.value })}
                required
                maxLength={40}
                style={{ border: '1px solid #ccc', borderRadius: '0px' }}
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mt-2">
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
                  style={{ border: '1px solid #ccc', borderRadius: '0px' }}
                />
              </div>

              <label className="block text-sm font-medium text-gray-700 mt-2">
                 Status da Campanha
              </label>
              <select
                id="status"
                name="status"
                value={editFormData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditFormData({ ...editFormData, status: e.target.value as 'em_andamento' | 'hiato' | 'concluido' })}
                className="block w-full pl-3 py-2 border border-gray-300 focus:border-blue-500 sm:text-sm"
                  
              >
                <option value="em_andamento">Em Andamento</option>
                <option value="hiato">Em Hiato</option>
                <option value="concluido">Concluído</option>
              </select>
              
              <div className="space-x-3 space-y-3">
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

      {/* Modal de Confirmação de Exclusão */}
      {deletingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Confirmar Exclusão</h2>
            
            <p className="mb-6 text-gray-600">
              Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
            </p>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingCampaign(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => handleDeleteCampaign(deletingCampaign)}
              >
                Excluir Campanha
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Entrada em Campanha */}
      <JoinCampaignModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={loadCampaigns}
      />

      <div className='absolute'>
        <nav className='fixed bottom-0 left-1/2 transform -translate-x-1/2 px-10 pb-1 pt-2 bg-black rounded-tr-xl rounded-tl-xl '>
          <div className='text-white flex gap-10'>
              <span className="material-symbols-rounded" style={{ fontSize: '38px' }}>
                filter_list
              </span>

              <span className="material-symbols-rounded" style={{ fontSize: '38px' }}>
                settings
              </span>

              <span className="material-symbols-rounded" style={{ fontSize: '38px' }}>
                account_circle
              </span>
          </div>
        </nav>
      </div>
    </div>
  )
}