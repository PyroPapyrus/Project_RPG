// src/components/SessionNotes.tsx

'use client'; // Garante que é um componente cliente

import { useState, useEffect } from 'react';
// Remover a importação do cliente básico: import { supabase } from '@/lib/supabaseClient';
import { useSessionContext } from '@supabase/auth-helpers-react'; // Importar o hook
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';

// Interface Note (atualizada para incluir a propriedade 'users')
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
  // Adicionando a propriedade 'users' para o nome do autor, similar ao CampaignNotes
  users?: { id: string; username: string | null }[] | null; // Assumindo que users tem id e username
}

interface SessionNotesProps {
  sessionId: string;
  // Remover a prop userId, pois vamos obtê-lo da sessão
  // userId: string;
}

// Recebe apenas sessionId como prop
export default function SessionNotes({ sessionId }: SessionNotesProps) {
  // Usar useSessionContext para obter o cliente Supabase e a sessão
  const { supabaseClient, session } = useSessionContext();
  const user = session?.user; // Obter o objeto user da sessão
  const userId = user?.id; // Obter o uid do usuário autenticado

  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  // Inicializar newNote
  const [newNote, setNewNote] = useState({ title: '', content: '', is_private: true, session_id: sessionId, campaign_id: null as string | null });
  const [loading, setLoading] = useState(false);

  // Resetar newNote e buscar notas quando o sessionId ou o userId mudar (usuário loga/desloga)
  useEffect(() => {
    // Só buscar notas se houver um usuário autenticado
    if (userId) {
      setNewNote({ title: '', content: '', is_private: true, session_id: sessionId, campaign_id: null });
      fetchNotes();
    } else {
      // Limpar notas se não houver usuário autenticado
      setNotes([]);
    }
  }, [sessionId, userId]); // Dependências: sessionId e userId (do hook)

  const fetchNotes = async () => {
    // Usar o supabaseClient do useSessionContext
    // Busca inicial das notas da tabela notes (esta já funciona e retorna 200)
    const { data, error } = await supabaseClient
      .from('notes')
      // Selecione as colunas necessárias da nota
      .select('id, title, content, is_private, session_id, campaign_id, user_id, created_at, updated_at')
      .eq('session_id', sessionId) // Filtrar pela session_id
      // O RLS para notes já está configurado
      .order('created_at', { ascending: true });


    if (error) {
      console.error("Erro ao buscar notas da sessão:", error);
      toast.error('Erro ao buscar notas da sessão.');
      // Se a busca de notas falhar, defina o estado como vazio
       setNotes([]);
    } else {
       // Notas buscadas com sucesso. Agora buscamos os dados dos usuários.

      // Certifique-se de que há notas e que o userId do usuário logado está disponível
      if (data && data.length > 0 && userId) {
        // Coleta os IDs únicos dos usuários que criaram as notas
        const userIds = Array.from(new Set(data.map(note => note.user_id)));
        // console.log("User IDs das notas de sessão:", userIds); // Opcional para debug

        // **Busca os usuários na tabela public.users usando .in()**
        // Esta query usa a tabela public.users populada com RLS adequado
        const { data: usersData, error: usersError } = await supabaseClient
          .from('users') // Query a tabela public.users (com id e username)
          .select('id, username') // Selecionar id e username
          .in('id', userIds); // <--- Filtrar pela coluna 'id' usando a lista de IDs dos autores das notas

        // console.log("Dados de usuários buscados para sessão:", usersData); // Opcional para debug

        if (usersError) {
          console.error("Erro ao buscar nomes dos autores das notas de sessão:", usersError);
          // Se a busca de dados de usuário falhar, proceda com os dados de notas mas sem nomes mapeados
          setNotes(data || []); // Define o estado com as notas originais
          toast.error('Não foi possível carregar nomes dos autores das notas.'); // Informa o usuário
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

          // console.log("Notas de sessão no state com nomes mapeados:", notesWithUserNames); // Opcional para debug
          setNotes(notesWithUserNames); // Atualiza o state com as notas mapeadas
        }
      } else {
          // Se não houver notas buscadas ou userId não disponível, defina o estado com as notas originais
          setNotes(data || []);
           console.log("Não há notas de sessão para processar ou userId não disponível.");
      }
    }
  };

  const handleEdit = async () => {
    if (!editingNote || !userId) return; // Não editar se não houver nota ou usuário autenticado
    // Usar o supabaseClient do useSessionContext
    // RLS 'Allow own notes update' usará auth.uid() para verificar permissão no servidor.
    const { error } = await supabaseClient
      .from('notes')
      .update({
        title: editingNote.title,
        content: editingNote.content
      })
      .eq('id', editingNote.id)
      .eq('user_id', userId); // Manter o filtro no cliente para consistência e UI

    if (error) {
      console.error("Erro ao atualizar nota da sessão:", error);
      toast.error('Erro ao atualizar a nota.');
    } else {
      toast.success('Nota atualizada com sucesso.');
      setEditingNote(null);
      fetchNotes(); // Atualizar a lista
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return; // Não deletar se não houver nota ou usuário autenticado
    // Usar o supabaseClient do useSessionContext
    // RLS 'Allow own notes delete' usará auth.uid() para verificar permissão no servidor.
    const { error } = await supabaseClient.from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Manter o filtro no cliente para consistência e UI

    if (error) {
      console.error("Erro ao excluir nota da sessão:", error);
      toast.error('Erro ao excluir a nota.');
    } else {
      toast.success('Nota excluída com sucesso.');
      fetchNotes(); // Atualizar a lista
    }
  };

  const handleAddNote = async () => {
    if (!userId) { // Verificar se há usuário autenticado antes de tentar adicionar
      toast.error("Você precisa estar autenticado para adicionar notas.");
      console.error("Tentativa de adicionar nota sem usuário autenticado.");
      return; // Interrompe a função
    }

    setLoading(true);

    const noteToInsert = {
       title: newNote.title,
       content: newNote.content,
       is_private: newNote.is_private,
       user_id: userId, // Usar o userId obtido do hook (que é o auth.uid())
       session_id: sessionId, // Definir session_id para a sessão atual
       campaign_id: null, // Garantir que é uma nota de sessão (campaign_id é null)
    };

    // Usar o supabaseClient do useSessionContext
    // A RLS 'Allow own notes insert' verificará se auth.uid() == user_id e se a nota é de sessão/campanha válida
    const { error } = await supabaseClient.from('notes').insert([noteToInsert]);

    setLoading(false);

    if (error) {
      console.error("Erro ao adicionar nota da sessão:", error);
      toast.error('Erro ao adicionar a nota.');
    } else {
      setNewNote({ title: '', content: '', is_private: true, session_id: sessionId, campaign_id: null });
      toast.success('Nota adicionada com sucesso.');
      fetchNotes(); // Atualizar a lista
    }
  };

  // Não renderizar nada ou mostrar mensagem enquanto o usuário não estiver carregado
  if (!user) {
    return <p>Carregando usuário ou redirecionando para login...</p>; // Ou um spinner/loading state
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-2">Notas da Sessão</h2> {/* Título para Notas de Sessão */}
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="border rounded p-3">
              {editingNote?.id === note.id ? (
                <>
                  {/* Lógica de edição */}
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
                  {/* Exibir título, visibilidade e nome do autor */}
                  <h4 className="font-semibold text-gray-800">
                    {note.title} {note.is_private ? "(Privada)" : "(Pública)"}
                    {/* Lógica para mostrar o nome do autor, similar ao CampaignNotes */}
                    {/* Se a nota NÃO é minha, e o nome do autor está disponível, mostre "por [Nome]" */}
                     {note.user_id !== userId ? (
                         note.users?.[0]?.username && ` por ${note.users?.[0]?.username}`
                     ) : (
                         "(Minha Nota)" // Ou null, ou "" se não quiser texto para suas notas
                     )}
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                  {/* Botões de Editar/Excluir aparecem apenas para notas do usuário logado */}
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
        <h3 className="font-semibold mb-2">Nova Nota de Sessão</h3> {/* Título para Nova Nota de Sessão */}
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
            id="is_private_session" // ID único para este checkbox
            type="checkbox"
            checked={newNote.is_private}
            onChange={(e) => setNewNote({ ...newNote, is_private: e.target.checked })}
          />
          <label htmlFor="is_private_session" className="text-sm">Privada</label>
        </div>
        <Button onClick={handleAddNote} disabled={loading}>
          {loading ? 'Adicionando...' : 'Adicionar Nota de Sessão'}
        </Button>
      </div>
    </div>
  );
}