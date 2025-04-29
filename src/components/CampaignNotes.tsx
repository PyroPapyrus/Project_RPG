'use client';

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
  session_id: string | null;
  campaign_id: string | null;
  user_id: string;
}

interface CampaignNotesProps {
  campaignId: string;
  userId: string;
}

export default function CampaignNotes({ campaignId, userId }: CampaignNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', is_private: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [campaignId]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .eq('is_private', true)
      .is('session_id', null); // ⚡ Só traz notas que são da campanha (sem sessão associada)

    if (error) {
      toast.error('Erro ao buscar notas da campanha.');
    } else {
      setNotes(data || []);
    }
  };

  const handleAddNote = async () => {
    setLoading(true);
    const { error } = await supabase.from('notes').insert([
      {
        ...newNote,
        campaign_id: campaignId,
        session_id: null, // ⚡ Forçando ser nota de campanha
        user_id: userId,
      },
    ]);

    setLoading(false);

    if (error) {
      toast.error('Erro ao adicionar a nota.');
    } else {
      fetchNotes();
      setNewNote({ title: '', content: '', is_private: true });
      toast.success('Nota adicionada com sucesso.');
    }
  };

  const handleEdit = async () => {
    if (!editingNote) return;
    setLoading(true);

    const { error } = await supabase
      .from('notes')
      .update({ title: editingNote.title, content: editingNote.content })
      .eq('id', editingNote.id);

    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar a nota.');
    } else {
      fetchNotes();
      setEditingNote(null);
      toast.success('Nota atualizada com sucesso.');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir a nota.');
    } else {
      fetchNotes();
      toast.success('Nota excluída com sucesso.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-4">Notas Privadas da Campanha</h2>

        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border rounded p-4">
              {editingNote?.id === note.id ? (
                <div className="space-y-2">
                  <Input
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    placeholder="Título"
                  />
                  <Textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    placeholder="Conteúdo"
                  />
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleEdit} disabled={loading}>Salvar</Button>
                    <Button variant="outline" onClick={() => setEditingNote(null)} disabled={loading}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold">{note.title}</h4>
                  <p className="text-gray-700 whitespace-pre-line">{note.content}</p>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingNote(note)}>Editar</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(note.id)}>Excluir</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-2">Adicionar Nova Nota</h3>
        <Input
          value={newNote.title}
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
          placeholder="Título da Nota"
          className="mb-2"
        />
        <Textarea
          value={newNote.content}
          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
          placeholder="Conteúdo da Nota"
          className="mb-2"
        />
        <div className="flex items-center space-x-2 mb-4">
          <input
            id="is_private"
            type="checkbox"
            checked={newNote.is_private}
            onChange={(e) => setNewNote({ ...newNote, is_private: e.target.checked })}
          />
          <label htmlFor="is_private" className="text-sm">Privada</label>
        </div>
        <Button onClick={handleAddNote} disabled={loading}>Adicionar Nota</Button>
      </div>
    </div>
  );
}
