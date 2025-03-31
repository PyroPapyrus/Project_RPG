import { createClient } from "./supabaseClient";

export async function checkEmailExists(email) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.admin.listUsers({
      filter: { email: email }
    });

    if (error) {
      console.error('Erro ao verificar email:', error);
      throw error;
    }

    return data.users.length > 0;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    throw error;
  }
}

// Sign Up Function
export async function signUp(email, password) {
  try {
    const supabase = createClient();
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
      if (error.message.includes("User already registered")) {
        throw new Error("Este e-mail já está cadastrado. Tente recuperar a senha.");
      }
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
    const supabase = createClient();
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

    return data.user;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// Logout Function
export async function signOut() {
  try {
    const supabase = createClient();
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
