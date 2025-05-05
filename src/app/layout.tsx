import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  weight: '400',
  subsets: ['latin'],
})

// --- Importações do Supabase Auth Helpers no servidor ---
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
// --- Fim das importações do Supabase Auth Helpers no servidor ---

// Importe o novo componente cliente provedor
import SupabaseProvider from '../components/supabase-provider';

export const metadata: Metadata = {
  title: 'Gerenciador de Campanhas de RPG',
  description: 'Uma aplicação para gerenciar suas campanhas de RPG',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- Criação do cliente Supabase e obtenção da sessão no servidor ---
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  // --- Fim da criação do cliente Supabase e obtenção da sessão no servidor ---

  return (
    <html lang="pt-BR">
      <head>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin='anonymous'/>
      <link href="https://fonts.googleapis.com/css2?family=Boldonse&display=swap" rel="stylesheet"/>

      <link rel="stylesheet" 
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0"
      />

      </head>

      <body className={poppins.className}>
        {/* Use o novo componente cliente provedor aqui */}
        <SupabaseProvider initialSession={session}>
          {children} {/* O conteúdo real da sua aplicação */}
        </SupabaseProvider>
      </body>
    </html>
  );
}