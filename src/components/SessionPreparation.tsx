// src/components/session/SessionPreparation.tsx

'use client'

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface SessionPreparationProps {
  sessionId: string;
  initialPreparation?: string;
}

export default function SessionPreparation({ sessionId, initialPreparation = '' }: SessionPreparationProps) {
  const supabase = createClientComponentClient();
  const [preparation, setPreparation] = useState(initialPreparation || '');
  const [loading, setLoading] = useState(false);
  const [savedPreparation, setSavedPreparation] = useState(initialPreparation);

  useEffect(() => {
    setPreparation(initialPreparation || '');
    setSavedPreparation(initialPreparation);
  }, [initialPreparation]);
  
  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('sessions')
      .update({ preparation })
      .eq('id', sessionId);

    setLoading(false);

    if (error) {
      toast.error('Erro ao salvar a preparação.');
    } else {
      toast.success('Preparação salva com sucesso!');
      setSavedPreparation(preparation);
    }
  };

  const hasChanges = preparation !== savedPreparation;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Pré-Sessão</h3>
      <Textarea
        value={preparation}
        onChange={(e) => setPreparation(e.target.value)}
        placeholder="Escreva aqui as preparações para a sessão..."
        rows={6}
      />
      <div className="mt-2 flex justify-end">
        <Button onClick={handleSave} disabled={loading || !hasChanges}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
