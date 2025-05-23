// src/types/session.ts

// Define a estrutura de dados para uma sessão,
// baseada na sua tabela 'sessions' no Supabase.
export interface Session {
  id: string;
  campaign_id: string;
  name: string;
  goal: string | null; // Corrigido para refletir que pode ser null
  session_date: string | null; // Corrigido para refletir que pode ser null
  summary: string | null;
  preparation: string | null;
  created_at: string;
  updated_at: string;
  // Adicione outras colunas da sua tabela 'sessions' aqui
}
