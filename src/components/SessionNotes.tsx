// src/components/SessionNotes.tsx

'use client'; // Garante que é um componente cliente

import { useState, useEffect } from 'react';
// Remover a importação do cliente básico: import { supabase } from '@/lib/supabaseClient';
import { useSessionContext } from '@supabase/auth-helpers-react'; // Importar o hook
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';

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
  // Inicializar newNote - user_id será adicionado na função de handler
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
    const { data, error } = await supabaseClient
      .from('notes')
      .select('id, title, content, is_private, session_id, campaign_id, user_id, created_at, updated_at')
      .eq('session_id', sessionId) // Filtrar pela session_id
      // O RLS (Allow own notes select, Allow public campaign notes select for players)
      // usará o auth.uid() (que agora estará correto, pois o cliente vem do SessionContextProvider)
      // para filtrar quais notas associadas a esta session_id o usuário tem permissão para ver.
      // Remover filtros de user_id e is_private daqui, deixe o RLS fazer o trabalho no servidor.
      .order('created_at', { ascending: true });


    if (error) {
      console.error("Erro ao buscar notas:", error);
      toast.error('Erro ao buscar notas.');
    } else {
      // O RLS já filtrou. data conterá as notas que o usuário pode ver para esta sessão.
      setNotes(data || []);
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
      console.error("Erro ao atualizar nota:", error);
      toast.error('Erro ao atualizar a nota.');
    } else {
      toast.success('Nota atualizada com sucesso.');
      setEditingNote(null);
      fetchNotes(); // Atualizar a lista
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return; // Não deletar se não houver usuário autenticado
    // Usar o supabaseClient do useSessionContext
    // RLS 'Allow own notes delete' usará auth.uid() para verificar permissão no servidor.
    const { error } = await supabaseClient.from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Manter o filtro no cliente para consistência e UI

    if (error) {
      console.error("Erro ao excluir nota:", error);
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
       campaign_id: null, // Garantir que é uma nota de sessão
    };

    // Usar o supabaseClient do useSessionContext
    // A RLS 'Allow own notes insert' verificará se auth.uid() (no servidor) == user_id (nos dados inseridos)
    // E se (session_id está preenchido E campaign_id é null) - com base nas políticas
    const { error } = await supabaseClient.from('notes').insert([noteToInsert]);

    setLoading(false);

    if (error) {
      console.error("Erro ao adicionar nota:", error);
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
       {/* ... restante do JSX, que pode usar 'notes' para renderizar ... */}
         <div>
         <h2 className="text-lg font-bold mb-2">Notas da Sessão</h2>
         <div className="space-y-2">
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
                    <h4 className="font-semibold text-gray-800">{note.title} {note.is_private ? "(Privada)" : "(Pública)"}</h4>
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
         <h3 className="font-semibold mb-2">Nova Nota de Sessão</h3>
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
             id="is_private_session"
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