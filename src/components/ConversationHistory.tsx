// src/components/ConversationHistory.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';
import { Button } from './ui/button'; // Reutilize seu componente Button
import { ChevronDown, ChevronUp, History } from 'lucide-react'; // Importe os ícones

interface Conversation {
  id: string;
  created_at: string;
  messages: Array<any>; // Ou o tipo Message definido no ChatAI.tsx
}

interface ConversationHistoryProps {
  sessionId: string;
  onConversationSelect: (conversationId: string) => void;
  currentConversationId: string | null;
  fullScreen?: boolean;
}

export function ConversationHistory({ 
  sessionId, 
  onConversationSelect, 
  currentConversationId,
  fullScreen 
}: ConversationHistoryProps) {
  const supabase = createClientComponentClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false); // NOVO: Estado para controlar a expansão

  // Função para carregar as conversas
  const fetchConversations = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado para carregar histórico.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, created_at, messages')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar histórico de conversas:', error);
      toast.error('Erro ao carregar histórico de conversas com a IA.');
    } else if (data) {
      setConversations(data);
    }
    setLoading(false);
  };

  // Efeito para buscar conversas na montagem ou quando a sessão/usuário muda
  useEffect(() => {
    fetchConversations();

    // Opcional: Assinar mudanças para atualizar a lista em tempo real
    // Se você habilitar isso, certifique-se de que a API de realtime do Supabase esteja configurada
    const channel = supabase
      .channel(`ai_conversations_list_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ai_conversations',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchConversations(); // Recarrega a lista quando há uma mudança
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [sessionId, supabase]); // 
  
  // Função para formatar o título da conversa
  const formatConversationTitle = (conversation: Conversation) => {
    const firstMessage = conversation.messages.find(msg => msg.role === 'user' || msg.role === 'model');
    if (firstMessage && firstMessage.parts[0]?.text) {
      const text = firstMessage.parts[0].text;
      const words = text.split(' ').slice(0, 8).join(' ');
      return `${words}${text.split(' ').length > 8 ? '...' : ''}`;
    }
    return `Conversa em ${new Date(conversation.created_at).toLocaleDateString('pt-BR')} ${new Date(conversation.created_at).toLocaleTimeString('pt-BR')}`;
  };

  if (fullScreen) {
    return (
      <div className="">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <History className="h-5 w-5 mr-2" /> Histórico de Conversas
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center text-gray-400">
            Carregando histórico...
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center text-gray-400">
            Nenhuma conversa anterior encontrada.
          </div>
        ) : (
          <div className="space-y-2 ">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onConversationSelect(conv.id)}
                className={`w-full p-4 text-left rounded-lg transition-colors ${
                  conv.id === currentConversationId 
                    ? 'bg-gray-500 hover:bg-gray-900 text-white' 
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-900'
                }`}
              >
                <div className="font-medium mb-1">
                  {formatConversationTitle(conv)}
                </div>
                <div className="text-sm text-gray-300">
                  {new Date(conv.created_at).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(conv.created_at).toLocaleTimeString('pt-BR')}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
}

// Certifique-se de exportar a função ConversationHistory
export default ConversationHistory;