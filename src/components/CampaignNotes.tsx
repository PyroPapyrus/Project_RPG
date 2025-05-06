// src/components/CampaignNotes.tsx

'use client'; // Garante que é um componente cliente

import { useState, useEffect } from 'react';
// Remover a importação do cliente básico: import { supabase } from '@/lib/supabaseClient';
import { useSessionContext } from '@supabase/auth-helpers-react'; // Importar o hook
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';

// Interface Note (mantida a correção do tipo 'users' e outras colunas)
interface Note {
  id: string;
  title: string;
  content: string;
  is_private: boolean;
  session_id: string | null;
  campaign_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
   // Adicione a propriedade users se você selecionar users(name) na query CampaignNotes
   users?: { id: string; username: string | null }[] | null; // Tipo para o relacionamento users(name)
}

// Renomear a interface de props
interface CampaignNotesProps {
  campaignId: string; // Usar campaignId em vez de sessionId
  // Remover a prop userId
  // userId: string;
}

// Renomear o componente e receber apenas campaignId como prop
export default function CampaignNotes({ campaignId }: CampaignNotesProps) {
  // Usar useSessionContext para obter o cliente Supabase e a sessão
  const { supabaseClient, session } = useSessionContext();
  const user = session?.user; // Obter o objeto user da sessão
  const userId = user?.id; // Obter o uid do usuário autenticado

  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  // Inicializar newNote: campaign_id preenchido, session_id null para notas de campanha
  const [newNote, setNewNote] = useState({ title: '', content: '', is_private: true, campaign_id: campaignId, session_id: null as string | null });
  const [loading, setLoading] = useState(false);

  // Resetar newNote e buscar notas quando o campaignId ou o userId mudar
  useEffect(() => {
    // Só buscar notas se houver um usuário autenticado
    if (userId) {
       setNewNote({ title: '', content: '', is_private: true, campaign_id: campaignId, session_id: null }); // Resetar formulário
      fetchNotes();
    } else {
       setNotes([]); // Limpar notas se não houver usuário
    }
  }, [campaignId, userId]); // Dependências: campaignId e userId (do hook)

  const fetchNotes = async () => {
    // Usar o supabaseClient do useSessionContext
    // Busca inicial das notas da tabela notes (esta já funciona e retorna 200)
    const { data, error } = await supabaseClient
      .from('notes')
      .select('id, title, content, is_private, session_id, campaign_id, user_id, created_at, updated_at')
      .eq('campaign_id', campaignId)
      .is('session_id', null)
      .order('created_at', { ascending: true });
  
    if (error) {
      console.error("Erro ao buscar notas da campanha:", error);
      toast.error('Erro ao buscar notas da campanha.');
    } else {
      // Set notes initially (opcional, você pode preferir setar apenas após o mapeamento dos nomes)
      // setNotes(data || []);
  
      // Certifique-se de que há notas e que o userId do usuário logado está disponível
      if (data && data.length > 0 && userId) {
        // Coleta os IDs únicos dos usuários das notas (incluindo você e outros)
        const userIds = Array.from(new Set(data.map(note => note.user_id)));
  
        // **Busca os usuários na tabela public.users usando .in()**
        // Esta query agora DEVE retornar dados para os IDs que existem na tabela populada.
        const { data: usersData, error: usersError } = await supabaseClient
          .from('users') // Query a tabela public.users (com id e username)
          .select('id, username') // Selecionar id e username
          .in('id', userIds); // <--- Filtrar pela coluna 'id' usando a lista de IDs
  
        if (usersError) {
          console.error("Erro ao buscar nomes dos usuários:", usersError);
          console.error("Detalhes do erro de usuários:", usersError); // Loga detalhes completos do erro
          // Se a busca de dados de usuário falhar (RLS deny, etc.), defina as notas sem nomes mapeados
          setNotes(data || []);
          toast.error('Não foi possível carregar nomes dos autores.'); // Informa o usuário
        } else {
          // Mapeia os nomes dos usuários para as notas
          const notesWithUserNames = data.map(note => {
            // Encontrar o autor em usersData onde user.id === note.user_id
            const author = usersData?.find(user => user.id === note.user_id);
  
            return {
              ...note,
              // Mapear para a estrutura da propriedade 'users' (array de objetos com id e username)
              // Interface Note: users?: { id: string; username: string | null }[] | null;
              users: author ? [{ id: author.id, username: author.username }] : null
            };
          });
          setNotes(notesWithUserNames); // Atualiza o state com as notas mapeadas
        }
      } else {
          // Define as notas se não houver notas buscadas ou userId não disponível
          setNotes(data || []);
           console.log("Não há notas para processar ou userId não disponível.");
      }
    }
  };
  

  const handleEdit = async () => {
    if (!editingNote || !userId) return; // Não editar se não houver nota ou usuário
    // Usar o supabaseClient do useSessionContext
    // RLS 'Allow own notes update' usará auth.uid() para verificar permissão no servidor.
    const { error } = await supabaseClient
      .from('notes')
      .update({
        title: editingNote.title,
        content: editingNote.content
      })
      .eq('id', editingNote.id)
       .eq('user_id', userId); // Manter filtro cliente para consistência/UI

    if (error) {
      console.error("Erro ao atualizar nota de campanha:", error);
      toast.error('Erro ao atualizar a nota.');
    } else {
      toast.success('Nota atualizada com sucesso.');
      setEditingNote(null);
      fetchNotes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return; // Não deletar se não houver usuário
    // Usar o supabaseClient do useSessionContext
    // RLS 'Allow own notes delete' usará auth.uid() para verificar permissão no servidor.
    const { error } = await supabaseClient.from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Manter filtro cliente para consistência/UI

    if (error) {
      console.error("Erro ao excluir nota de campanha:", error);
      toast.error('Erro ao excluir a nota.');
    } else {
      toast.success('Nota excluída com sucesso.');
      fetchNotes();
    }
  };

  const handleAddNote = async () => {
    if (!userId) { // Verificar se há usuário autenticado
      toast.error("Você precisa estar autenticado para adicionar notas.");
      console.error("Tentativa de adicionar nota sem usuário autenticado.");
      return;
    }

    setLoading(true);

    // Ao adicionar uma nota NESTE componente de campanha, garantimos que:
    // - user_id é o do usuário autenticado (userId do hook)
    // - campaign_id é o da campanha atual (campaignId da prop)
    // - session_id é explicitamente definido como null
    const noteToInsert = {
       title: newNote.title,
       content: newNote.content,
       is_private: newNote.is_private,
       user_id: userId, // Usar o userId obtido do hook
       campaign_id: campaignId, // Definir campaign_id para a campanha atual
       session_id: null, // Garante que é uma nota SOMENTE de campanha
    };

    // Usar o supabaseClient do useSessionContext
    // A RLS 'Allow own notes insert' verificará se auth.uid() == user_id
    // E se (campaign_id está preenchido E session_id é null) E o usuário é jogador/mestre na campanha
    const { error } = await supabaseClient.from('notes').insert([noteToInsert]);

    setLoading(false);

    if (error) {
      console.error("Erro ao adicionar nota de campanha:", error);
      toast.error('Erro ao adicionar a nota.');
    } else {
      setNewNote({ title: '', content: '', is_private: true, campaign_id: campaignId, session_id: null });
      toast.success('Nota adicionada com sucesso.');
      fetchNotes();
    }
  };

   // Não renderizar nada ou mostrar mensagem enquanto o usuário não estiver carregado
   if (!user) {
       return <p>Carregando usuário ou redirecionando...</p>;
   }


  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-2">Notas da Campanha</h2>
        <div className="space-y-2">
          {/*
            Você pode adicionar lógica aqui para separar visualmente:
            - Notas privadas do usuário logado
            - Notas públicas de campanha (criadas por qualquer jogador)
            - Pode mostrar o nome do autor (se a query selecionar 'users(name)')
          */}
          {notes.map((note) => (
            <div key={note.id} className="border rounded p-3">
               {editingNote?.id === note.id ? (
                 <>
                    <Input
                      className="mb-2"
                      value={editingNote.title}
                      onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    />
                    <Textarea
                      className="mb-2"
                      value={editingNote.content}
                      onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button onClick={handleEdit}>Salvar</Button>
                      <Button variant="outline" onClick={() => setEditingNote(null)}>Cancelar</Button>
                    </div>
                 </>
               ) : (
                 <>
                     <h4 className="font-semibold text-gray-800">
                        {note.title}
                        {note.is_private ? " (Privada)" : " (Pública)"}
                            {/* Mostrar quem criou / indicar se é sua */}
                            {note.user_id !== userId ? ( // Se a nota NÃO é minha
                              note.users?.[0]?.username && ` por ${note.users?.[0]?.username}` // Mostrar "por [Nome]" se o nome estiver disponível
                            ) : ( // Se a nota É minha
                              "(Minha Nota)" // Mostrar "(Minha Nota)" (ou remova esta linha se não quiser texto para suas notas)
                            )}
                    </h4>
                   <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                   {note.user_id === userId && (
                     <div className="flex justify-end mt-2 space-x-2">
                       <Button variant="outline" size="sm" onClick={() => setEditingNote(note)}>Editar</Button>
                       <Button variant="outline" size="sm" onClick={() => handleDelete(note.id)}>Excluir</Button>
                     </div>
                   )}
                 </>
               )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Nova Nota de Campanha</h3>
        <Input
          placeholder="Título"
          className="mb-2"
          value={newNote.title}
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
        />
        <Textarea
          placeholder="Conteúdo"
          className="mb-2"
          value={newNote.content}
          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
        />
        <div className="flex items-center space-x-2 mb-2">
          <input
            id="is_private_campaign"
            type="checkbox"
            checked={newNote.is_private}
            onChange={(e) => setNewNote({ ...newNote, is_private: e.target.checked })}
          />
          <label htmlFor="is_private_campaign" className="text-sm">Privada</label>
        </div>
        <Button onClick={handleAddNote} disabled={loading}>
          {loading ? 'Adicionando...' : 'Adicionar Nota de Campanha'}
        </Button>
      </div>
    </div>
  );
}