// src/components/modals/PlayerManagementModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmationModal from './ConfirmationModal';

// Tipos para os dados do jogador (atualizados para o retorno da função)
interface PlayerDetail {
  user_id: string;
  username: string | null;
  email: string | null;
}

interface PlayerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  onPlayerRemoved: () => void;
}

const PlayerManagementModal: React.FC<PlayerManagementModalProps> = ({ isOpen, onClose, campaignId, onPlayerRemoved }) => {
  const supabase = createClientComponentClient();
  const [players, setPlayers] = useState<PlayerDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<PlayerDetail | null>(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    // Chamar a Postgres Function
    const { data, error } = await supabase.rpc('get_campaign_players_details', { campaign_id_param: campaignId });

    if (error) {
      console.error("Erro ao buscar jogadores:", error);
      toast.error("Erro ao carregar a lista de jogadores.");
      setPlayers([]);
    } else {
      setPlayers(data || []);
    }
    setLoading(false);
  }, [supabase, campaignId]);

  useEffect(() => {
    if (isOpen) {
      fetchPlayers();
    }
  }, [isOpen, fetchPlayers]);

  const handleRemovePlayer = async (player: PlayerDetail) => {
    setPlayerToRemove(player);
    setIsConfirmOpen(true);
  };

  const confirmRemovePlayer = async () => {
    if (!playerToRemove) return;

    setIsConfirmOpen(false);
    setLoading(true);

    const { error } = await supabase
      .from('campaign_players')
      .delete()
      .eq('campaign_id', campaignId) // campaignId é passado como prop para o modal
      .eq('user_id', playerToRemove.user_id);

    setLoading(false);

    if (error) {
      console.error("Erro ao remover jogador:", error);
      toast.error('Erro ao remover o jogador.');
    } else {
      toast.success('Jogador removido com sucesso!');
      fetchPlayers(); // Recarrega a lista
      onPlayerRemoved(); // Notifica o pai para atualizar a contagem
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <Button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:bg-gray-700 p-2 rounded-full"
          variant="ghost"
          size="sm"
        >
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Gerenciar Jogadores</h2> {/* Ajuste no título */}

        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : players.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Nenhum jogador nesta campanha (exceto o mestre, claro!).</p>
        ) : (
          <ul className="space-y-4"> {/* Aumentado o espaçamento entre itens */}
            {players.map((player) => (
              <li key={player.user_id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg shadow-sm"> {/* Adicionado padding e sombra */}
                <div className="flex flex-col"> {/* Organiza nome e email em coluna */}
                  <span className="text-white text-lg font-semibold"> {/* Nome maior e mais negrito */}
                    {player.username || 'Usuário Desconhecido'}
                  </span>
                  {player.email && (
                    <span className="text-gray-300 text-sm mt-1"> {/* Email menor e mais claro */}
                      ({player.email})
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => handleRemovePlayer(player)}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1" // Ajuste para alinhar ícone e texto
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isConfirmOpen && playerToRemove && (
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          message={`Tem certeza que deseja remover "${playerToRemove.username || playerToRemove.email || 'este jogador'}" da campanha? Esta ação não pode ser desfeita.`}
          onConfirm={confirmRemovePlayer}
          title="Remover Jogador?"
          confirmButtonText="Confirmar Remoção"
          isConfirmDestructive={true}
        />
      )}
    </div>
  );
};



export default PlayerManagementModal;