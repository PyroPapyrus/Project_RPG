// src/types/session.ts

// Define a estrutura de dados para uma sessão,
// baseada na sua tabela 'sessions' no Supabase.
export interface Session {
    id: string;            // UUID, chave primária
    campaign_id: string;   // UUID, chave estrangeira para 'campaigns'
    name: string;          // Nome da sessão (TEXT NOT NULL)
    goal: string;   // Descrição da sessão (TEXT NOT NULL)
    session_date: string;  // Data/Hora da sessão (TIMESTAMP WITH TIME ZONE NOT NULL) - Manter como string ISO no frontend é comum
    summary?: string | null;// Relatório da sessão (TEXT, pode ser NULL)
    created_at: string;    // TIMESTAMP WITH TIME ZONE NOT NULL
    updated_at: string;    // TIMESTAMP WITH TIME ZONE NOT NULL
    preparation: string | null; // Espaço para preparação do GM (TEXT, pode ser NULL)
  }