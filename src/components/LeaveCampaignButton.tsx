// components/LeaveCampaignButton.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify'; // Ou sua biblioteca de toast
import { Button } from '@/components/ui/button';
import ConfirmationModal from '@/components/modals/ConfirmationModal'; // Ajuste o caminho conforme necessário

// Assumindo que você tem um tipo para Campaign ou CampaignBase definido em outro lugar
// Se não, você pode usar 'any' ou definir uma interface básica aqui
// import { type Campaign as CampaignBase } from '@/types/campaign';

interface LeaveCampaignButtonProps {
    campaignId: string;
    campaignName: string;
    userId: string; // Pass the authenticated user ID
    isMaster: boolean; // Indicate if the user is the master
    authorized: boolean; // Indicate if the user is authorized to see the campaign
}

const LeaveCampaignButton: React.FC<LeaveCampaignButtonProps> = ({
    campaignId,
    campaignName,
    userId,
    isMaster,
    authorized,
}) => {
    const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false); // Local loading state for the operation

    const supabase = createClientComponentClient();
    const router = useRouter();

    const handleLeaveButtonClick = () => {
        setIsLeaveConfirmOpen(true); // Abre o modal de confirmação
    };

    const handleConfirmLeave = async () => {
        setIsLeaveConfirmOpen(false); // Fecha o modal de confirmação

        if (!userId || !campaignId) {
            toast.error('Não foi possível sair da campanha. Informações faltando.');
            return;
        }

        setLoading(true); // Inicia o estado de carregamento

        // --- PASSO 1: Deletar a entrada do jogador em campaign_players ---
        console.log(`Tentando deletar entrada em campaign_players para user ${userId} na campanha ${campaignId}`);
        const { error: playerDeleteError } = await supabase
            .from('campaign_players')
            .delete()
            .eq('campaign_id', campaignId)
            .eq('user_id', userId);

        if (playerDeleteError) {
            console.error("Erro ao deletar entrada do jogador:", playerDeleteError.message);
            toast.error(playerDeleteError.message || 'Erro ao sair da campanha.');
            setLoading(false);
            return; // Para se houver erro na deleção do jogador
        }

        console.log(`Entrada em campaign_players deletada com sucesso para user ${userId} na campanha ${campaignId}.`);

        // --- PASSO 2: Deletar as notas do jogador para esta campanha ---
        console.log(`Tentando deletar notas em notes para user ${userId} na campanha ${campaignId}`);
        const { error: notesDeleteError } = await supabase
            .from('notes')
            .delete()
            .eq('campaign_id', campaignId)
            .eq('user_id', userId);

        setLoading(false); // Finaliza o estado de carregamento

        if (notesDeleteError) {
            console.error("Erro ao deletar notas do jogador:", notesDeleteError.message);
            // Decide se exibe um erro fatal ou apenas um aviso que as notas podem ter ficado
            toast.warning('Você saiu da campanha, mas ocorreu um erro ao deletar suas notas.');
            // Continua para redirecionar mesmo com erro nas notas
        } else {
            console.log(`Notas em campaign_notes deletadas com sucesso para user ${userId} na campanha ${campaignId}.`);
            toast.success('Você saiu da campanha e suas notas foram removidas.');
        }

        // --- Redireciona o usuário para o dashboard após tentar sair e deletar notas ---
        router.push('/dashboard');
    };

    const handleCancelLeave = () => {
        setIsLeaveConfirmOpen(false);
    };

    // Renderiza o botão apenas se estiver autorizado E NÃO for o mestre.
    if (!authorized || isMaster) {
        return null;
    }

    return (
        <>
            <Button
                variant="destructive"
                size="sm"
                onClick={handleLeaveButtonClick}
                disabled={loading} // Desabilita o botão enquanto estiver processando ambas as deleções
            >
                {loading ? 'Saindo e removendo notas...' : 'Sair da Campanha'}
            </Button>

            {/* Modal de Confirmação para Sair da Campanha */}
            <ConfirmationModal
                isOpen={isLeaveConfirmOpen}
                onClose={handleCancelLeave}
                message={`Tem certeza que deseja sair da campanha "${campaignName}"? Esta ação removerá seu vínculo com a campanha e suas notas associadas a ela. Você precisará do código de convite para entrar novamente.`}
                onConfirm={handleConfirmLeave}
                title="DESEJA SAIR DA CAMPANHA?"
                confirmButtonText="Sair da Campanha"
                isConfirmDestructive={true}
            />
        </>
    );
};

export default LeaveCampaignButton;