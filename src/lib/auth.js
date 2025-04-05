import { supabase } from "./supabaseClient";

// Sign Up Function
export async function signUp(email, password) {
  try {
    console.log('Tentando cadastrar:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    console.log('Resposta do Supabase:', data, error);

    if (error) {
      throw error;
    }

    return { 
      user: data.user, 
      message: "Cadastro realizado! Verifique seu e-mail para ativar sua conta." 
    };
  } catch (error) {
    console.error('Erro no cadastro:', error);
    throw error;
  }
}

// Login Function
export async function signIn(email, password) {
  try {
    console.log('Tentando fazer login:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Resposta do Supabase:', data, error);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Email ou senha incorretos.");
      }
      throw error;
    }

    if (!data.session) {
      throw new Error("Não foi possível criar uma sessão.");
    }

    // Aguardar um momento para garantir que a sessão foi estabelecida
    await new Promise(resolve => setTimeout(resolve, 500));

    return data.user;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// Logout Function
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return { message: "Logout realizado com sucesso!" };
  } catch (error) {
    console.error('Erro no logout:', error);
    throw error;
  }
}
