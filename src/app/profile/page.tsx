// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import Link from 'next/link'; // Importar Link para o logo (se ele levar para a home)
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { Label } from '@/components/ui/label';
import Image from 'next/image'; // Importar Image para o background
import { BackButton } from '@/components/ui/back-button'; // Importar BackButton

// --- IMPORTAR O COMPONENTE PasswordRequirements ---
import { PasswordRequirements } from '@/components/PasswordRequirements'; // Ajuste o caminho se necessário
import { ArrowLeft } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
// --- FIM IMPORTAÇÃO ---

interface UserProfile {
  id: string;
  username: string | null;
  // outros campos...
}

export default function ProfilePage() {
  const { supabaseClient, session, isLoading: isLoadingSession } = useSessionContext();
  const user = session?.user;
  const userId = user?.id;

  // --- ESTADOS GERAIS E USERNAME ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  // --- FIM ESTADOS GERAIS E USERNAME ---

  // --- ESTADOS PARA EDIÇÃO DE EMAIL ---
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  // --- FIM ESTADOS EMAIL ---

 // --- ESTADOS PARA ALTERAÇÃO DE SENHA ---
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // --- FIM NOVOS ESTADOS SENHA ---

  const router = useRouter();

  // --- EFEITO: Buscar dados do perfil público ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);

      const { data, error } = await supabaseClient
        .from('users')
        .select('id, username')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        toast.error('Erro ao carregar dados do perfil.');
        setUserProfile(null);
        setUsername('');
      } else if (data) {
        setUserProfile(data);
        setUsername(data.username || '');
      }

      setIsLoadingProfile(false);
    } 

    if (!isLoadingSession) {
       fetchUserProfile();
       if (user?.email) {
           setEditedEmail(user.email);
       } else {
           setEditedEmail('');
       }
    }

  }, [userId, supabaseClient, isLoadingSession, user?.email]);


  // --- HANDLER: Salvar Username ---
  const handleSaveUsername = async () => {
      if (!userId || editedUsername.trim() === username || isSavingUsername) {
           if (editedUsername.trim() === username || !editedUsername.trim()) {
                setIsEditingUsername(false);
           }
          return;
      }

      if (!editedUsername.trim()) {
          toast.error('O username não pode ser vazio.');
          return;
      }

      setIsSavingUsername(true);

      const { error } = await supabaseClient
          .from('users')
          .update({ username: editedUsername.trim() })
          .eq('id', userId);

      setIsSavingUsername(false);

      if (error) {
          console.error("Erro ao atualizar username:", error);
          toast.error(`Erro ao atualizar username: ${error.message}`);
      } else {
          toast.success('Username atualizado com sucesso!');
          setUsername(editedUsername.trim());
          setIsEditingUsername(false);
      }
  };

  // --- HANDLER: Cancelar Edição de Username ---
  const handleCancelUsername = () => {
      setEditedUsername(username);
      setIsEditingUsername(false);
  };

  // --- HANDLERS PARA EDIÇÃO DE EMAIL ---
  const handleEditEmail = () => {
      if (isEditingUsername || isChangingPassword) return;
      setIsEditingEmail(true);
      setEditedEmail(user?.email || '');
      setEmailError(null);
  };

  const handleSaveEmail = async () => {
      setEmailError(null);

      if (!userId || editedEmail === user?.email || isSavingEmail) {
          setIsEditingEmail(false);
          return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedEmail)) {
          setEmailError('Por favor, insira um email válido.');
          toast.error('Por favor, insira um email válido.');
          return;
      }

      setIsSavingEmail(true);

      const { data, error } = await supabaseClient.auth.updateUser({
          email: editedEmail
      });

      setIsSavingEmail(false);

      if (error) {
          console.error("Erro ao atualizar email:", error);
          if (error.message.includes('duplicate key') || error.message.includes('already exists') || error.message.includes('constraint') || error.status === 422) {
             const errorMessage = 'Impossível utilizar este email. Ele já está cadastrado.';
             setEmailError(errorMessage);
             toast.error(errorMessage);
          } else {
             toast.error(`Erro ao atualizar email: ${error.message}`);
             setEmailError(`Erro: ${error.message}`);
          }
      } else {
          toast.success('Email de confirmação enviado! Por favor, verifique sua caixa de entrada.');
          setIsEditingEmail(false);
          setEmailError(null);
      }
  };

  const handleCancelEmail = () => {
      setEditedEmail(user?.email || '');
      setIsEditingEmail(false);
      setEmailError(null);
  };
  // --- FIM HANDLERS EMAIL ---

  // --- HANDLERS PARA ALTERAÇÃO DE SENHA ---
  const handleTogglePasswordChange = () => {
      if (isEditingUsername || isEditingEmail) return;
      setIsChangingPassword(!isChangingPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordError(null);
  };

  const handleChangePassword = async () => {
          setPasswordError(null);

             if (!newPassword) {
                 setPasswordError('Por favor, insira a nova senha.');
                 return;
               }
               if (newPassword.length < 8) {
                 setPasswordError('A nova senha deve ter pelo menos 8 caracteres.');
                 return;
               }
               if (newPassword !== confirmNewPassword) {
                 setPasswordError('A nova senha e a confirmação não coincidem.');
                 return;
               }

          setIsSavingPassword(true);

             try {
            // --- PASSO 1: REAUTENTICAR COM A SENHA ATUAL (APENAS PARA USUÁRIOS DE EMAIL/SENHA) ---
            if (!isOAuthUser) {
                if (!currentPassword) { // Validação extra para garantir que a senha atual foi digitada
                     setPasswordError('Por favor, insira sua senha atual.');
                     setIsSavingPassword(false); // Desativa o loading
                     return;
                }
 
                // Tenta fazer login com o email do usuário e a senha atual digitada
                const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
                   email: user?.email as string, // Usa o email do usuário logado
                   password: currentPassword, // Usa a senha atual digitada no formulário
                });
 
                if (signInError) {
                   console.error("Erro na reautenticação com senha atual:", signInError);
                   // Se a reautenticação falhar, é porque a senha atual está errada
                   if (signInError.message.includes('Invalid login credentials')) {
                        setPasswordError('Senha atual incorreta.');
                        toast.error('Senha atual incorreta.');
                   } else {
                        // Para outros erros de login inesperados durante a reautenticação
                        setPasswordError(`Erro ao verificar senha atual: ${signInError.message}`);
                        toast.error(`Erro ao verificar senha atual: ${signInError.message}`);
                   }
                   setIsSavingPassword(false); // Desativa o loading
                   return; // Interrompe o processo se a senha atual for inválida
                }
 
                // Se chegou aqui, a reautenticação foi bem-sucedida.
                console.log("Reautenticação com senha atual bem-sucedida.");
 
                // Agora, verifica se a nova senha é igual à senha atual (após provar que sabe a atual)
                // Comparar a nova senha com a senha atual digitada no campo
                 if (newPassword === currentPassword) {
                     setPasswordError('A nova senha não pode ser igual à senha atual.');
                     setIsSavingPassword(false); // Desativa o loading
                     return;
                 }
 
            }
            // --- FIM PASSO 1 ---
 
 
            // --- PASSO 2: ATUALIZAR A SENHA (SÓ CHEGA AQUI SE FOR OAUTH OU SE A REAUTENTICAÇÃO FOI SUCESSO) ---
            console.log("Tentando atualizar a senha...");
            const { data: updateData, error: updateError } = await supabaseClient.auth.updateUser({
               password: newPassword
            });
 
            if (updateError) {
                console.error("Erro ao mudar senha:", updateError);
                let errorMessage = 'Erro ao mudar senha.'; // Mensagem genérica padrão
 
                if (updateError.message.includes('Password should contain at least one character of each')) {
                    errorMessage = 'A nova senha não atende aos requisitos de segurança (faltam letras, números ou caracteres especiais).';
                } else if (updateError.message.includes('Password should be at least')) {
                     errorMessage = 'A nova senha é muito curta.';
                } else {
                      errorMessage = `Erro do sistema: ${updateError.message}`; // Outros erros do update
                }
 
                setPasswordError(errorMessage);
                toast.error(errorMessage);
 
            } else {
                // Sucesso na atualização
                console.log("Senha atualizada com sucesso.");
                toast.success('Senha alterada com sucesso!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setPasswordError(null);
                setIsChangingPassword(false); // Esconde a seção
            }
             // --- FIM PASSO 2 ---
 
 
    } catch (error: any) {
      console.error("Erro inesperado no processo de mudança de senha:", error);
      setPasswordError('Ocorreu um erro inesperado ao mudar a senha.');
      toast.error('Ocorreu um erro inesperado ao mudar a senha.');
    } finally {
      setIsSavingPassword(false); // Desativa o estado de salvamento
    }
  };


  const isOAuthUser = user?.app_metadata.provider && user?.app_metadata.provider !== 'email';

