// components/modals/JoinCampaignModal.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function JoinCampaignModal({ isOpen, onClose, onSuccess }: Props) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleJoin = async () => {
    setStatus(null)
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
      setTimeout(() => onClose(), 1000)
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
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleJoin}>Entrar</Button>
        </div>
        {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
      </div>
    </div>
  )
}
