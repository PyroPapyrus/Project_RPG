// src/components/SessionNotes.tsx

'use client'; // Garante que é um componente cliente

import { useState, useEffect } from 'react';
// Remover a importação do cliente básico: import { supabase } from '@/lib/supabaseClient';
import { useSessionContext } from '@supabase/auth-helpers-react'; // Importar o hook
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';

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

type NoteFilter = 'all' | 'mine' | 'public_others';

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
   const [updatingPrivateStatus, setUpdatingPrivateStatus] = useState<string | null>(null);
  const [filter, setFilter] = useState<NoteFilter>('all');

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

   // --- HANDLER: Alternar o status de privacidade de uma nota ---
 // Permite que o autor de uma nota a torne pública ou privada.
 const handleTogglePrivate = async (note: Note) => {
  // Só o autor pode alterar a privacidade da nota
  if (!userId || note.user_id !== userId) return;

  setUpdatingPrivateStatus(note.id); // Indica qual nota está sendo atualizada visualmente

  const newPrivateStatus = !note.is_private; // Inverte o status atual

  try {
    // Envia a atualização do status de privacidade para o Supabase
    // A RLS deve garantir que apenas o autor possa atualizar o campo is_private.
    const { data, error } = await supabaseClient
      .from('notes')
      .update({ is_private: newPrivateStatus }) // Atualiza apenas o campo is_private
      .eq('id', note.id) // Onde o ID corresponde à nota
      .eq('user_id', userId) // Garante que só o autor atualiza (redundante com RLS, mas seguro)
      .select('id, is_private') // Opcional: Retorna o ID e o novo status privado
      .single(); // Espera um único resultado

    if (error) throw error; // Lança erro para ser pego pelo catch

    // Atualiza o estado local das notas imediatamente para feedback rápido na UI
    setNotes(prevNotes =>
      prevNotes.map(n =>
        // Encontra a nota atualizada pelo ID e cria um novo objeto com o novo status privado
        n.id === note.id ? { ...n, is_private: newPrivateStatus } : n
      )
    );

    toast.success(`Nota "${note.title}" tornada ${newPrivateStatus ? 'privada' : 'pública'}.`);

  } catch (error: any) {
    console.error("Erro ao alternar privacidade da nota:", error);
    toast.error('Erro ao alternar a privacidade da nota.');
  } finally {
    setUpdatingPrivateStatus(null); // Reseta o estado de atualização visual
  }
};

  const filteredNotes = notes.filter(note => {
    // Lógica de filtragem:
    // Inclui se o filtro for 'all'
    // OU inclui se o filtro for 'mine' E a nota for do usuário logado
    // OU inclui se o filtro for 'public_others' E a nota for pública E não for do usuário logado
    if (!userId) return false; // Garante que só filtra se houver usuário
  
    const filterCondition = (
       (filter === 'all') ||
       (filter === 'mine' && note.user_id === userId) ||
       (filter === 'public_others' && !note.is_private && note.user_id !== userId)
    );
  
    return filterCondition;
  });


  // Não renderizar nada ou mostrar mensagem enquanto o usuário não estiver carregado
  if (!user) {
    return <p>Carregando usuário ou redirecionando para login...</p>; // Ou um spinner/loading state
  }

  return (
    <div className="space-y-4 mb-4">
      <div>
        <h2 className="text-2xl mt-2 font-semibold justify-self-center py-[5px] px-[64px]">Notas da Sessão</h2>
        
        {/* Seção de filtro */}
        <div className="flex px-4 rounded items-center justify-center gap-2 my-2">
          <select
            className="rounded-md justify-self-start items-start bg-gray-200 h-10 px-4 py-2 text-cyan-500 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as NoteFilter)}
          >
            <option value="all">Todas as Notas</option>
            <option value="mine">Minhas Notas</option>
            <option value="public_others">Públicas (Outros)</option>
          </select>
          <Button 
            className='gap-2 text-sm whitespace-nowrap'
            onClick={handleAddNote}
            disabled={loading}
          >
            {loading ? 'Adicionando...' : 'Adicionar Anotação'}
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Seção de nova nota */}
        <div className="mx-5 text-black py-2 border-b-2">
          <div className='justify-between flex'>
            <h3 className="font-semibold mb-1 text-white">Nova Nota da Sessão</h3>
            {newNote.is_private ? (
              <span className="material-symbols-rounded text-red-600" title="Nota Privada">lock</span>
            ) : (
              <span className="material-symbols-rounded text-green-500" title="Nota Pública">lock_open</span>
            )}
          </div>

          <Textarea
            placeholder="Título/nome da nota"
            className="bg-gray-600 border-none mb-2 resize-none min-h-[40px] overflow-hidden text-white"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            maxLength={60}
          />
          <p className="-mt-1 mb-1 text-xs text-white">
            {newNote.title.length}/60 caracteres
          </p>

          <Textarea
            placeholder="Conteúdo da nota"
            className="bg-gray-600 border-none mb-2 text-white"
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            maxLength={200}
          />
          <p className="-mt-1 mb-1 text-xs text-white">
            {newNote.content.length}/200 caracteres
          </p>

          <div className="bg-black text-white px-2 py-1 rounded-sm justify-self-start flex items-center space-x-1 mb-1">
            <input
              id="is_private_session"
              type="checkbox"
              checked={newNote.is_private}
              onChange={(e) => setNewNote({ ...newNote, is_private: e.target.checked })}
            />
            <label htmlFor="is_private_session" className="text-sm">Privada</label>
          </div>
        </div>

        {/* Lista de notas */}
        <div className="space-y-2 mt-3 text-black">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-gray-700 rounded p-3 mx-5">
              {editingNote?.id === note.id ? (
                // Modo de edição
                <>
                  <h1 className='text-sm text-yellow-500 mb-1'>Editando Nota: "{note.title}"</h1>
                  <Textarea
                    className="bg-gray-600 border-none mb-2 resize-none min-h-[40px] overflow-hidden text-white"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    placeholder="Título"
                    maxLength={60}
                  />
                  <p className="-mt-1 mb-1 text-xs text-white">
                    {editingNote.title.length}/60 caracteres
                  </p>
                  <Textarea
                    className="mb-2 text-white bg-gray-600 border-none"
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    placeholder="Conteúdo da nota"
                    maxLength={200}
                  />
                  <p className="-mt-1 mb-1 text-xs text-white">
                    {editingNote.content.length}/200 caracteres
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button onClick={handleEdit}>Salvar</Button>
                    <Button variant="outline" onClick={() => setEditingNote(null)}>Cancelar</Button>
                  </div>
                </>
              ) : (
                // Modo de visualização
                <>
                  <h4 className="font-semibold text-white border-b-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg -mb-2 font-semibold overflow-hidden overflow-wrap-break-word break-words max-w-full">
                        {note.title}
                      </span>
                      {note.is_private ? (
                        <span className="material-symbols-rounded text-red-600" title="Nota Privada">lock</span>
                      ) : (
                        <span className="material-symbols-rounded text-green-500" title="Nota Pública">lock_open</span>
                      )}
                    </div>
                    {note.user_id === userId ? (
                      <span className="text-sm text-blue-600 font-normal">Minha Nota</span>
                    ) : (
                      note.users?.[0]?.username && (
                        <span className="text-sm text-yellow-500 font-normal">
                          {' por '}
                          {note.users[0].username}
                        </span>
                      )
                    )}
                  </h4>
                  <p className="text-sm text-white whitespace-pre-wrap">{note.content}</p>
                  {note.user_id === userId && (
                    <div className="flex justify-end mt-2 space-x-2">
                      <Button
                        className='bg-black rounded hover:bg-gray-500 text-white'
                        size="sm"
                        onClick={() => handleTogglePrivate(note)}
                        disabled={updatingPrivateStatus === note.id}
                      >
                        {updatingPrivateStatus === note.id ? (
                          'Atualizando...'
                        ) : note.is_private ? (
                          'Tornar Pública'
                        ) : (
                          'Tornar Privada'
                        )}
                      </Button>
                      <Button className='bg-black rounded hover:bg-gray-500 text-yellow-500' size="sm" onClick={() => setEditingNote(note)}>
                        Editar
                      </Button>
                      <Button className='bg-black rounded hover:bg-gray-500 text-red-600' size="sm" onClick={() => handleDelete(note.id)}>
                        Excluir
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Mensagem quando não há notas */}
          {filteredNotes.length === 0 && (
            <p className="text-white text-center mt-8">
              {filter === 'all' ? (
                'Ainda não há notas para esta sessão que você possa visualizar.'
              ) : filter === 'mine' ? (
                'Você ainda não adicionou notas para esta sessão.'
              ) : (
                'Não há notas públicas de outros usuários nesta sessão.'
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}