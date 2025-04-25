// src/components/session/SessionNotes.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';

interface Note {
  id: string;
  title: string;
  content: string;
  is_private: boolean;
  session_id: string;
  user_id: string;
}

interface SessionNotesProps {
  sessionId: string;
  userId: string;
}

export function SessionNotes({ sessionId, userId }: SessionNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', is_private: true });

  useEffect(() => {
    fetchNotes();
  }, [sessionId]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('is_private', true);

    if (error) {
      toast.error('Erro ao buscar notas.');
    } else {
      setNotes(data);
    }
  };

  const handleEdit = async () => {
    if (!editingNote) return;
    const { error } = await supabase
      .from('notes')
      .update({ title: editingNote.title, content: editingNote.content })
      .eq('id', editingNote.id);

    if (error) {
      toast.error('Erro ao atualizar a nota.');
    } else {
      setNotes((prev) => prev.map((note) => (note.id === editingNote.id ? editingNote : note)));
      toast.success('Nota atualizada com sucesso.');
      setEditingNote(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir a nota.');
    } else {
      setNotes((prev) => prev.filter((note) => note.id !== id));
      toast.success('Nota excluída com sucesso.');
    }
  };

  const handleAddNote = async () => {
    const { data, error } = await supabase.from('notes').insert([
      {
        ...newNote,
        session_id: sessionId,
        user_id: userId,
      },
    ]).select();

    if (error || !data) {
      toast.error('Erro ao adicionar a nota.');
    } else {
      setNotes((prev) => [...prev, data[0]]);
      setNewNote({ title: '', content: '', is_private: true });
      toast.success('Nota adicionada com sucesso.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-2">Notas Privadas</h2>
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="border rounded p-3">
              {editingNote?.id === note.id ? (
                <div>
                  <Input
                    className="mb-2"
                    value={editingNote.title}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, title: e.target.value })
                    }
                  />
                  <Textarea
                    className="mb-2"
                    value={editingNote.content}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, content: e.target.value })
                    }
                  />
                  <div className="flex justify-end space-x-2">
                    <Button onClick={handleEdit}>Salvar</Button>
                    <Button variant="outline" onClick={() => setEditingNote(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold text-gray-800">{note.title}</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex justify-end mt-2 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingNote(note)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(note.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Nova Nota</h3>
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
            id="is_private"
            type="checkbox"
            checked={newNote.is_private}
            onChange={(e) => setNewNote({ ...newNote, is_private: e.target.checked })}
          />
          <label htmlFor="is_private" className="text-sm">Privada</label>
        </div>
        <Button onClick={handleAddNote}>Adicionar Nota</Button>
      </div>
    </div>
  );
}
