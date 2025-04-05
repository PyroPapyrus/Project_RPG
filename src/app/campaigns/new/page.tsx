'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FormInput } from '@/components/FormInput'
import { SubmitButton } from '@/components/SubmitButton'
import { ErrorPopup } from '@/components/ErrorPopup'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewCampaignPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error: insertError } = await supabase
        .from('campaigns')
        .insert([
          {
            name,
            description,
            master_id: user.id
          }
        ])

      if (insertError) throw insertError

      router.push('/(authenticated)/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-0"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Nova Campanha</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da Campanha"
          required
        />

        <FormInput
          id="description"
          name="description"
          type="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição"
          required
        />

        {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

        <SubmitButton 
          loading={loading} 
          loadingText="Criando..."
          buttonText="Criar Campanha"
        />
      </form>
    </div>
  )
} 