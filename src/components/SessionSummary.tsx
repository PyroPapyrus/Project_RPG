// src/components/session/SessionSummary.tsx

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

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
    <div className="mt-[20px]">
      <div className='bg-black px-5 py-2 flex items-center justify-between'>
        <h3 className="text-xl font-bold text-white">Relatório da Sessão</h3>
        {/* Botão "Editar Resumo" - Renderizado APENAS se o usuário for o mestre */}
        {isMaster && (
          <Button
            size='md'
            className="text-yellow-500 bg-black hover:bg-yellow-500 hover:text-yellow-700"
            onClick={() => { // <-- MODIFICAR AQUI PARA SALVAR O ORIGINAL
              setIsEditing(true); // Ativa o modo de edição
              setOriginalSummary(summary); // SALVA O TEXTO ATUAL COMO ORIGINAL
              
            }}
            disabled={isEditing} // Desabilita o botão se já estiver editando
          >
            <Pencil className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Renderização condicional: Modo de Edição (apenas para Mestre) ou Modo de Visualização */}
      {isEditing && isMaster ? ( // Entra no modo de edição apenas se isEditing for true E for o mestre
        // --- MODO EDIÇÃO ---
        <div>
          <textarea
            className="w-full px-5 py-2 rounded-b-lg bg-gray-200"
            placeholder='Escreva aqui o resumo da sessão. O resumo é opcional, mas recomenda-se que, após a sessão, você escreva um resumo neste campo.'
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            readOnly={!isMaster} // Torna o campo somente leitura se não for mestre
          />
          {/* Botões de Salvar/Cancelar visíveis apenas no modo de edição E para o mestre */}
          <div className="flex justify-end  space-x-2">
            {/* Botão Salvar */}
            <Button 
              className='w-full'
              onClick={handleSave}
            >
              Salvar
            </Button>
            {/* Botão Cancelar */}
            <Button
              variant="outline"
              className='w-full bg-white/0 hover:bg-white/20 text-white'
              onClick={handleCancel} // <-- CHAMAR O NOVO HANDLER CANCELAR
            >
              Cancelar
            </Button>
          </div>

        </div>
        ) : ( // <-- MODO VISUALIZAÇÃO
        <div className='bg-gray-200 px-5 py-2 rounded-b-lg w-full'>
          
          {summary == '' ? (
            <p className='text-gray-400 h-[120px]'>Escreva aqui o resumo da sessão. O resumo é opcional, mas recomenda-se que, após a sessão, você escreva um resumo neste campo.</p>
          ) : (
            
            <p className="text-black whitespace-pre-line break-words">{summary}</p>
          )}
        </div>
      )}
    </div>
  );
}