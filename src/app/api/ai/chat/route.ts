// src/app/api/ai/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY não está definida nas variáveis de ambiente.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // Ou 'gemini-pro', como preferir
  systemInstruction: `Você é um assistente de IA para mestres e jogadores de RPG. Seu objetivo é ajudar na criação e desenvolvimento de narrativas, personagens, locais, itens, tramas, desafios e o qualquer similares para RPG. Seja criativo, conciso e direto ao ponto. Use uma linguagem que remeta ao universo de RPG de fantasia medieval (ou outro sistema se especificado). Adapte suas sugestões para serem úteis para o RPG.`,
  generationConfig: {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 2048,
  },
});

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { userMessage, conversationId, sessionId, campaignSystem } = await req.json();

    // 1. Obter o histórico de mensagens existente do Supabase
    let messages: any[] = [];
    if (conversationId) {
      const { data: conversationData, error: conversationError } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      if (conversationError && conversationError.code !== 'PGRST116') { // PGRST116 é "no rows found"
        console.error('Erro ao buscar conversa no Supabase:', conversationError);
        return NextResponse.json({ error: 'Erro ao carregar histórico da conversa.' }, { status: 500 });
      }

      if (conversationData && conversationData.messages) {
        messages = conversationData.messages;
      }
    }

    // 2. Adicionar a mensagem do usuário ao histórico
    messages.push({ role: 'user', parts: [{ text: userMessage }] });

    // 3. Preparar o chat para a IA
    const chat = model.startChat({
      history: messages,
    });

    // 4. Gerar a resposta da IA
    const result = await chat.sendMessage(userMessage); // Envie a última mensagem do usuário
    const aiResponse = result.response.text();

    // 5. Adicionar a resposta da IA ao histórico
    messages.push({ role: 'model', parts: [{ text: aiResponse }] });

    // 6. Salvar/Atualizar o histórico no Supabase
    let newConversationId = conversationId;
    if (conversationId) {
      // Atualizar conversa existente
      const { error: updateError } = await supabase
        .from('ai_conversations')
        .update({ messages: messages })
        .eq('id', conversationId);
      if (updateError) {
        console.error('Erro ao atualizar conversa no Supabase:', updateError);
        // Não impeça a resposta ao usuário, mas logue o erro
      }
    } else {
      // Criar nova conversa
      const { data: newConversation, error: insertError } = await supabase
        .from('ai_conversations')
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id, // Obtenha o ID do usuário
          session_id: sessionId,
          messages: messages,
        }])
        .select('id')
        .single();
      if (insertError) {
        console.error('Erro ao inserir nova conversa no Supabase:', insertError);
        // Não impeça a resposta ao usuário, mas logue o erro
      }
      if (newConversation) {
        newConversationId = newConversation.id;
      }
    }

    return NextResponse.json({ aiContent: aiResponse, conversationId: newConversationId });

  } catch (error: any) {
    console.error('Erro na API de Chat da IA:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}