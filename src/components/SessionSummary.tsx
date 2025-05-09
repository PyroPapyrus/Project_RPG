// src/components/session/SessionSummary.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SessionSummaryProps {
  initialSummary: string;
  onSave: (newSummary: string) => void;
  isMaster: boolean;
}

export default function SessionSummary({ initialSummary, onSave, isMaster }: SessionSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState(initialSummary);
  // --- NOVO ESTADO: Armazena o resumo original ao iniciar a edição ---
  const [originalSummary, setOriginalSummary] = useState(initialSummary);
  // --- FIM NOVO ESTADO ---


  // Sincronizar o estado 'summary' e 'originalSummary' se 'initialSummary' mudar externamente
  // Isso garante que, ao carregar a sessão ou atualizar o resumo por fora,
  // o estado interno reflita o valor correto.
  useEffect(() => {
    setSummary(initialSummary);
    setOriginalSummary(initialSummary); // Sincroniza o original também
  }, [initialSummary]);


  const handleSave = () => {
    if (isMaster && isEditing) {
      onSave(summary);
      setIsEditing(false);
      // --- ATUALIZAR originalSummary APÓS SALVAR ---
      // Se o salvamento for bem-sucedido na página pai, a prop initialSummary
      // deve ser atualizada, o que disparará o useEffect acima e atualizará
      // originalSummary automaticamente. Então, não precisamos fazer nada aqui.
      // setOriginalSummary(summary); // Esta linha não é necessária se a prop initialSummary for atualizada corretamente após save.
    }
  };

  // --- HANDLER: Cancelar Edição ---
  const handleCancel = () => {
    setSummary(originalSummary); // Restaura o texto para o valor original
    setIsEditing(false); // Sai do modo de edição
  };
  // --- FIM HANDLER CANCELAR ---


  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Resumo da Sessão</h3>

      {/* Renderização condicional: Modo de Edição (apenas para Mestre) ou Modo de Visualização */}
      {isEditing && isMaster ? ( // Entra no modo de edição apenas se isEditing for true E for o mestre
        // --- MODO EDIÇÃO ---
        <div>
          <textarea
            className="w-full border border-gray-300 rounded p-2"
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            readOnly={!isMaster} // Torna o campo somente leitura se não for mestre
          />
          {/* Botões de Salvar/Cancelar visíveis apenas no modo de edição E para o mestre */}
          <div className="mt-2 flex space-x-2">
            {/* Botão Salvar */}
            <Button onClick={handleSave}>
              Salvar
            </Button>
            {/* Botão Cancelar */}
            <Button
              variant="outline"
              onClick={handleCancel} // <-- CHAMAR O NOVO HANDLER CANCELAR
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : ( // <-- MODO VISUALIZAÇÃO
        <div>
          {/* Exibe o resumo */}
          <p className="text-gray-700 whitespace-pre-line">{summary || 'Nenhum resumo disponível.'}</p>
          {/* Botão "Editar Resumo" - Renderizado APENAS se o usuário for o mestre */}
          {isMaster && (
            <Button
              variant="default"
              className="mt-2 text-sm p-0 h-auto"
              onClick={() => { // <-- MODIFICAR AQUI PARA SALVAR O ORIGINAL
                setIsEditing(true); // Ativa o modo de edição
                setOriginalSummary(summary); // SALVA O TEXTO ATUAL COMO ORIGINAL
              }}
            >
              Editar Resumo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}