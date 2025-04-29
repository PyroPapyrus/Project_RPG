// src/components/supabase-provider.tsx
'use client'; // Marca este componente como cliente

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session, SessionContextProvider } from '@supabase/auth-helpers-react';
import { useState } from 'react';

export default function SupabaseProvider({
  children,
  initialSession, // Recebe a sessão inicial como prop do layout do servidor
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  // Cria o cliente Supabase no lado do cliente uma vez
  const [supabaseClient] = useState(() => createClientComponentClient());

  // Envolve os children com o SessionContextProvider
  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}