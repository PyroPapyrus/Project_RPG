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
import { CloseModalButton } from '../ui/close-modal-button';

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
  session_date: string;
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
    if (!formData.name) {
      setError("A sessão precisa ter ao menos o nome para ser criada.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Converte a data/hora local do input para ISO String UTC para o Supabase
      let finalSessionDate: string;
      if (formData.session_date) {
        // Se a data foi fornecida, processa como antes
        const dateObject = new Date(`${formData.session_date}T00:00:00`);
        if (isNaN(dateObject.getTime())) {
          throw new Error("Formato de data inválido.");
        }
        finalSessionDate = dateObject.toISOString();
      } else {
        // Se a data não foi fornecida, usa a data e hora atual
        finalSessionDate = new Date().toISOString();
      }



      // Insere na tabela 'sessions'
      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert([
          {
            campaign_id: campaignId,     // ID da campanha vindo das props
            name: formData.name,
            goal: formData.goal || null,
            session_date: finalSessionDate, // Data convertida
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


      onSessionCreated(data as Session); // Chama o callback passando a nova sessão
      resetFormAndClose(); // Fecha o modal e limpa o formulário

    } catch (err: any) {
      console.error("Erro ao criar sessão:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) {
    return null;
  }


  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
        {/* Cabeçalho do Modal */}
        <div className='flex justify-between pb-2 mb-2 border-b-2'>
          <h2 className="text-2xl font-bold">Criar Nova Sessão</h2>
          <CloseModalButton onClose={onClose} />
        </div>

        {/* Popup de Erro (reutilizado) */}
        {error && <ErrorPopup message={error} onClose={() => setError(null)} />}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="space-y-2"> {/* Agrupa label e input */}
            {/* Campo Nome */}
            <label className="block text-sm font-medium text-gray-700">
              Nome da Sessão
            </label>
            <FormInput
              id="session_name" // ID para o htmlFor do label funcionar
              name="session_name"
              type="text"
              placeholder="Ex: O Ataque dos Goblins"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              style={{ border: '1px solid #ccc', borderRadius: '0px' }}
            />
          </div>
          <p className="-mt-2 text-xs text-gray-500">
            {formData.name.length}/100 caracteres
          </p>
          
          <div className="space-y-2"> {/* Agrupa label e input */}
            {/* Campo Descrição */}
            <label className="block text-sm font-medium text-gray-700">
              Resumo Objetivo (Opcional)
            </label>
            <FormInput
              id="session_goal"
              name="session_goal"
              type="textarea"
              placeholder="Faça um resumo objetivo do que você atingiu nesta sessão. O resumo objetivo é opcional desde sua criação, mas recomenda-se que, após a sessão, você escreva um resumo neste campo."
              value={formData.goal}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, goal: e.target.value })}
              rows={4}
              maxLength={300}
              style={{ border: '1px solid #ccc', borderRadius: '0px' }}
            />
          </div>
          <p className="-mt-4 text-xs text-gray-500">
            {(formData.goal || "").length}/300 caracteres
          </p>
      

          {/* Campo Data e Hora */}
          <div className="space-y-2">
            <label htmlFor="session_date" className="block text-sm font-medium text-gray-700">
              Data da Sessão (Opcional)
            </label>
            <FormInput
              id="session_date" 
              name="session_date"
              type="date"
              placeholder=""
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              style={{ border: '1px solid #ccc', borderRadius: '0px' }}
            />
          </div>

          {/* Botões de Ação */}
          <div className="mt-2 space-y-1">
            <SubmitButton
              loading={loading} // Passa o estado de loading
              loadingText="Criando..." // Texto durante o loading
              buttonText="Criar Sessão" // Texto normal
              disabled={loading} // Desabilita enquanto carrega
              // Outras props que seu SubmitButton possa precisar
            />

            <Button
              type="button" // Importante ser 'button' para não submeter o form
              variant="outline" // Use a variante apropriada do seu Button
              onClick={resetFormAndClose} // Chama a função de fechar/resetar
              disabled={loading} // Desabilita enquanto carrega
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