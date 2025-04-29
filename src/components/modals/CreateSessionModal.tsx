// src/components/modals/CreateSessionModal.tsx

'use client'

import { useState, FormEvent, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session } from '@/types/session'; // Importa nosso tipo

// Componentes reutilizados do seu projeto
import { Button } from '@/components/ui/button'; // Seu botão padrão
import { FormInput } from '@/components/FormInput'; // Seu input de formulário
import { SubmitButton } from '@/components/SubmitButton'; // Seu botão de submit com loading
import { ErrorPopup } from '@/components/ErrorPopup'; // Seu popup de erro

// Interface de Props para este componente Modal
interface CreateSessionModalProps {
  isOpen: boolean;                       // Controla se o modal está visível
  onClose: () => void;                   // Função para fechar o modal (chamada pelo botão Cancelar ou após sucesso)
  campaignId: string;                  // ID da campanha onde a sessão será criada
  onSessionCreated: (newSession: Session) => void; // Callback após criar a sessão com sucesso
}

// Interface para o estado do formulário interno
interface CreateSessionFormData {
  name: string;
  goal: string;
  session_date: string; // Input type="datetime-local" trabalha bem com string YYYY-MM-DDTHH:mm
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  campaignId,
  onSessionCreated
}: CreateSessionModalProps) {

  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState<CreateSessionFormData>({
    name: '',
    goal: '',
    session_date: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Função para resetar o formulário e o erro
  const resetFormAndClose = () => {
    setFormData({ name: '', goal: '', session_date: '' });
    setError(null);
    setLoading(false); // Garante que o loading seja resetado
    onClose(); // Chama a função passada por props para fechar
  };

  // Efeito para resetar o form se o modal for fechado externamente (opcional, mas bom ter)
  useEffect(() => {
    if (!isOpen) {
      // Pequeno delay para não limpar enquanto a animação de fechar ocorre (se houver)
      const timer = setTimeout(() => {
         setFormData({ name: '', goal: '', session_date: '' });
         setError(null);
         setLoading(false);
      }, 300); // Ajuste o tempo se necessário
      return () => clearTimeout(timer);
    }
  }, [isOpen]);


  // Lida com o envio do formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Validação básica
    if (!formData.name || !formData.goal || !formData.session_date) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Converte a data/hora local do input para ISO String UTC para o Supabase
      const dateObject = new Date(formData.session_date);
      if (isNaN(dateObject.getTime())) {
        throw new Error("Formato de data inválido.");
      }
      const isoDateString = dateObject.toISOString();

      // Insere na tabela 'sessions'
      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert([
          {
            campaign_id: campaignId,     // ID da campanha vindo das props
            name: formData.name,
            goal: formData.goal,
            session_date: isoDateString, // Data convertida
          }
        ])
        .select() // Pede para retornar o registro que foi criado
        .single(); // Espera que apenas um registro seja retornado

      if (insertError) {
        // Trata erros específicos do Supabase se necessário
        console.error("Supabase Error:", insertError);
        throw new Error(insertError.message || "Erro ao salvar no banco de dados.");
      }

      if (!data) {
        throw new Error("Não foi possível obter os dados da sessão criada.");
      }

      // Sucesso!
      onSessionCreated(data as Session); // Chama o callback passando a nova sessão
      resetFormAndClose(); // Fecha o modal e limpa o formulário

    } catch (err: any) {
      console.error("Erro ao criar sessão:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false); // Garante que o loading termine
    }
  };

  // Se não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  // Renderização do Modal (baseada na estrutura do seu CreateCampaignButton)
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl transform transition-all duration-300 ease-in-out scale-100">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Criar Nova Sessão</h2>
            {/* Botão de Fechar (opcional, mas recomendado) */}
            <Button variant="ghost" size="sm" onClick={resetFormAndClose} aria-label="Fechar">
                {/* Pode usar um ícone 'X' aqui */}
                ✕
            </Button>
        </div>

        {/* Popup de Erro (reutilizado) */}
        {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Campo Nome */}
        <div className="space-y-1"> {/* Agrupa label e input */}
            <label htmlFor="session_name" className="block text-sm font-medium text-gray-700">
            Nome da Sessão
            </label>
            <FormInput
            id="session_name" // ID para o htmlFor do label funcionar
            name="session_name"
            type="text"
            placeholder="Ex: O Ataque dos Goblins"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            maxLength={100}
            // label="Nome da Sessão" <-- REMOVIDO
            />
        </div>

        {/* Campo Descrição */}
        <div className="space-y-1"> {/* Agrupa label e input */}
            <label htmlFor="session_goal" className="block text-sm font-medium text-gray-700">
            Descrição / Objetivos
            </label>
            <FormInput
            id="session_goal" // ID para o htmlFor
            name="session_goal"
            type="textarea"
            placeholder="O que se espera que aconteça nesta sessão?"
            value={formData.goal}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, goal: e.target.value })}
            required
            rows={4}
            // label="Descrição / Objetivos" <-- REMOVIDO
            />
            {/* Você pode adicionar um contador de caracteres aqui se quiser, como no CreateCampaignButton */}
        </div>

        {/* Campo Data e Hora */}
        <div className="space-y-1"> {/* Agrupa label e input */}
                <label htmlFor="session_date" className="block text-sm font-medium text-gray-700">
                Data e Hora da Sessão
                </label>
                <FormInput
                id="session_date" // ID para o htmlFor
                name="session_date"
                type="datetime-local"
                placeholder="" // <--- ADICIONADO placeholder obrigatório (string vazia)
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                required
                />
            </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button" // Importante ser 'button' para não submeter o form
              variant="outline" // Use a variante apropriada do seu Button
              onClick={resetFormAndClose} // Chama a função de fechar/resetar
              disabled={loading} // Desabilita enquanto carrega
            >
              Cancelar
            </Button>
            <SubmitButton
              loading={loading} // Passa o estado de loading
              loadingText="Criando..." // Texto durante o loading
              buttonText="Criar Sessão" // Texto normal
              // Outras props que seu SubmitButton possa precisar
            />
          </div>
        </form>
      </div>
    </div>
  );
}