// --- Renderização Condicional: Mostra loading inicial ---
if (isLoadingSession || isLoadingProfile) {
    return <div className="p-8 text-center">Carregando perfil...</div>;
  }

  // --- Renderização Condicional: Mensagem se o usuário não estiver logado ---
  if (!user) {
     return <div className="p-8 text-center">Você precisa estar logado para ver esta página.</div>;
  }

  // --- RENDERIZAÇÃO PRINCIPAL COM ESTILOS DO LOGIN ---
  return (
    // Container principal com background e altura mínima
    <div className='bg-gray-900 min-h-screen relative'> {/* Adicionado relative para posicionar a imagem */}
      {/* Imagem de background */}
      <Image
        src="/images/bg-login-cadastro.gif" // Verifique o caminho correto da sua imagem
        alt="RPG Background"
        fill // Preenche o container pai
        className="object-cover opacity-80" // Ajuste a opacidade conforme preferir
        priority // Carrega essa imagem com prioridade
      />

      {/* Cabeçalho com logo e botão voltar */}
      <header className='bg-gray-800/30 shadow-md relative flex justify-center items-center z-10'> {/* z-10 para garantir que fique acima do background */}
        <div className='absolute left-4 top-1/2 transform -translate-y-1/2'> {/* Posiciona o botão voltar */}
          {/* Botão que volta para as Campanhas (agora usando Button customizado) */}
          {/* Removi a classe 'mb-4' que não faz sentido em posicionamento absoluto e horizontal */}
          <Button variant="ghost" onClick={() => router.push('/dashboard')}> {/* Usando variant="ghost" ou "link" */}
             {/* Ajuste o nome do componente de ícone se não for ArrowLeft do lucide-react */}
             <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para as Campanhas
          </Button>
        </div>

        {/* Logo que linka para a página inicial (ajuste o href se necessário) */}
        <Link href="/">
          <img
            src="/images/logo.png" // Verifique o caminho correto da sua logo
            alt="logo Story&Plot"
            className="w-60 md:w-80 py-2" // Ajuste o tamanho conforme preferir, padding vertical para dar espaço
          />
        </Link>
      </header>

      {/* Container principal centralizado com o card de conteúdo */}
      {/* min-h-[calc(100vh-HEADER_HEIGHT)] ajusta a altura para que o card fique no centro da área restante */}
      {/* Ajuste HEADER_HEIGHT para a altura real do seu cabeçalho (ex: se header tem altura de 16 = h-16 -> 4rem) */}
      {/* A classe 'min-h-[calc(100vh-4rem)]' garante que este div ocupe o espaço vertical restante */}
      <div className="text-center relative flex justify-center items-center min-h-[calc(100vh-4rem)] px-4 py-8"> {/* Adicionado padding e px */}
        {/* Card translúcido para o conteúdo do perfil */}
        <div className="bg-gray-200/60 backdrop-blur-sm rounded-lg shadow-md p-8 w-full max-w-xl z-10"> {/* z-10 para ficar acima do background */}
          <div className='text-center mb-6'>
            <h2 className="text-3xl font-bold text-gray-800">
              Meu Perfil
            </h2>
            {/* Você pode adicionar uma descrição aqui se quiser */}
            {/* <p className='mt-2 text-gray-700'>Gerencie suas informações de usuário.</p> */}
          </div>

          {/* Conteúdo do perfil (seções de email, senha, username) */}
          {/* Usei a classe 'space-y-6' para dar espaçamento entre as seções principais */}
          <div className="space-y-6 text-left"> {/* Alinhe o texto dos labels à esquerda */}

            {/* Seção de Informações de Acesso (Email) */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Informações de Acesso</h3>
              <div className="flex flex-col space-y-2">
                <div>
                  <Label htmlFor="email">Email:</Label>
                  {isEditingEmail ? (
                    <div className="flex flex-col space-y-1 mt-1">
                      <div className="flex items-center space-x-2">
                        <Input
                          id="email"
                          className="flex-grow"
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          disabled={isSavingEmail}
                        />
                        <Button onClick={handleSaveEmail} disabled={isSavingEmail}>
                          {isSavingEmail ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button variant="outline" onClick={handleCancelEmail} disabled={isSavingEmail}>
                          Cancelar
                        </Button>
                      </div>
                      {emailError && (
                        <p className="text-red-600 text-sm">{emailError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-gray-900">{user.email}</p>
                      {!isOAuthUser && !isChangingPassword && !isEditingUsername && (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm"
                          onClick={handleEditEmail}
                        >
                          Mudar Email
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- SEÇÃO PARA MUDAR SENHA --- */}
            {!isOAuthUser && !isEditingEmail && !isEditingUsername ? (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Mudar Senha</h3>
                {isChangingPassword ? (
                  <div className="flex flex-col space-y-3 mt-1">
                    {/* Campo Senha Atual */}
                    <div>
                      <Label htmlFor="current-password">Senha Atual:</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isSavingPassword}
                        className="mt-1"
                      />
                    </div>

                    {/* Campo Nova Senha */}
                    <div>
                      <Label htmlFor="new-password">Nova Senha:</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isSavingPassword}
                        className="mt-1"
                      />
                      <div className="mt-2">
                        {/* Componente de requisitos de senha */}
                        <PasswordRequirements password={newPassword} />
                      </div>
                    </div>

                    {/* Campo Confirmar Nova Senha */}
                    <div>
                      <Label htmlFor="confirm-new-password">Confirmar Nova Senha:</Label>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        disabled={isSavingPassword}
                        className="mt-1"
                      />
                    </div>

                    {/* Mensagem de Erro Inline para Senha */}
                    {passwordError && (
                      <p className="text-red-600 text-sm">{passwordError}</p>
                    )}

                    {/* Botões Salvar e Cancelar Mudança de Senha */}
                    <div className="flex space-x-2 mt-2">
                      <Button onClick={handleChangePassword} disabled={isSavingPassword}>
                        {isSavingPassword ? 'Mudando...' : 'Mudar Senha'}
                      </Button>
                      <Button variant="outline" onClick={handleTogglePasswordChange} disabled={isSavingPassword}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // BOTÃO PARA EXIBIR FORMULÁRIO DE MUDANÇA DE SENHA
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm mt-1"
                    onClick={handleTogglePasswordChange}
                  >
                    Mudar Senha
                  </Button>
                )}
              </div>
            ) : null}
            {/* --- FIM SEÇÃO MUDAR SENHA --- */}


            {/* Seção de Detalhes do Perfil (Username) */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Detalhes do Perfil</h3>
              {userProfile ? (
                <div className="flex flex-col space-y-2">
                  <div>
                    <Label htmlFor="username">Username:</Label>
                    {isEditingUsername ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          id="username"
                          className="flex-grow"
                          value={editedUsername}
                          onChange={(e) => setEditedUsername(e.target.value)}
                          disabled={isSavingUsername}
                        />
                        <Button onClick={handleSaveUsername} disabled={isSavingUsername}>
                          {isSavingUsername ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button variant="outline" onClick={handleCancelUsername} disabled={isSavingUsername}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-gray-900">{username || 'Nenhum username definido'}</p>
                        {userProfile && !isChangingPassword && !isEditingEmail && (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm"
                            onClick={() => {
                              setIsEditingUsername(true);
                              setEditedUsername(username);
                            }}
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Outros campos do perfil público (ex: avatar) virão aqui */}
                  <LogoutButton />
                </div>
              ) : (
                <p className="text-red-600">Não foi possível carregar os detalhes do perfil.</p>
              )}
            </div>
            
            {/* Você pode adicionar outras seções aqui, como avatar, etc. */}

          </div> {/* Fim do div space-y-6 (conteúdo do card) */}

        </div> {/* Fim do card translúcido */}
      </div> {/* Fim do container principal centralizado */}
    </div> // Fim do container principal com background
  );
}