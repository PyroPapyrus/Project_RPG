// src/components/session/SessionPreparation.tsx

'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { Sparkles } from 'lucide-react';


interface SessionPreparationProps {
  sessionId: string;
  sessionName: string; // Adicionado para passar o nome da sessão
  sessionGoal: string; // Adicionado para passar o objetivo da sessão
  initialPreparation?: string;
  isMaster: boolean;
  campaignSystem: string | null;
}

export default function SessionPreparation({ 
  sessionId, 
  sessionName, 
  sessionGoal, 
  initialPreparation = '',
  isMaster,
  campaignSystem
}: SessionPreparationProps) {
  const supabase = createClientComponentClient();
  const [preparation, setPreparation] = useState(initialPreparation || '');
  const [loading, setLoading] = useState(false);
  const [savedPreparation, setSavedPreparation] = useState(initialPreparation);

    // Estados para a funcionalidade da IA
  const [showAiCommands, setShowAiCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Referência para o textarea
  const [aiLoading, setAiLoading] = useState(false); // Para indicar que a IA está gerando
  const [aiError, setAiError] = useState<string | null>(null); // Para erros da IA


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

    // --- Lógica da IA ---

  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isMaster) return; // Apenas mestres podem usar a IA

    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, value } = textarea;

    // Detectar " " + "/"
    if (e.key === '/' && selectionStart > 0 && value[selectionStart - 1] === ' ') {
      setShowAiCommands(true);
      e.preventDefault(); // Evita que o '/' seja digitado imediatamente
    } else if (showAiCommands) {
      // Esconder o menu se o usuário digitar algo diferente ou se afastar do '/'
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter') {
        setShowAiCommands(false);
      } else if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') { // Ignorar setas para navegação futura
         // Esconder se o próximo caractere não for parte de um comando
         // Lógica mais robusta para esconder o menu pode ser necessária aqui.
         // Por enquanto, esconder em qualquer caractere não-comando.
         setShowAiCommands(false);
      }
    }
  }, [isMaster, showAiCommands]);

  const handleTextareaKeyUp = useCallback(() => {
    // Esconder o menu se o cursor não estiver mais na posição correta ou se o '/' foi removido
    const textarea = textareaRef.current;
    if (textarea && showAiCommands) {
      const { selectionStart, value } = textarea;
      if (selectionStart === 0 || value[selectionStart - 1] !== ' ') { // Ou se o caracter anterior não é espaço
         setShowAiCommands(false);
      }
    }
  }, [showAiCommands]);


  const insertAiContent = (content: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;

    // Remove o " /" que ativou o comando
    const newValue = value.slice(0, selectionStart - 1) + content + value.slice(selectionEnd);
    setPreparation(newValue);
    setShowAiCommands(false); // Fecha o menu
    // Reposiciona o cursor após o conteúdo inserido
    textarea.selectionStart = selectionStart - 1 + content.length;
    textarea.selectionEnd = selectionStart - 1 + content.length;
    textarea.focus(); // Foca de volta no textarea
  };

  const handleAiCommand = async (command: string) => {
    setShowAiCommands(false); // Fecha o menu imediatamente ao selecionar um comando
    setAiLoading(true);
    setAiError(null);

    // Adicione um placeholder temporário para o usuário saber que algo está acontecendo
    insertAiContent('\nGerando sugestão da IA... Por favor, aguarde.\n');

    try {
        // Enviar requisição para a API Route (backend)
        const response = await fetch('/api/ai/generate-preparation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                command,
                sessionName,
                sessionGoal,
                currentPreparation: preparation,
                campaignSystem,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao gerar conteúdo com a IA.');
        }

        const data = await response.json();
        
        // Substituir o placeholder pela resposta da IA
        setPreparation(prev => prev.replace('\nGerando sugestão da IA... Por favor, aguarde.\n', data.aiContent || ''));
        toast.success('Conteúdo da IA gerado!');

    } catch (error: any) {
        console.error("Erro na IA:", error);
        setAiError(error.message);
        toast.error(`Erro da IA: ${error.message}`);
        // Remover o placeholder se houver erro
        setPreparation(prev => prev.replace('\nGerando sugestão da IA... Por favor, aguarde.\n', ''));
    } finally {
        setAiLoading(false);
    }
  };

  // --- Fim Lógica da IA ---


  return (
    <div className="bg-white rounded-lg shadow p-4 relative">
      <h3 className="text-lg font-semibold mb-2">Pré-Sessão</h3>
      <Textarea
        ref={textareaRef}
        value={preparation}
        onChange={(e) => setPreparation(e.target.value)}
        onKeyDown={isMaster ? handleTextareaKeyDown : undefined} // Apenas mestres usam
        onKeyUp={isMaster ? handleTextareaKeyUp : undefined} // Apenas mestres usam
        placeholder="Escreva aqui as preparações para a sessão. Caso deseje uma mãozinha, de um espaço e aperte a tecla / para ter acesso a comandos de IA." // Atualizado o placeholder
        rows={6}
        className={aiLoading ? 'opacity-70 cursor-wait' : ''} // Feedback visual quando IA está gerando
        disabled={aiLoading} // Desabilita enquanto a IA está gerando
      />

      {/* Menu de comandos da IA */}
      {showAiCommands && isMaster && (
        <div className="absolute left-4 right-4 bg-gray-700 text-white p-2 rounded-md shadow-lg z-20"
             style={{ bottom: 'calc(100% + 10px)' }}> {/* Posiciona acima do textarea */}
          <p className="text-sm text-gray-300 mb-1">Comandos de IA:</p>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleAiCommand('generate_summary')}
                className="w-full text-left px-3 py-1 rounded-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Gerar Resumo para a Preparação Sessão
              </button>
            </li>
            <li>
              <button
                onClick={() => handleAiCommand('suggest_npcs')}
                className="w-full text-left px-3 py-1 rounded-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Sugerir NPCs para a Sessão
              </button>
            </li>
            <li>
              <button
                onClick={() => handleAiCommand('suggest_plot_hooks')}
                className="w-full text-left px-3 py-1 rounded-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Sugerir Ganchos de Enredo
              </button>
            </li>
            <li>
              <button
                onClick={() => handleAiCommand('free_form_suggestion')}
                className="w-full text-left px-3 py-1 rounded-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Sugerir aprimoramento do enredo atual
              </button>
            </li>
            {/* Adicione mais comandos conforme a necessidade */}
          </ul>
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <Button onClick={handleSave} disabled={loading || !hasChanges || aiLoading}> {/* Desabilita se a IA estiver gerando */}
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
