// src/app/campaign/[id]/[name]/session/[sessionId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft } from 'lucide-react';
import SessionHeader from '@/components/SessionHeader';
import SessionPreparation from '@/components/SessionPreparation';
import SessionSummary from '@/components/SessionSummary';
import SessionImageUpload from '@/components/SessionImageUpload';
import SessionNotes from '@/components/SessionNotes';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: {
    id: string;
    name: string;
    sessionId: string;
  };
}

const SessionPage = ({ params }: PageProps) => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [sessionData, setSessionData] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', params.sessionId)
        .single();

      if (!error && session) {
        setSessionData(session);

        const { data: campaign } = await supabase
          .from('campaigns')
          .select('master_id')
          .eq('id', session.campaign_id)
          .single();

        if (campaign && campaign.master_id === user.id) {
          setIsMaster(true);
        }
      }

      setLoading(false);
    };

    fetchSession();
  }, [params.sessionId]);

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!sessionData) {
    return <div className="p-8">Sessão não encontrada.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" className="mb-4" onClick={() => router.push(`/campaign/${params.id}/${params.name}`)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Campanha
      </Button>

      <SessionHeader
        name={sessionData.name}
        sessionDate={sessionData.session_date}
        goal={sessionData.goal}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-6">
        <div className="lg:col-span-3 space-y-6">

          {/* Visto apenas pelo mestre */}
          {isMaster && (
            <SessionPreparation
              sessionId={sessionData.id}
              initialPreparation={sessionData.preparation}
            />
          )}

          <SessionSummary
            initialSummary={sessionData.summary || ''}
            onSave={
              isMaster
                ? async (newSummary) => {
                    const { error } = await supabase
                      .from('sessions')
                      .update({ summary: newSummary })
                      .eq('id', sessionData.id);
                    if (!error) {
                      setSessionData({ ...sessionData, summary: newSummary });
                    }
                  }
                : () => {} // Jogador não salva
            }
          />

          {/* Upload visível apenas pelo mestre */}
          {isMaster && (
            <SessionImageUpload
              sessionId={sessionData.id}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <SessionNotes sessionId={sessionData.id} userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default SessionPage;
