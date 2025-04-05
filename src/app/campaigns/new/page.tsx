'use client'

import { CampaignForm } from '@/components/CampaignForm'

export default function NewCampaignPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Criar Nova Campanha</h1>
          <p className="mt-2 text-sm text-gray-600">
            Preencha os detalhes da sua nova campanha de RPG
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <CampaignForm />
        </div>
      </div>
    </div>
  )
} 