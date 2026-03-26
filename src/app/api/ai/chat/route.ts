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
  model: 'gemini-3-flash-preview',
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let messages: any[] = [];
    let currentConversationId = conversationId;

    // 1. Obter o histórico de mensagens existente do Supabase, se houver um conversationId
    if (currentConversationId) {
      const { data: conversationData, error: conversationError } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', currentConversationId)
        .eq('user_id', user.id) // Garante que o usuário é o dono da conversa
        .single();

      if (conversationError && conversationError.code !== 'PGRST116') {
        console.error('Erro ao buscar conversa no Supabase:', conversationError);
        // Em caso de erro na busca, tratar como nova conversa para não bloquear
        currentConversationId = null;
      } else if (conversationData && conversationData.messages) {
        messages = conversationData.messages;
      } else {
        // Se conversationId foi passado mas não encontrou, é uma nova conversa
        currentConversationId = null;
      }
    }

    // 2. Adicionar a mensagem do usuário ao histórico LOCAL
    messages.push({ role: 'user', parts: [{ text: userMessage }] });

    // 3. Preparar o chat para a IA com o histórico ATUALIZADO (incluindo a mensagem do usuário)
    // Note: O Gemini automaticamente adiciona a mensagem de sendMessage ao seu histórico interno,
    // mas precisamos que nosso array `messages` esteja completo para salvar no DB.
    const chat = model.startChat({
        history: messages.slice(0, -1), // Envia todo o histórico MENOS a última mensagem do usuário
                                       // A última mensagem do usuário será enviada via sendMessage
    });

    // 4. Gerar a resposta da IA enviando SOMENTE a nova mensagem do usuário
    const result = await chat.sendMessage(userMessage);
    const aiResponse = result.response.text();

    // 5. Adicionar a resposta da IA ao histórico LOCAL (que já contém a mensagem do usuário)
    messages.push({ role: 'model', parts: [{ text: aiResponse }] });

    // 6. Salvar/Atualizar o histórico COMPLETO no Supabase
    if (currentConversationId) {
      // Atualizar conversa existente
      const { error: updateError } = await supabase
        .from('ai_conversations')
        .update({ messages: messages }) // Salva o array `messages` COMPLETO
        .eq('id', currentConversationId)
        .eq('user_id', user.id);
      if (updateError) {
        console.error('Erro ao atualizar conversa no Supabase:', updateError);
      }
    } else {
      // Criar nova conversa
      const { data: newConversation, error: insertError } = await supabase
        .from('ai_conversations')
        .insert([{
          user_id: user.id, // ID do usuário autenticado
          session_id: sessionId,
          messages: messages, // Salva o array `messages` COMPLETO
        }])
        .select('id') // Retorna o ID da nova conversa
        .single();
      if (insertError) {
        console.error('Erro ao inserir nova conversa no Supabase:', insertError);
        return NextResponse.json({ error: 'Falha ao criar nova conversa.' }, { status: 500 });
      }
      if (newConversation) {
        currentConversationId = newConversation.id;
      } else {
        console.error('API: Nova conversa criada, mas o ID não foi retornado.');
        return NextResponse.json({ error: 'Falha ao obter ID da nova conversa.' }, { status: 500 });
      }
    }

    // 7. Retornar a resposta da IA e o histórico COMPLETO e ATUALIZADO para o frontend
    return NextResponse.json({
        aiContent: aiResponse,
        conversationId: currentConversationId,
        updatedMessages: messages // <--- RETORNA O HISTÓRICO COMPLETO E ATUALIZADO
    });

  } catch (error: any) {
    console.error('Erro na API de Chat da IA:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}