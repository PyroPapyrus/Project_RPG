'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import { FormInput } from './FormInput'
import { SubmitButton } from './SubmitButton'
import { ErrorPopup } from './ErrorPopup'

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
            <h2 className="text-2xl font-bold mb-4">Nova Campanha</h2>
            
            {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                id="name"
                name="name"
                type="text"
                placeholder="Nome da Campanha"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={50}
              />

              <div className="space-y-1">
                <FormInput
                  id="description"
                  name="description"
                  type="textarea"
                  placeholder="Descrição"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  maxLength={250}
                />
                <p className="text-xs text-gray-500">
                  {formData.description.length}/250 caracteres
                </p>
              </div>

              <FormInput
                id="system"
                name="system"
                type="text"
                placeholder="Sistema (D&D 5e, Pathfinder, etc.)"
                value={formData.system}
                onChange={(e) => setFormData({ ...formData, system: e.target.value })}
                required
                maxLength={50}
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
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <SubmitButton
                  loading={loading}
                  loadingText="Criando..."
                  buttonText="Criar Campanha"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
} 