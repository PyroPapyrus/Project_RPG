import { Campaign } from '@/types/campaign'

const CAMPAIGN_ACCESS_KEY = 'campaign_access_'

export function storeCampaignAccess(slug: string, id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CAMPAIGN_ACCESS_KEY + slug, id)
  }
}

export function getCampaignAccess(slug: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CAMPAIGN_ACCESS_KEY + slug)
  }
  return null
}

export function removeCampaignAccess(slug: string) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CAMPAIGN_ACCESS_KEY + slug)
  }
}

export function generateCampaignLink(campaign: Campaign): string {
  const slug = campaign.name.toLowerCase().replace(/ /g, '-')
  storeCampaignAccess(slug, campaign.id)
  return `/campaign/${encodeURIComponent(slug)}`
} 