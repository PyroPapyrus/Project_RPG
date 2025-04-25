// app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// --- Importações do Supabase Auth Helpers no servidor ---
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
// --- Fim das importações do Supabase Auth Helpers no servidor ---

// Importe o novo componente cliente provedor
import SupabaseProvider from '../components/supabase-provider';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        {/* Use o novo componente cliente provedor aqui */}
        <SupabaseProvider initialSession={session}>
          {children} {/* O conteúdo real da sua aplicação */}
        </SupabaseProvider>
      </body>
    </html>
  );
}