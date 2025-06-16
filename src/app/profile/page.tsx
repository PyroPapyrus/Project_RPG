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
import { Loading } from '@/components/Loading';
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
    return <Loading />;
  }

  // --- Renderização Condicional: Mensagem se o usuário não estiver logado ---
  if (!user) {
     return (
      <div className="flex flex-col bg-gray-800 items-center justify-center min-h-screen">
        <p className='p-5 items-center text-white'>Você precisa estar logado para ver esta página.</p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Dashboard
        </Button>
      </div>
    )
  }

  // --- RENDERIZAÇÃO PRINCIPAL COM ESTILOS DO LOGIN ---
  return (
    <div className='min-h-screen bg-gray-900'>
      {/* Header */}
      <header className='bg-gray-800 shadow-md relative flex justify-center items-center z-10'>
        <div className='absolute left-4 top-1/2 transform -translate-y-1/2'> {/* Posiciona o botão voltar */}
          <BackButton href="/dashboard"/>
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

      <div className="mx-auto max-w-4xl py-5">
        <div className="h-full bg-gray-800 rounded-xl shadow-2xl">
          {/* Profile Header */}
          <div className="relative">
            {/* Banner Background */}
            <div className="h-20 bg-gradient-to-r from-cyan-500 to-blue-700"></div>
            
            {/* Profile Info Overlay */}
            <div className="absolute -bottom-16 left-8 flex items-end space-x-4">
              {/* Avatar Circle */}
              <div className="h-24 w-24 rounded-full bg-gray-700 border-4 border-gray-800 flex items-center justify-center">
                <span className="material-symbols-rounded text-4xl text-gray-400">
                  person
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-20 px-8 pb-8">
            {/* Username Section */}
            <div className="space-y-6 bg-gray-700/50 rounded-lg p-6">
              <div className="border-b border-gray-600 pb-4">
                <h3 className="text-xl font-semibold text-white mb-4">Detalhes do Perfil</h3>
                {userProfile ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Nome de usuário</Label>
                      {isEditingUsername ? (
                        <div className="flex items-center justify-between mt-1 p-3 bg-gray-800 rounded-lg gap-2">
                          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
                            <Input
                              id="username"
                              className="border-0 bg-transparent text-white"
                              value={editedUsername}
                              onChange={(e) => setEditedUsername(e.target.value)}
                              disabled={isSavingUsername}
                            />
                          </div>
                          <Button 
                            onClick={handleSaveUsername} 
                            disabled={isSavingUsername}
                            className="bg-cyan-600 hover:bg-cyan-700"
                          >
                            {isSavingUsername ? 'Salvando...' : 'Salvar'}
                          </Button>
                          <Button variant="outline" onClick={handleCancelUsername} disabled={isSavingUsername}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-1 p-3 bg-gray-800 rounded-lg">
                          <span className="text-white">{username || 'Nenhum username definido'}</span>
                          <Button
                            variant="ghost"
                            className="text-cyan-400 hover:text-cyan-300"
                            onClick={() => {
                              if (isEditingEmail || isChangingPassword) return;
                              setIsEditingUsername(true);
                              setEditedUsername(username);
                            }}
                            disabled={isEditingEmail || isChangingPassword}
                          >
                            Editar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Email Section with Edit Form */}
              <div className="border-b border-gray-600 pb-4">
                <h3 className="text-xl font-semibold text-white mb-4">Informações de Acesso</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Email</Label>
                    {isEditingEmail ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mt-1 p-3 bg-gray-800 rounded-lg gap-2">
                          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
                            <Input
                              type="email"
                              value={editedEmail}
                              onChange={(e) => setEditedEmail(e.target.value)}
                              className="border-0 bg-transparent text-white"
                              disabled={isSavingEmail}
                            />
                          </div>
                          <Button 
                            onClick={handleSaveEmail}
                            disabled={isSavingEmail}
                            className="bg-cyan-600 hover:bg-cyan-700"
                          >
                            {isSavingEmail ? 'Salvando...' : 'Salvar'}
                          </Button>
                          <Button variant="outline" onClick={handleCancelEmail} disabled={isSavingEmail}>
                            Cancelar
                          </Button>
                        </div>
                        {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1 p-3 bg-gray-800 rounded-lg">
                        <span className="text-white">{user?.email}</span>
                        {!isOAuthUser && (
                          <Button
                            variant="ghost"
                            className="text-cyan-400 hover:text-cyan-300"
                            onClick={handleEditEmail}
                            disabled={isEditingUsername || isChangingPassword}
                          >
                            Mudar Email
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Section with Change Form */}
              {!isOAuthUser && (
                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Segurança</h3>
                  {isChangingPassword ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Senha Atual</Label>
                        <Input
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="bg-gray-800 border-0 text-white mt-1 px-3"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Nova Senha</Label>
                        <Input
                          isPassword
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-gray-800 border-0 text-white mt-1 px-3"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Confirmar Nova Senha</Label>
                        <Input
                          isPassword
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="bg-gray-800 border-0 text-white mt-1 px-3"
                        />
                      </div>
                      {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                      
                      <div className='space-y-1'>
                        <p className="px-1 text-gray-300 text-sm">A senha deve conter:</p>
                        <PasswordRequirements password={newPassword} />
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button
                          onClick={handleChangePassword}
                          disabled={isSavingPassword}
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          {isSavingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
                        </Button>
                        <Button variant="outline" onClick={handleTogglePasswordChange} disabled={isSavingPassword}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10"
                      onClick={handleTogglePasswordChange}
                      disabled={isEditingUsername || isEditingEmail}
                    >
                      Alterar Senha
                    </Button>
                  )}
                </div>
              )}

              {/* Logout Section */}
              <div className="pt-4">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}