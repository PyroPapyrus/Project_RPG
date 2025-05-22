// src/components/modals/EditSessionModal.tsx

'use client'

import { useState, FormEvent, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session } from '@/types/session'; // Importa nosso tipo Session

// Componentes reutilizados do seu projeto
import { Button } from '@/components/ui/button'; // Seu botão padrão
import { FormInput } from '@/components/FormInput'; // Seu input de formulário
import { SubmitButton } from '@/components/SubmitButton'; // Seu botão de submit com loading
import { ErrorPopup } from '@/components/ErrorPopup'; // Seu popup de erro
import { CloseModalButton } from '../ui/close-modal-button';

// Interface de Props para este componente Modal de Edição
interface EditSessionModalProps {
  isOpen: boolean;                          // Controla se o modal está visível
  onClose: () => void;                      // Função para fechar o modal (chamada pelo botão Cancelar ou após sucesso/erro)
  session: Session | null;                // A sessão a ser editada (será null quando fechado)
  onSessionUpdated: (updatedSession: Session) => void; // Callback após atualizar a sessão com sucesso
}

// Interface para o estado do formulário interno (similar ao Create, mas populado)
interface EditSessionFormData {
  name: string;
  goal: string;
  session_date: string; // Input type="datetime-local" trabalha bem com string YYYY-MM-DDTHH:mm
}

export default function EditSessionModal({
  isOpen,
  onClose,
  session, // Recebe a sessão para editar
  onSessionUpdated
}: EditSessionModalProps) {

  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState<EditSessionFormData>({
    name: '',
    goal: '',
    session_date: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Efeito para popular o formulário quando a prop 'session' mudar (ou quando o modal abrir)
  useEffect(() => {
    if (session) {

      let formattedDate = '';
      if (session.session_date) { // Verifica se a data da sessão existe
        const dateObj = new Date(session.session_date);
        // Garante que a data é válida antes de formatar
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const day = dateObj.getDate().toString().padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`; // Formato YYYY-MM-DD para input type="date"
        }
      }

      setFormData({
        name: session.name,
        goal: session.goal,
        session_date: formattedDate // Define a data formatada no estado
      });
      setError(null); // Limpa erros anteriores ao abrir para editar
    } else {
        // Se o modal estiver fechando (session se torna null), resetar o form
         setFormData({ name: '', goal: '', session_date: '' });
         setError(null);
         setLoading(false);
    }
  }, [session]); // Dependência: session prop

  // Lida com o envio do formulário (Atualização)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!session) { // Garante que há uma sessão para editar
        setError("Nenhuma sessão selecionada para editar.");
        return;
    }

    // Validação básica (mesma do criar)
    if (!formData.name) {
      setError("Não é possível deixar o campo nome vazio.");
      return;
    }

    setError(null);
    setLoading(true);

    try {

      let isoDateString: string | null = null;
      if (formData.session_date) { // Se a data foi fornecida no input
        const dateObject = new Date(`${formData.session_date}T00:00:00`); // Adiciona T00:00:00 para tratar como início do dia local
        if (isNaN(dateObject.getTime())) {
            throw new Error("Formato de data inválido.");
        }
        isoDateString = dateObject.toISOString(); // Converte para ISO (UTC)
      }

      // Se goal for string vazia, enviará null para o banco.
      const finalGoal = formData.goal || null;



      // --- LÓGICA DE ATUALIZAÇÃO ---
      const { data, error: updateError } = await supabase
        .from('sessions')
        .update({ // Use .update() em vez de .insert()
          name: formData.name,
          goal: finalGoal,
          session_date: isoDateString, // Data convertida
          // Outros campos da sessão que podem ser editados seriam adicionados aqui
        })
        .eq('id', session.id) // Condição: Atualizar APENAS a sessão com o ID correto
        .select() // Pede para retornar o registro ATUALIZADO
        .single(); // Espera que apenas um registro seja retornado (o que foi atualizado)

      if (updateError) {
        console.error("Supabase Update Error:", updateError);
        throw new Error(updateError.message || "Erro ao atualizar no banco de dados.");
      }

       if (!data) {
          throw new Error("Não foi possível obter os dados da sessão atualizada.");
       }

      // Sucesso!
      onSessionUpdated(data as Session); // Chama o callback passando a sessão ATUALIZADA
      // O callback na página pai fechará o modal

    } catch (err: any) {
      console.error("Erro ao editar sessão:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false); // Garante que o loading termine
    }
  };

  // Se não estiver aberto OU NÃO TIVER SESSÃO para editar, não renderiza nada
  if (!isOpen || !session) {
    return null;
  }

  // Renderização do Modal (similar ao Create)
  return (
    // Fundo escuro fixo com z-index alto
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      {/* Container do Modal */}
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
        {/* Cabeçalho do Modal */}
        <div className='flex justify-between pb-2 mb-2 border-b-2'>
          <h2 className="text-2xl font-bold">Editar Sessão</h2>
          <CloseModalButton onClose={onClose} />
        </div>

        {/* Popup de Erro */}
        {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Campo Nome */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nome da Sessão
            </label>
            <FormInput
              id="edit_session_name" // ID único para este modal
              name="name" // Usar 'name' para corresponder ao estado
              type="text"
              placeholder="Ex: O Ataque dos Goblins"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={100}
              style={{ border: '1px solid #ccc', borderRadius: '0px' }}
            />
          </div>
          <p className="-mt-2 text-xs text-gray-500">
            {formData.name.length}/100 caracteres
          </p>

          {/* Campo Descrição */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Resumo Objetivo (Opcional)
            </label>
            <FormInput
              id="edit_session_goal" // ID único 
              name="goal" // Usar 'goal'
              type="textarea"
              placeholder="Faça um resumo objetivo do que você pretende atingir nesta sessão. O que se espera que aconteça? (Ex: Os aventureiros se encontram no vilarejo de Ritamor. Sua missão é encontrar o que está fazendo as pessoas desaparecerem)"
              value={formData.goal}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, goal: e.target.value })}
              rows={4}
              maxLength={500}
              style={{ border: '1px solid #ccc', borderRadius: '0px' }}
            />
          </div>
          <p className="-mt-4 text-xs text-gray-500">
            {(formData.goal || "").length}/300 caracteres
          </p>

          {/* Campo Data e Hora */}
          <div className="space-y-2">
            <label htmlFor="edit_session_date" className="block text-sm font-medium text-gray-700">
              Data da Sessão (Opcional)
            </label>
            <FormInput
              id="edit_session_date" // ID único
              name="session_date" // Usar 'session_date'
              type="date"
              placeholder=""
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              style={{ border: '1px solid #ccc', borderRadius: '0px' }}
            />
          </div>

          {/* Botões de Ação */}
          <div className="mt-2 space-y-1">
            
            {/* Botão Salvar */}
            <SubmitButton
              loading={loading}
              loadingText="Salvando..." // Texto diferente para salvar
              buttonText="Salvar Alterações" // Texto diferente
              // Outras props
            />

            {/* Botão Cancelar */}
            <Button
              type="button"
              variant="outline"
              onClick={onClose} // Chama onClose das props
              disabled={loading}
              className='w-full py-5 text-lg'
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}