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
}

export function ConversationHistory({ sessionId, onConversationSelect, currentConversationId }: ConversationHistoryProps) {
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

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-inner mt-4">
      <Button
        onClick={() => setIsExpanded(!isExpanded)} // Alterna o estado de expansão
        variant="ghost"
        className="w-full justify-between text-left text-lg font-bold text-gray-200 hover:bg-gray-600 mb-2"
      >
        <div className="flex items-center">
          <History className="h-5 w-5 mr-2" /> Histórico de Conversas
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </Button>

      {isExpanded && ( // Renderiza o conteúdo do histórico apenas se isExpanded for true
        <>
          {loading ? (
            <p className="text-gray-400 text-sm p-2">Carregando histórico...</p>
          ) : conversations.length === 0 ? (
            <p className="text-gray-400 text-sm p-2">Nenhuma conversa anterior encontrada para esta sessão.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {conversations
                // Você pode manter o filtro, ou mostrar a conversa atual e destacá-la
                .filter(conv => conv.id !== currentConversationId)
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
        </>
      )}

      {/* Estilos para a scrollbar (mantidos como estavam) */}
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