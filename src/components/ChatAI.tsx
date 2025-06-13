// src/components/ChatAI.tsx

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Send, Sparkles, ChevronDown, ChevronUp, MessageSquarePlus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'react-toastify';
import ConfirmationModal from './modals/ConfirmationModal';
import ConversationHistory from './ConversationHistory';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface ChatAIProps {
  sessionId: string;
  campaignSystem?: string | null;
}

const SHORT_TEXT_LIMIT = 200;

export function ChatAI({ sessionId, campaignSystem }: ChatAIProps) {
  const supabase = createClientComponentClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleExpand = (messageId: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const loadConversation = useCallback(async (convIdToLoad: string | null = null) => {
    setLoading(true);
    setMessages([]);
    setExpandedMessages(new Set());
    setInputMessage('');
    setConversationId(convIdToLoad); // Garante que o ID da conversa seja o que está sendo carregado ou null

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado para carregar chat.');
      setLoading(false);
      return;
    }

    let fetchedData = null;
    let fetchError = null;

    if (convIdToLoad) {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, messages')
        .eq('id', convIdToLoad)
        .eq('user_id', user.id)
        .single();
      fetchedData = data;
      fetchError = error;
    } else {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, messages')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      fetchedData = data;
      fetchError = error;
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao carregar histórico de conversa:', fetchError);
      toast.error('Erro ao carregar histórico da conversa com a IA.');
      setConversationId(null);
    } else if (fetchedData) {
      setConversationId(fetchedData.id);
      const messagesWithIds: Message[] = (fetchedData.messages as Message[]).map(msg => ({
        ...msg,
        id: msg.id || uuidv4()
      }));
      setMessages(messagesWithIds);
    } else {
      setConversationId(null);
    }

    setLoading(false);
    scrollToBottom();
  }, [sessionId, supabase]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const currentMessage = inputMessage; // Salva a mensagem atual do input
    setInputMessage(''); // Limpa o input imediatamente
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: currentMessage, // Usa a mensagem salva
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
      // AGORA: Atualiza o estado messages com o histórico COMPLETO retornado pela API
      // E garante que cada mensagem tenha um ID único.
      const updatedMessagesWithIds: Message[] = (data.updatedMessages as Message[]).map(msg => ({
          ...msg,
          id: msg.id || uuidv4()
      }));
      setMessages(updatedMessagesWithIds);
      setConversationId(data.conversationId); // Atualiza o ID da conversa (especialmente para novas)

      toast.success('Mensagem da IA recebida!');

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(`Erro: ${error.message || 'Erro desconhecido.'}`);
      // Se der erro, o input já foi limpo e o loading está ativo.
      // O histórico não é alterado, evitando duplicação ou dados incorretos no frontend.
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
    setShowConfirmDeleteModal(false);
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

  const handleSelectOldConversation = (convId: string) => {
    if (convId === conversationId) {
      toast.info('Esta conversa já está aberta.');
      return;
    }
    loadConversation(convId);
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
            onClick={() => setShowConfirmDeleteModal(true)}
            disabled={!conversationId || isDeleting || loading}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Deletar Conversa
          </Button>
        </div>
      </div>

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
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-lg shadow-md ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-100'
                }`}
                onClick={() => msg.role === 'model' && toggleExpand(msg.id)}
                style={{ cursor: msg.role === 'model' && msg.parts[0].text.length > SHORT_TEXT_LIMIT ? 'pointer' : 'default' }}
              >
                {msg.parts.map((part, pIdx) => {
                  const text = part.text;
                  const isExpanded = expandedMessages.has(msg.id);
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

      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleDeleteConversation}
        title="Confirmar Exclusão da Conversa"
        message="Tem certeza que deseja deletar esta conversa com a IA? Esta ação não pode ser desfeita."
        confirmButtonText={isDeleting ? 'Deletando...' : 'Deletar'}
        cancelButtonText="Cancelar"
        isConfirmDestructive={true}
      />
    </div>
  );
}