// src/app/api/join-campaign/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { invite_code } = await req.json()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // 1. Buscar a campanha pelo código
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('invite_code', invite_code)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Código inválido ou campanha não encontrada.' }, { status: 404 })
  }

  // 2. Verificar se usuário já está na campanha
  const { data: alreadyInCampaign } = await supabase
    .from('campaign_players')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (alreadyInCampaign) {
    return NextResponse.json({ error: 'Você já participa desta campanha.' }, { status: 400 })
  }

  // 3. Inserir como player
  const { error: insertError } = await supabase
    .from('campaign_players')
    .insert({
      campaign_id: campaign.id,
      user_id: user.id,
      role: 'player',
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Você entrou na campanha com sucesso!' }, { status: 200 })
}
