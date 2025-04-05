export interface Campaign {
  id: string
  name: string
  description: string
  system: string
  max_players: number
  players_count: number
  created_at: string
  updated_at: string
  master_id: string
  status: 'active' | 'paused' | 'completed'
} 