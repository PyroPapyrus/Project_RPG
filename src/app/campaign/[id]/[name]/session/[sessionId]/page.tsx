// src/app/campaign/[id]/[name]/session/[sessionId]/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft } from 'lucide-react';
import SessionHeader from '@/components/SessionHeader';
import SessionPreparation from '@/components/SessionPreparation';
import SessionSummary from '@/components/SessionSummary';
import SessionImageUpload from '@/components/SessionImageUpload';
import SessionNotes from '@/components/SessionNotes';
import { Button } from '@/components/ui/button';
import SessionImageViewer from '@/components/SessionImageViewer';
import { type Session } from '@/types/session'; 
import { type Campaign } from '@/types/campaign';
import { toast } from 'react-toastify';
import { BackButton } from '@/components/ui/back-button';
import { ChatAI } from '@/components/ChatAI';
import { Loading } from '@/components/Loading';

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

  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaignSystem, setCampaignSystem] = useState<string | null>(null);
  

  const fetchSession = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      setLoading(false); // Garantir que loading é false antes de sair
      return;
    }

      setUserId(user.id);

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', params.sessionId)
        .single();

      if (!sessionError && session) {
        setSessionData(session);

        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select('master_id, system')
          .eq('id', session.campaign_id)
          .single() as { data: Campaign | null, error: any };

          if (!campaignError && campaign) {
            if (campaign.master_id === user.id) {
              setIsMaster(true);
            }
              setCampaignSystem(campaign.system || null);
          }  else if (campaignError) {
              console.error('Erro ao buscar campanha para verificar mestre:', campaignError);
          }
          } else {
            console.error('Erro ao buscar sessão:', sessionError);
            toast.error('Erro ao carregar os dados da sessão. Pode ser que a sessão não exista ou você não tenha acesso.');
            setSessionData(null); // Garantir que sessionData é null em caso de erro
          }


      setLoading(false);
    }, [params.sessionId, router, supabase]);


    useEffect(() => {
        fetchSession();
      }, [fetchSession]); 

    if (!sessionData) {
      return (
        <div className="flex flex-col bg-gray-900 items-center justify-center min-h-screen">
          <p className="text-white mb-4">Sessão não encontrada ou acesso negado.</p>
          <Button onClick={() => router.push(`/campaign/${params.id}/${params.name}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Campanha
          </Button>
        </div>
      );
    }


  return (
    <div className="flex min-h-screen justify-between z-10">
      
      <aside className="bg-gray-700 text-white max-w-[420px] max-h-screen break-words w-full overflow-y-auto flex flex-col">
        <ChatAI 
          sessionId={sessionData.id}
          campaignSystem={campaignSystem}
          params={params}
        />
      </aside>

      <div className='max-h-screen bg-gray-800 overflow-y-auto relative flex-1'>
        <div className='mx-5 pb-[250px]'> {/* Added padding bottom to prevent content from being hidden behind fixed element */}
          <SessionHeader
            name={sessionData.name}
            sessionDate={sessionData.session_date ?? ''}
            goal={sessionData.goal ?? ''}
          />

          <div className="flex flex-col">
            {/* Visto apenas pelo mestre */}
            {isMaster && sessionData && (
              <SessionPreparation
                sessionId={sessionData.id}
                initialPreparation={sessionData.preparation ?? ''}
                sessionName={sessionData.name ?? ''}
                sessionGoal={sessionData.goal ?? ''}
                isMaster={isMaster}
                campaignSystem={campaignSystem} 
              />
            )}

            <SessionSummary
              initialSummary={sessionData.summary ?? ''}
              onSave={
                isMaster
                ? async (newSummary) => {
                    const { error } = await supabase
                      .from('sessions')
                      .update({ summary: newSummary })
                      .eq('id', sessionData.id);
                    if (!error) {
                      setSessionData({ ...sessionData, summary: newSummary });
                      toast.success('Resumo salvo com sucesso!'); // Feedback de sucesso
                    } else {
                        toast.error('Erro ao salvar o resumo.'); // Feedback de erro
                    }
                  }
                : () => {} // Jogador não salva
            }
            isMaster={isMaster}
          />
          </div>
        </div>

        <div className='fixed bottom-0 left-[420px] right-[420px] mx-5'>
          <SessionImageUpload
            sessionId={sessionData.id}
            isMaster={isMaster}
          />
          <SessionImageViewer
            sessionId={sessionData.id}
            isMaster={isMaster}
            userId={userId}
          />
        </div>
      </div>
      {/* Coluna da direita */}
      <div className="text-white bg-gray-900 w-full hidden lg:block max-w-[420px] max-h-screen break-words overflow-y-auto">
        <SessionNotes sessionId={sessionData.id} />
      </div>

    </div>
  );
};

export default SessionPage;
