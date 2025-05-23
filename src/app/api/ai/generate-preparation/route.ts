// src/app/api/ai/generate-preparation/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'; // Exemplo com Gemini

// Certifique-se de que sua chave de API está nas variáveis de ambiente
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY não está definida nas variáveis de ambiente.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// // System Instruction, fornecedora da "personalidade" e um papel para a IA
// const systemInstruction = `Você é um assistente de IA especializado em auxiliar Mestres de RPG de mesa. Seu objetivo é ajudar a preparar sessões, sugerindo ideias para tramas, NPCs, locais, itens, nomes, descrições de ambiente e desafios.
// Sua linguagem deve ser criativa, concisa e focada em elementos de fantasia medieval/fantasia em geral.
// Sempre que possível, forneça sugestões que possam ser facilmente incorporadas à narrativa de RPG.
// Quando solicitado, ofereça múltiplas opções ou variações.
// Priorize a utilidade para um Mestre de Jogo.`;

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // Ou 'gemini-1.5-flash', etc.

  // systemInstruction: systemInstruction,
  // Configurações de segurança opcionais, mas recomendadas
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
    generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 1,
        maxOutputTokens: 2048,
    },
    });


export async function POST(req: NextRequest) {
  try {
    const { command, sessionName, sessionGoal, currentPreparation, campaignSystem } = await req.json();

    if (!command || !sessionName) {
      return NextResponse.json({ error: 'Comando ou nome da sessão da sessão estão faltando.' }, { status: 400 });
    }

    const systemContext = campaignSystem ? `Considere que o sistema de RPG é "${campaignSystem}".` : '';
    const goalContext = sessionGoal ? `O objetivo principal da sessão é: "${sessionGoal}".` : 'Não foi fornecido um objetivo específico para esta sessão.'; 

    let prompt = '';
    // Construir o prompt com base no comando e no contexto
    switch (command) {  
      case 'generate_summary':
        prompt = `Você é um assistente de IA para mestres de RPG. ${systemContext} Gere um resumo detalhado para a preparação da sessão.
          Nome da Sessão: "${sessionName}"
          ${goalContext}
          Preparação atual (para contexto, se houver): "${currentPreparation}"

          Foque em: O que pode acontecer na sessão? Quais são os principais eventos e reviravoltas? Qual é o clímax?
          Por favor, seja conciso e direto.`;
        break;
      case 'suggest_npcs':
        prompt = `Você é um assistente de IA para mestres de RPG. ${systemContext} Sugira 3-5 NPCs interessantes e relevantes para a sessão.
          Nome da Sessão: "${sessionName}"
          ${goalContext}
          Preparação atual (para contexto, se houver): "${currentPreparation}"

          Para cada NPC, forneça: Nome, Raça/Função, Personalidade, Motivações e uma breve descrição de sua relação com a sessão/objetivo.
          Formate como uma lista clara.`;
        break;
      case 'suggest_plot_hooks':
        prompt = `Você é um assistente de IA para mestres de RPG. ${systemContext} Sugira 3-5 ganchos de enredo (plot hooks) que os jogadores possam encontrar na próxima sessão.
          Nome da Sessão: "${sessionName}"
          ${goalContext}
          Preparação atual (para contexto, se houver): "${currentPreparation}"

          Os ganchos devem estar relacionados ao objetivo da sessão e serem intrigantes.
          Formate como uma lista numerada.`;
        break;
      case 'free_form_suggestion':
        prompt = `Você é um assistente de IA para mestres de RPG. ${systemContext}. O mestre deseja uma sugestão criativa para aprimorar o enredo atual da sessão.
          Nome da Sessão: "${sessionName}"
          ${goalContext}
          Preparação atual (para contexto, se houver): "${currentPreparation}"

          Qualquer ideia que possa auxiliar, como nomes de locais, itens, desafios, ou descrições de ambiente.`;
        break;

      default:
        return NextResponse.json({ error: 'Comando de IA desconhecido.' }, { status: 400 });
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiContent = response.text();

    return NextResponse.json({ aiContent });

  } catch (error: any) {
    console.error('Erro na API da IA:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}