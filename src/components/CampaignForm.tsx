import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FormInput } from './FormInput'
import { SubmitButton } from './SubmitButton'
import { ErrorPopup } from './ErrorPopup'

export function CampaignForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [system, setSystem] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { error } = await supabase
        .from('campaigns')
        .insert({
          name,
          description,
          system,
          max_players: parseInt(maxPlayers),
          master_id: user.id,
          status: 'active',
          players_count: 1
        })

      if (error) throw error

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar campanha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

      <FormInput
        id="name"
        name="name"
        type="text"
        placeholder="Nome da Campanha"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        required
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <FormInput
        id="system"
        name="system"
        type="text"
        placeholder="Sistema (ex: D&D 5e, Tormenta20)"
        value={system}
        onChange={(e) => setSystem(e.target.value)}
        disabled={loading}
        required
      />

      <FormInput
        id="maxPlayers"
        name="maxPlayers"
        type="number"
        placeholder="Número máximo de jogadores"
        value={maxPlayers}
        onChange={(e) => setMaxPlayers(e.target.value)}
        disabled={loading}
        required
        min="1"
        max="20"
      />

      <SubmitButton
        loading={loading}
        loadingText="Criando campanha..."
        buttonText="Criar Campanha"
      />
    </form>
  )
} 