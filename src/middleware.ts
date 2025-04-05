import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que requerem autenticação
const protectedRoutes = ['/dashboard', '/campaigns']

// Rotas públicas que não devem ser acessadas quando autenticado
const publicRoutes = ['/login', '/signup']

interface CampaignPlayer {
  campaign_id: string;
}

interface Campaign {
  id: string;
  name: string;
  created_at: string;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // Se o usuário não estiver autenticado e tentar acessar uma rota protegida
  if (!session && protectedRoutes.some(route => path.startsWith(route))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Se o usuário estiver autenticado e tentar acessar login/signup
  if (session && publicRoutes.includes(path)) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Verifica se é uma rota de campanha apenas com o nome
  const campaignNameMatch = path.match(/^\/campaign\/([^\/]+)$/)
  
  if (campaignNameMatch && session?.user) {
    const campaignSlug = campaignNameMatch[1]
    const campaignName = campaignSlug.replace(/-/g, ' ')
    
    try {
      // Primeiro tenta encontrar campanhas onde o usuário é mestre
      const { data: masterCampaigns } = await supabase
        .from('campaigns')
        .select('id, name, created_at')
        .ilike('name', campaignName)
        .eq('master_id', session.user.id)

      let campaigns = masterCampaigns || []

      // Busca campanhas onde o usuário é jogador
      const { data: campaignPlayers } = await supabase
        .from('campaign_players')
        .select('campaign_id')
        .eq('player_id', session.user.id)

      if (campaignPlayers && campaignPlayers.length > 0) {
        const campaignIds = campaignPlayers.map((pc: CampaignPlayer) => pc.campaign_id)
        const { data: playerCampaigns } = await supabase
          .from('campaigns')
          .select('id, name, created_at')
          .ilike('name', campaignName)
          .in('id', campaignIds)

        if (playerCampaigns) {
          campaigns = [...campaigns, ...playerCampaigns]
        }
      }

      // Se encontrou apenas uma campanha, redireciona direto para ela
      if (campaigns.length === 1) {
        const campaign = campaigns[0]
        req.nextUrl.pathname = `/campaign/${campaign.id}/${campaignSlug}`
        return NextResponse.rewrite(req.nextUrl)
      }
      
      // Se encontrou múltiplas campanhas, redireciona para a página de seleção
      if (campaigns.length > 1) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/campaign-select'
        redirectUrl.searchParams.set('name', campaignSlug)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Erro no middleware:', error)
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/campaign/:path*',
    '/campaign-select',
  ],
} 