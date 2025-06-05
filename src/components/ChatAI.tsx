// src/components/ChatAI.tsx

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Send, Sparkles, ChevronDown, ChevronUp, MessageSquarePlus, Trash2  } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'react-toastify';
import ConfirmationModal from './modals/ConfirmationModal';
import ConversationHistory from './ConversationHistory';

// Definindo o tipo para uma mensagem na conversa
interface Message {
  role: 'user' | 'model'; // 'user' para o usuário, 'model' para a IA
  parts: Array<{ text: string }>;
}

interface ChatAIProps {
  sessionId: string; // ID da sessão atual
  campaignSystem?: string | null; // Sistema da campanha (opcional, para contexto da IA)
}

// Defina um limite de caracteres para o texto curto
const SHORT_TEXT_LIMIT = 200; // Por exemplo, 200 caracteres


export function ChatAI({ sessionId, campaignSystem }: ChatAIProps) {
  const supabase = createClientComponentClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false); // NOVO: Estado para controlar o modal de confirmação

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = useCallback(async (convId: string | null = null) => {
    setLoading(true);
    setMessages([]);
    setExpandedMessages(new Set());
    setInputMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado para carregar chat.');
      setLoading(false);
      return;
    }

    if (convId) { // Carrega uma conversa específica
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, messages')
        .eq('id', convId)
        .eq('user_id', user.id) // Garante que o usuário é o dono
        .single();

      if (error) {
        console.error('Erro ao carregar conversa específica:', error);
        toast.error('Erro ao carregar a conversa selecionada.');
        setMessages([]);
        setConversationId(null);
      } else if (data) {
        setConversationId(data.id);
        setMessages(data.messages as Message[]);
        setExpandedMessages(new Set());
      } else {
        // Conversa não encontrada (ex: foi deletada por outro dispositivo)
        toast.error('A conversa selecionada não foi encontrada.');
        setMessages([]);
        setConversationId(null);
      }
    } else { // Carrega a última conversa ou inicia uma nova
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, messages')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar histórico de conversa inicial:', error);
        toast.error('Erro ao carregar histórico da conversa com a IA.');
        setMessages([]);
        setConversationId(null);
      } else if (data) {
        setConversationId(data.id);
        setMessages(data.messages as Message[]);
        setExpandedMessages(new Set());
      } else {
        setConversationId(null);
        setMessages([]);
        setExpandedMessages(new Set());
      }
    }
    setLoading(false);
    scrollToBottom();
  }, [sessionId, supabase]);

  useEffect(() => {
    loadConversation(); // Carrega a última conversa ao iniciar
  }, [loadConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const newMessage: Message = { role: 'user', parts: [{ text: inputMessage }] };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: inputMessage,
          conversationId: conversationId,
          sessionId: sessionId,
          campaignSystem: campaignSystem,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao comunicar com a IA.');
      }

      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, { role: 'model', parts: [{ text: data.aiContent }] }]);
      setConversationId(data.conversationId);
      toast.success('Mensagem da IA recebida!');

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(`Erro: ${error.message || 'Erro desconhecido.'}`);
      setMessages((prevMessages) => prevMessages.slice(0, prevMessages.length - 1));
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setExpandedMessages(new Set());
    toast.info('Nova conversa iniciada!');
  };

  const handleDeleteConversation = async () => {
    setShowConfirmDeleteModal(false); // Fecha o modal antes de iniciar a exclusão
    if (!conversationId) {
      toast.info('Não há conversa para deletar.');
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Erro ao deletar conversa:', error);
        toast.error('Erro ao deletar a conversa.');
      } else {
        toast.success('Conversa deletada com sucesso!');
        startNewConversation();
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar conversa:', error);
      toast.error('Erro inesperado ao deletar a conversa.');
    } finally {
      setIsDeleting(false);
    }
  };

    // Função para selecionar uma conversa do histórico
  const handleSelectOldConversation = (convId: string) => {
    if (convId === conversationId) {
      toast.info('Esta conversa já está aberta.');
      return;
    }
    loadConversation(convId); // Carrega a conversa específica
    toast.info('Conversa antiga carregada.');
  };


  return (
    <div className="flex flex-col flex-1 bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center bg-gray-700 py-2 rounded-t-lg">
        <h1 className="text-lg font-bold text-blue-400 flex items-center justify-center">
          <Sparkles className="h-5 w-5 mr-2" /> Chat com IA
        </h1>
        <p className="text-sm text-gray-300">Converse com a IA para auxiliar suas narrativas!</p>
        <div className="flex justify-center space-x-2 mt-2 px-2">
          <Button
            onClick={startNewConversation}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-600"
            disabled={loading}
          >
            <MessageSquarePlus className="h-4 w-4 mr-1" /> Nova Conversa
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:bg-gray-600"
            onClick={() => setShowConfirmDeleteModal(true)} // Abre o modal de confirmação
            disabled={!conversationId || isDeleting || loading}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Deletar Conversa
          </Button>
        </div>
      </div>

       {/* Componente para Histórico de Conversas */}
      <ConversationHistory
        sessionId={sessionId}
        onConversationSelect={handleSelectOldConversation}
        currentConversationId={conversationId}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 && !conversationId ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Iniciando chat...
          </div>
        ) : messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-center">
            Comece uma nova conversa! A IA está pronta para te ajudar com suas ideias de RPG.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-lg shadow-md ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-100'
                }`}
                onClick={() => msg.role === 'model' && toggleExpand(index)}
                style={{ cursor: msg.role === 'model' && msg.parts[0].text.length > SHORT_TEXT_LIMIT ? 'pointer' : 'default' }}
              >
                {msg.parts.map((part, pIdx) => {
                  const text = part.text;
                  const isExpanded = expandedMessages.has(index);
                  const shouldTruncate = msg.role === 'model' && text.length > SHORT_TEXT_LIMIT && !isExpanded;

                  return (
                    <div key={pIdx}>
                      <p>
                        {shouldTruncate ? `${text.substring(0, SHORT_TEXT_LIMIT)}...` : text}
                      </p>
                      {shouldTruncate ? (
                        <div className="flex justify-end text-gray-300 text-xs mt-1">
                          Clique para expandir <ChevronDown className="h-4 w-4 ml-1" />
                        </div>
                      ) : (msg.role === 'model' && text.length > SHORT_TEXT_LIMIT && isExpanded) && (
                        <div className="flex justify-end text-gray-300 text-xs mt-1">
                          Clique para encolher <ChevronUp className="h-4 w-4 ml-1" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 mt-auto">
        <div className="flex items-center space-x-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={loading ? "Gerando resposta..." : "Digite sua mensagem..."}
            rows={1}
            className="flex-1 bg-gray-700 text-white border-gray-600 focus:border-blue-500 placeholder:text-gray-400"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button type="submit" disabled={loading || !inputMessage.trim()}>
            {loading ? 'Enviando...' : <Send className="h-5 w-5" />}
          </Button>
        </div>
        {loading && <p className="text-xs text-gray-400 mt-1">Aguardando resposta da IA...</p>}
      </form>

      {/* Seu Modal de Confirmação customizado */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleDeleteConversation}
        title="Confirmar Exclusão da Conversa"
        message="Tem certeza que deseja deletar esta conversa com a IA? Esta ação não pode ser desfeita."
        confirmButtonText={isDeleting ? 'Deletando...' : 'Deletar'}
        cancelButtonText="Cancelar"
        isConfirmDestructive={true} // Define o estilo destrutivo para o botão de confirmação
      />
    </div>
  );
}