// components/modals/JoinCampaignModal.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '../SubmitButton'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function JoinCampaignModal({ isOpen, onClose, onSuccess }: Props) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Reset states when modal closes
  const handleClose = () => {
    setCode('')
    setStatus(null)
    setError(null)
    setLoading(false)
    onClose()
  }

  const handleJoin = async () => {
    setStatus(null)
    setError(null)
    setLoading(true)
    
    try {
      const res = await fetch('/api/join-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus(data.error || 'Erro ao entrar na campanha.')
      } else {
        setStatus(data.message)
        onSuccess()
        // Reset states and close modal after success
        setTimeout(() => {
          handleClose()
        }, 1000)
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Entrar com código de campanha</h2>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Digite o código"
          className="w-full border px-4 py-2 rounded mb-4"
          disabled={loading} // Desabilita o input durante o loading
        />
        <div className="space-y-2">
          {/* Botão de Enviar */}
          <SubmitButton
            loading={loading}
            loadingText="Entrando..."
            buttonText="Entrar"
            onClick={handleJoin}
            disabled={!code || loading} // Desabilita se não houver código ou durante loading
          />

          <Button 
            variant="outline"
            onClick={handleClose} // Changed from onClose to handleClose
            disabled={loading} // Desabilita o botão durante o loading
            className='py-5 w-full'
          >
            Cancelar
          </Button>
        </div>
        <div className='justify-self-center'>
          {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
