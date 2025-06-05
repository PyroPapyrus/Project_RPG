// src/components/ConversationHistory.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';
import { Button } from './ui/button'; // Reutilize seu componente Button

interface Conversation {
  id: string;
  created_at: string;
  messages: Array<any>; // Ou o tipo Message definido no ChatAI.tsx
}

interface ConversationHistoryProps {
  sessionId: string;
  onConversationSelect: (conversationId: string) => void;
  currentConversationId: string | null;
}

export function ConversationHistory({ sessionId, onConversationSelect, currentConversationId }: ConversationHistoryProps) {
  const supabase = createClientComponentClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        .order('created_at', { ascending: false }); // Ordenar das mais recentes para as mais antigas

      if (error) {
        console.error('Erro ao carregar histórico de conversas:', error);
        toast.error('Erro ao carregar histórico de conversas com a IA.');
      } else if (data) {
        // Filtrar a conversa atual para não aparecer na lista ou destacá-la
        setConversations(data);
      }
      setLoading(false);
    };

    fetchConversations();

    // Opcional: Assinar mudanças para atualizar a lista em tempo real
    // const channel = supabase
    //   .channel(`ai_conversations_list_${sessionId}`)
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: '*', // INSERT, UPDATE, DELETE
    //       schema: 'public',
    //       table: 'ai_conversations',
    //       filter: `session_id=eq.${sessionId}`
    //     },
    //     (payload) => {
    //       console.log('Change received!', payload);
    //       fetchConversations(); // Recarrega a lista quando há uma mudança
    //     }
    //   )
    //   .subscribe();

    // return () => {
    //   supabase.removeChannel(channel);
    // };

  }, [sessionId, supabase, currentConversationId]); // Adicione currentConversationId para re-renderizar quando a conversa muda

  const formatConversationTitle = (conversation: Conversation) => {
    // Tenta usar as primeiras N palavras da primeira mensagem do usuário ou modelo
    const firstMessage = conversation.messages.find(msg => msg.role === 'user' || msg.role === 'model');
    if (firstMessage && firstMessage.parts[0]?.text) {
      const text = firstMessage.parts[0].text;
      const words = text.split(' ').slice(0, 8).join(' '); // Pega as primeiras 8 palavras
      return `${words}${text.split(' ').length > 8 ? '...' : ''}`;
    }
    return `Conversa em ${new Date(conversation.created_at).toLocaleDateString()} ${new Date(conversation.created_at).toLocaleTimeString()}`;
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-inner mt-4"> {/* Adicione mt-4 para espaçamento */}
      <h2 className="text-md font-bold text-gray-200 mb-3">Histórico de Conversas</h2>
      {loading ? (
        <p className="text-gray-400 text-sm">Carregando histórico...</p>
      ) : conversations.length === 0 ? (
        <p className="text-gray-400 text-sm">Nenhuma conversa anterior encontrada para esta sessão.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar"> {/* Defina uma altura máxima e scrollbar */}
          {conversations
            .filter(conv => conv.id !== currentConversationId) // Filtra a conversa atual, se não quiser que apareça na lista
            .map((conv) => (
              <Button
                key={conv.id}
                onClick={() => onConversationSelect(conv.id)}
                variant="ghost"
                className={`w-full justify-start text-left text-gray-200 hover:bg-gray-600 ${conv.id === currentConversationId ? 'bg-gray-600 font-semibold' : ''}`}
                size="sm"
              >
                {formatConversationTitle(conv)}
              </Button>
            ))}
        </div>
      )}
      {/* Opcional: Adicione um estilo de scrollbar customizado em seu CSS global ou em um componente */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151; /* gray-700 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6b7280; /* gray-500 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563; /* gray-600 */
        }
      `}</style>
    </div>
  );
}

// Certifique-se de exportar a função ConversationHistory
export default ConversationHistory;