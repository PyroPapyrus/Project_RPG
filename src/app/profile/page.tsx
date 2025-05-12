// src/app/profile/page.tsx

'use client'; // Esta é uma página cliente

import { useState, useEffect } from 'react';
import { useSessionContext } from '@supabase/auth-helpers-react'; // Para acessar a sessão e o cliente Supabase
import { Button } from '@/components/ui/button'; // Exemplo de importação de UI
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify'; // Para notificações

// Importe a interface UserProfile se você a tiver definido em outro lugar,
// caso contrário, podemos defini-la aqui. Vamos definir uma simples por enquanto.
interface UserProfile {
  id: string;
  username: string | null;
  // Adicione outros campos do perfil público se tiver (ex: avatar_url)
}


// Componente da página de perfil
export default function ProfilePage() {
  // Obtém a instância do cliente Supabase e a sessão do usuário
  const { supabaseClient, session, isLoading: isLoadingSession } = useSessionContext();
  const user = session?.user; // O objeto user contém informações básicas como email
  const userId = user?.id; // O ID único do usuário autenticado

  // --- ESTADOS ---
  // Estado para armazenar os dados do perfil público (ex: username) buscado inicialmente
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // Estado para controlar o carregamento dos dados do perfil inicial
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  // Estado para o username ATUAL exibido/salvo
  const [username, setUsername] = useState('');

  // --- NOVOS ESTADOS PARA A EDIÇÃO DE USERNAME ---
  const [isEditingUsername, setIsEditingUsername] = useState(false); // Controla o modo de edição do username
  const [editedUsername, setEditedUsername] = useState(''); // Armazena o valor no campo de input DURANTE a edição
  const [isSavingUsername, setIsSavingUsername] = useState(false); // Controla o estado de salvamento do username
  // --- FIM NOVOS ESTADOS ---


  // --- EFEITO: Buscar dados do perfil público ---
  // Este efeito roda quando o componente monta ou quando o userId muda.
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);

      // Busca os dados do usuário na sua tabela pública 'users'
      const { data, error } = await supabaseClient
        .from('users') // Sua tabela pública com perfis de usuário
        .select('id, username') // Seleciona os campos que você precisa
        .eq('id', userId) // Filtra pelo ID do usuário logado
        .single(); // Espera um único resultado

      if (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        toast.error('Erro ao carregar dados do perfil.');
        setUserProfile(null);
        setUsername(''); // Garante que o username inicial é vazio em caso de erro
      } else if (data) {
        setUserProfile(data);
        setUsername(data.username || ''); // Inicializa o estado do username ATUAL com o valor buscado
      }

      setIsLoadingProfile(false);
    };

    if (!isLoadingSession) {
       fetchUserProfile();
    }

  }, [userId, supabaseClient, isLoadingSession]); // Dependências


  // --- HANDLER: Salvar Username ---
  const handleSaveUsername = async () => {
      // Não faz nada se não houver userId, se o username não mudou, ou se já está salvando
      if (!userId || editedUsername === username || isSavingUsername) {
          setIsEditingUsername(false); // Sai do modo de edição se não houver mudança ou erro
          return;
      }

      // Validação simples: username não pode ser vazio
      if (!editedUsername.trim()) {
          toast.error('O username não pode ser vazio.');
          return;
      }

      setIsSavingUsername(true); // Ativa o estado de salvamento

      // Atualiza o username na sua tabela pública 'users'
      // A RLS deve permitir que o usuário autenticado atualize sua própria linha (auth.uid() = id)
      const { error } = await supabaseClient
          .from('users') // Sua tabela pública com perfis de usuário
          .update({ username: editedUsername.trim() }) // Remove espaços em branco antes de salvar
          .eq('id', userId); // Garante que atualiza a linha correta

      setIsSavingUsername(false); // Desativa o estado de salvamento

      if (error) {
          console.error("Erro ao atualizar username:", error);
          toast.error(`Erro ao atualizar username: ${error.message}`); // Mostra mensagem de erro do Supabase
      } else {
          toast.success('Username atualizado com sucesso!');
          setUsername(editedUsername.trim()); // Atualiza o estado do username ATUAL com o novo valor
          setIsEditingUsername(false); // Sai do modo de edição
      }
  };

  // --- HANDLER: Cancelar Edição de Username ---
  const handleCancelUsername = () => {
      // Descarta as mudanças no campo de edição e sai do modo de edição
      setEditedUsername(username); // Restaura o valor do campo para o username atual
      setIsEditingUsername(false);
  };


  // --- Renderização Condicional: Mostra loading inicial ---
  if (isLoadingSession || isLoadingProfile) {
    return <div className="p-8 text-center">Carregando perfil...</div>;
  }

  // --- Renderização Condicional: Mensagem se o usuário não estiver logado ---
  if (!user) {
     return <div className="p-8 text-center">Você precisa estar logado para ver esta página.</div>;
  }

  // --- RENDERIZAÇÃO PRINCIPAL: Exibe os dados do perfil ---
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

      {/* Seção de Informações de Acesso (Email - não editável diretamente aqui por enquanto) */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Informações de Acesso</h2>
        <div className="flex flex-col space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email:</label>
            {/* O email vem do objeto user da sessão */}
            <p className="mt-1 text-gray-900">{user.email}</p>
            {/* A funcionalidade de mudar email/senha virá aqui depois */}
            {/* Exemplo: <Button variant="link" className="p-0 h-auto text-sm">Mudar Email</Button> */}
            {/* Exemplo: <Button variant="link" className="p-0 h-auto text-sm">Mudar Senha</Button> */}
          </div>
        </div>
      </div>

      {/* Seção de Detalhes do Perfil (Username) */}
      <div className="border-t pt-6">
         <h2 className="text-lg font-semibold mb-2">Detalhes do Perfil</h2>
         {userProfile ? (
            // Exibe o username e a opção de editar se os dados do perfil foram buscados com sucesso
            <div className="flex flex-col space-y-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username:</label>

                    {/* --- Lógica Condicional: Exibe o campo de input OU o texto --- */}
                    {isEditingUsername ? (
                        // MODO EDIÇÃO DO USERNAME
                        <div className="flex items-center space-x-2 mt-1">
                            <Input
                                className="flex-grow" // Permite que o input cresça
                                value={editedUsername} // Controlado pelo estado editedUsername
                                onChange={(e) => setEditedUsername(e.target.value)} // Atualiza o estado ao digitar
                                disabled={isSavingUsername} // Desabilita enquanto salva
                            />
                            {/* Botões Salvar e Cancelar Edição de Username */}
                            <Button onClick={handleSaveUsername} disabled={isSavingUsername}>
                                {isSavingUsername ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button variant="outline" onClick={handleCancelUsername} disabled={isSavingUsername}>
                                Cancelar
                            </Button>
                        </div>
                    ) : (
                        // MODO VISUALIZAÇÃO DO USERNAME
                        <div className="flex items-center space-x-2 mt-1">
                            {/* Exibe o username ATUAL */}
                            <p className="text-gray-900">{username || 'Nenhum username definido'}</p>
                            {/* Botão para Iniciar Edição (visível apenas quando não está editando) */}
                            <Button
                                variant="default"
                                className="p-0 h-auto text-sm"
                                onClick={() => {
                                    setIsEditingUsername(true); // Ativa o modo de edição
                                    setEditedUsername(username); // Inicializa o campo de edição com o username atual
                                }}
                            >
                                Editar
                            </Button>
                        </div>
                    )}
                    {/* --- Fim Lógica Condicional --- */}

                </div>
                {/* Outros campos do perfil público (ex: avatar) virão aqui */}
            </div>
         ) : (
            // Mensagem se os dados do perfil público não puderam ser carregados
             <p className="text-red-600">Não foi possível carregar os detalhes do perfil.</p>
         )}
      </div>

      {/* As seções para mudar email e senha virão abaixo */}

    </div>
  );
}