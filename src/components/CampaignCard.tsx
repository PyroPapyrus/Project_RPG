import Link from 'next/link'
import { Campaign } from '@/types/campaign'
import { Button } from '@/components/ui/button'

interface CampaignCardProps {
  campaign: Campaign
  role: 'master' | 'player'
}

export function CampaignCard({ campaign, role }: CampaignCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{campaign.system}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          role === 'master' 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {role === 'master' ? 'Mestre' : 'Jogador'}
        </span>
      </div>
      
      <div className="mt-4">
        <p className="text-gray-600 text-sm">{campaign.description}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {campaign.players_count}/{campaign.max_players} jogadores
          </span>
        </div>
        <Button asChild>
          <Link
            href={`/campaign/${campaign.id}`}
            className="w-full"
          >
            Ver detalhes
          </Link>
        </Button>
      </div>
    </div>
  )
} 