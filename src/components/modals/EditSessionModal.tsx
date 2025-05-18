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
      // Ao editar, os dados vêm do Supabase como ISO string (e pode incluir milissegundos e Z)
      // O input type="datetime-local" espera o formato YYYY-MM-DDTHH:mm
      // Precisamos converter a ISO string do Supabase para o formato local necessário pelo input
      const dateObj = new Date(session.session_date);
      // Formata a data para YYYY-MM-DD
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Meses são 0-indexed
      const day = dateObj.getDate().toString().padStart(2, '0');
      const datePart = `${year}-${month}-${day}`;

      // Formata a hora para HH:mm
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const timePart = `${hours}:${minutes}`;

      const formattedDateTimeLocal = `${datePart}T${timePart}`;


      setFormData({
        name: session.name,
        goal: session.goal,
        session_date: formattedDateTimeLocal // Define a data formatada no estado
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
    if (!formData.name || !formData.goal || !formData.session_date) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Converte a data/hora local do input (YYYY-MM-DDTHH:mm) de volta para ISO String UTC para o Supabase
      const dateObject = new Date(formData.session_date);
       // Nota: Date() com YYYY-MM-DDTHH:mm é interpretado como local, mas toISOString() converte para UTC.
       // Supabase armazena timestamp with time zone. Se você quer que a hora salva reflita a hora local do usuário,
       // pode precisar de lógica mais avançada ou salvar a timezone junto.
       // Para simplicidade, usaremos a conversão direta para ISO, o que é comum.
      if (isNaN(dateObject.getTime())) {
         throw new Error("Formato de data inválido.");
      }
      const isoDateString = dateObject.toISOString();


      // --- LÓGICA DE ATUALIZAÇÃO ---
      const { data, error: updateError } = await supabase
        .from('sessions')
        .update({ // Use .update() em vez de .insert()
          name: formData.name,
          goal: formData.goal,
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      {/* Container do Modal */}
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl transform transition-all duration-300 ease-in-out scale-100">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center mb-4">
          {/* Título do Modal */}
          <h2 className="text-2xl font-bold text-gray-800">Editar Sessão</h2>
          {/* Botão de Fechar */}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"> {/* Usa onClose das props */}
            {/* Ícone 'X' */}
            ✕
          </Button>
        </div>

        {/* Popup de Erro */}
        {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Campo Nome */}
          <div className="space-y-1">
            <label htmlFor="edit_session_name" className="block text-sm font-medium text-gray-700">
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
            />
          </div>

          {/* Campo Descrição */}
          <div className="space-y-1">
            <label htmlFor="edit_session_goal" className="block text-sm font-medium text-gray-700">
              Resumo Objetivo
            </label>
            <FormInput
              id="edit_session_goal" // ID único 
              name="goal" // Usar 'goal'
              type="textarea"
              placeholder="Faça um resumo objetivo do que você pretende atingir nesta sessão. O que se espera que aconteça? (Os aventureiros se encontram no vilarejo de Ritamor. Sua missão é encontrar o que está fazendo as pessoas desaparecerem)"
              value={formData.goal}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, goal: e.target.value })}
              required
              rows={4}
            />
          </div>

          {/* Campo Data e Hora */}
          <div className="space-y-1">
            <label htmlFor="edit_session_date" className="block text-sm font-medium text-gray-700">
              Data da Sessão
            </label>
            <FormInput
              id="edit_session_date" // ID único
              name="session_date" // Usar 'session_date'
              type="datetime-local"
              placeholder=""
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              required
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-4">
            {/* Botão Cancelar */}
            <Button
              type="button"
              variant="outline"
              onClick={onClose} // Chama onClose das props
              disabled={loading}
            >
              Cancelar
            </Button>
            {/* Botão Salvar */}
            <SubmitButton
              loading={loading}
              loadingText="Salvando..." // Texto diferente para salvar
              buttonText="Salvar Alterações" // Texto diferente
              // Outras props
            />
          </div>
        </form>
      </div>
    </div>
  );
}