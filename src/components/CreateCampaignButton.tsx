'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import { FormInput } from './FormInput'
import { SubmitButton } from './SubmitButton'
import { ErrorPopup } from './ErrorPopup'
import { CloseModalButton } from './ui/close-modal-button'

interface CreateCampaignFormData {
  name: string
  description: string
  system: string
  max_players: number
}

interface CreateCampaignButtonProps {
  onSuccess?: () => void
}

export function CreateCampaignButton({ onSuccess }: CreateCampaignButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<CreateCampaignFormData>({
    name: '',
    description: '',
    system: '',
    max_players: 8
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleClose = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      system: '',
      max_players: 8
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('campaigns')
        .insert([
          {
            ...formData,
            master_id: user.id,
            status: 'em_andamento'
          }
        ])
        .select()
        .single()

      if (error) throw error

      setIsModalOpen(false)
      resetForm()
      router.refresh()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar campanha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="bg-black text-white hover:bg-gray-900 rounded-full px-6 py-2 flex items-center space-x-2"
      >
        <Plus className="h-5 w-5" />
        <span>Criar Campanha</span>
      </Button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className='flex justify-between mb-4'>
            <h2 className="text-2xl font-bold">Nova Campanha</h2>
            <CloseModalButton onClose={handleClose} />
          </div>
            
            {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <FormInput
                id="name"
                name="name"
                type="text"
                placeholder="Descent into Avernus, Curse of Strahd, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                required
                maxLength={500}
                style={{ border: '1px solid #ccc', borderRadius: '0px'}}
              />
              <p className="-mt-2 text-xs text-gray-500">
                {formData.description.length}/500 caracteres
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mt-2">
                Sistema da Campanha
              </label>
              <FormInput
                id="system"
                name="system"
                type="text"
                placeholder="D&D 5e, Pathfinder, etc."
                value={formData.system}
                onChange={(e) => setFormData({ ...formData, system: e.target.value })}
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
                  value={formData.max_players.toString()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value > 20) {
                      setFormData({ ...formData, max_players: 20 })
                    } else {
                      setFormData({ ...formData, max_players: value })
                    }
                  }}
                  required
                  min={1}
                  max={20}
                  style={{ border: '1px solid #ccc', borderRadius: '0px' }}
                />
              </div>

              <div className="space-y-2 mt-2">
                <SubmitButton
                  loading={loading}
                  loadingText="Criando..."
                  buttonText="Criar Campanha"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  disabled={loading}
                  className="w-full text-lg"
                >Cancelar</Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
} 