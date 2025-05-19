// src/app/api/join-campaign/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
 const supabase = createRouteHandlerClient({ cookies })
 const { invite_code } = await req.json()

 const { data: { user }, error: authError } = await supabase.auth.getUser()
 if (authError || !user) {
    console.error('API: Não autenticado.'); // Adicionar log no servidor
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 }); // 401 para não autenticado
   }


 // 1. Buscar a campanha pelo código
 const { data: campaign, error: campaignError } = await supabase
  .from('campaigns')
  // --- ADICIONAR master_id AQUI ---
  .select('id, master_id') // Seleciona id E master_id
  // --- FIM ADIÇÃO ---
  .eq('invite_code', invite_code) // Use .eq() ou .ilike() dependendo da sua RLS e do que funcionou
  .maybeSingle(); // Use maybeSingle para não lançar erro se não encontrar

 if (campaignError || !campaign) {
  console.error('API: Campanha não encontrada ou erro na busca:', campaignError?.message || 'Não encontrada.'); // Adicionar log
  return NextResponse.json({ error: 'Código inválido ou campanha não encontrada.' }, { status: 404 }); // 404 para recurso não encontrado
 }

  // --- NOVA VERIFICAÇÃO: O USUÁRIO É O MESTRE? ---
  // Se a campanha foi encontrada, verifica se o usuário logado é o mestre dela.
  if (user.id === campaign.master_id) {
      console.warn(`API: Usuário ${user.id} é mestre da campanha ${campaign.id}. Impedindo join como player.`); // Adicionar log
      // Retorna uma resposta específica para o frontend ANTES de tentar inserir
      return NextResponse.json({ error: 'Mestre não pode entrar na própria campanha como jogador.' }, { status: 400 }); // 400 Bad Request para regra violada
  }
  // --- FIM NOVA VERIFICAÇÃO ---


 // 2. Verificar se usuário já está na campanha
    // Esta verificação só acontece SE a campanha foi encontrada E o usuário NÃO é o mestre.
 const { data: alreadyInCampaign, error: checkError } = await supabase
  .from('campaign_players')
  .select('id') // Basta selecionar o ID para saber se existe
  .eq('campaign_id', campaign.id)
  .eq('user_id', user.id)
  .maybeSingle(); // Use maybeSingle

    if (checkError) {
        console.error('API: Erro ao verificar participação do usuário:', checkError); // Adicionar log
        return NextResponse.json({ error: 'Erro ao verificar sua participação na campanha.' }, { status: 500 }); // 500 para erro interno
    }
 if (alreadyInCampaign) {
    console.warn(`API: Usuário ${user.id} já participa da campanha ${campaign.id}.`); // Adicionar log
  return NextResponse.json({ error: 'Você já participa desta campanha.' }, { status: 409 }); // 409 Conflict
 }

 // 3. Inserir como player na campanha
    // Esta inserção só acontece SE a campanha foi encontrada, o usuário NÃO é o mestre, E ele NÃO participa.
    // A política RLS na campaign_players (master cannot enter) ainda deve estar ativa como segurança extra.
 const { error: insertError } = await supabase
  .from('campaign_players')
  .insert({
   campaign_id: campaign.id,
   user_id: user.id,
   role: 'player',
  });

 if (insertError) {
  console.error('API: Erro ao inserir usuário na campanha:', insertError.message); // Adicionar log
     // O message do insertError geralmente conterá o detalhe da falha (incluindo RLS se for o caso)
  return NextResponse.json({ error: insertError.message || 'Erro ao entrar na campanha.' }, { status: 500 }); // 500 para erro na inserção
 }

 // Se tudo deu certo
 console.log(`API: Usuário ${user.id} entrou na campanha ${campaign.id} com sucesso.`); // Adicionar log
 return NextResponse.json({ message: 'Você entrou na campanha com sucesso!' }, { status: 200 }); // 200 OK
}