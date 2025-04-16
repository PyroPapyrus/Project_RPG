// src/app/campaign/[id]/[name]/session/[sessionId]/page.tsx
'use client'

import { useParams } from 'next/navigation' // Hook para pegar parâmetros da URL

// Tipos (opcional por agora)
// import { Session } from '@/types/session'
// import { useState, useEffect } from 'react'
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface PageProps {
  params: {
    id: string // campaign Id
    name: string // campaign name slug
    sessionId: string // session Id
  }
}

// Renomeado para evitar conflito de nome com o tipo Session
const SessionDetailPage = ({ params }: PageProps) => {
  // Você pode usar o hook useParams também se preferir não usar props da página
  // const params = useParams<{ id: string; name: string; sessionId: string }>()

  // TODO: Buscar dados da sessão, imagens, notas, etc. usando params.sessionId

  return (
    <div className="container mx-auto p-8">
       <h1 className="text-2xl font-bold mb-4">Detalhes da Sessão</h1>
       <p>ID da Campanha: {params.id}</p>
       <p>Nome da Campanha: {params.name}</p>
       <p className="font-semibold mt-2">ID da Sessão: {params.sessionId}</p>
       {/* Aqui você vai carregar e mostrar os detalhes reais da sessão */}
       <div className="mt-8 p-4 border rounded bg-gray-100">
           <p>Conteúdo detalhado da sessão (Relatório, Imagens, Notas...) aparecerá aqui.</p>
       </div>
       {/* Botão voltar (opcional) */}
       {/* <Button onClick={() => window.history.back()}>Voltar</Button> */}
    </div>
  );
}

export default SessionDetailPage;