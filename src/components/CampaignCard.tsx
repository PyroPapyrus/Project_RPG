import { Campaign } from '@/types/campaign'
import { Trash2, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CampaignCardProps {
  campaign: Campaign
  onEdit?: (campaign: Campaign) => void
  onDelete?: (campaignId: string) => void
}

export function CampaignCard({ campaign, onEdit, onDelete }: CampaignCardProps) {
  const router = useRouter()

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] h-[355px] flex flex-col w-full"
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
            {(onEdit || onDelete) && (
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(campaign);
                    }}
                    className="text-gray-300 hover:text-yellow-400"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(campaign.id);
                    }}
                    className="text-gray-300 hover:text-red-400"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 flex-grow overflow-y-auto">
        <div className="space-y-2">
          <p className="text-gray-600 break-words whitespace-pre-wrap">
            {campaign.description}
          </p>
        </div>
      </div>
      
      <div className="flex justify-between items-center p-4 pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            <span className='font-bold'>Sistema:</span> {campaign.system}
          </span>
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
  )
}