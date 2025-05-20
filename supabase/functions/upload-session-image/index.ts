// supabase/functions/upload-session-image/index.ts

// Importa as dependências necessárias
// Use '@supabase/supabase-js' diretamente para o SDK JS
// O server.ts do Deno std deve ser importado assim
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'; // Use uma versão recente e estável
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Versão estável do SDK JS (v3 está em beta)

// NOTA: Se você estiver usando versões antigas do Deno ou do Supabase CLI,
// a sintaxe de importação ou o parseamento de FormData pode variar.
// O Supabase CLI geralmente cuida de baixar e cachear essas dependências.
// Os erros de tipo podem estar relacionados a um problema de configuração local do Deno/TypeScript.
// Execute 'supabase functions serve' ou 'supabase functions deploy' para que o Deno gerencie as dependências.

// Configurações CORS (ajuste conforme necessário para o domínio do seu frontend em produção)
// É recomendado criar um arquivo compartilhado para isso: supabase/functions/_shared/cors-headers.ts
// e importar: import { corsHeaders } from '../_shared/cors-headers.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // <<< MUDE ISSO em produção para o domínio do seu frontend!
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Permite apenas POST para upload
};

console.log('Edge function "upload-session-image" started');

serve(async (req: Request) => {
  // Lida com requisições OPTIONS para CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  // Adiciona CORS headers à resposta para todas as requisições (exceto OPTIONS)
  const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  // Use um bloco try/catch robusto para capturar quaisquer erros durante a execução
  try {
    // 1. Inicializar o cliente Supabase na Edge Function com o JWT do usuário
    // Isso permite que as operações subsequentes respeitem as políticas de RLS configuradas para o usuário
    const authHeader = req.headers.get('Authorization');
    // O token anon key é para inicializar o cliente, o header Auth provê o contexto do usuário para RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { 'Authorization': authHeader! } } } // '!' afirma para o TS que não será nulo se authHeader vier
    );

    // 2. Autenticar e obter o usuário logado
    // supabaseClient.auth.getUser() valida o token JWT automaticamente contra o Auth Supabase
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Erro de autenticação na Edge Function:', userError?.message);
      return new Response(JSON.stringify({ error: userError?.message || 'Usuário não autenticado' }), {
        headers: responseHeaders,
        status: 401,
      });
    }

    console.log('Usuário autenticado na Edge Function:', user.id);

    // 3. Processar o corpo da requisição (espera-se FormData)
    // O Deno tem suporte nativo para req.formData() a partir de certas versões
    const formData = await req.formData();
    const file = formData.get('file') as File | null; // Obtém o arquivo do FormData
    const sessionId = formData.get('sessionId') as string | null; // Obtém o session ID
    const description = formData.get('description') as string | null; // Obtém a descrição
    const isPrivateStr = formData.get('isPrivate') as string | null; // Obtém a privacidade como string

    // 4. Validar se todos os dados necessários foram recebidos
    // A descrição e isPrivate podem vir como string 'null' se os campos não forem preenchidos no FormData,
    // a validação === null é mais robusta.
    if (!file || !sessionId || description === null || isPrivateStr === null) {
         console.error('Dados obrigatórios faltando na requisição da Edge Function');
         return new Response(JSON.stringify({ error: 'Dados obrigatórios faltando (arquivo, sessionId, description, isPrivate)' }), {
             headers: responseHeaders,
             status: 400,
         });
    }

    // Converte a string 'true'/'false' de volta para boolean
    const isPrivate = isPrivateStr === 'true';

    // 5. Implementar a lógica de Autorização (Verificar se o usuário é o mestre da campanha)
    // Esta verificação protege a sua Edge Function contra uso indevido antes mesmo de tentar o upload.
    try {
        // Buscar o campaign_id da sessão
        const { data: sessionData, error: sessionError } = await supabaseClient
           .from('sessions')
           .select('campaign_id')
           .eq('id', sessionId)
           .single();

        if (sessionError || !sessionData) {
            console.error('Erro ao buscar sessão ou sessão não encontrada para autorização:', sessionError?.message);
            return new Response(JSON.stringify({ error: sessionError?.message || 'Sessão inválida ou não encontrada para verificação de permissão' }), {
                headers: responseHeaders,
                status: 404,
            });
        }

        // Buscar o master_id da campanha
        const { data: campaignData, error: campaignError } = await supabaseClient
            .from('campaigns')
            .select('master_id')
            .eq('id', sessionData.campaign_id)
            .single();

        // Verificar se o usuário autenticado é o mestre
        if (campaignError || !campaignData || campaignData.master_id !== user.id) {
            console.error('Usuário autenticado não é mestre desta campanha:', user.id);
            return new Response(JSON.stringify({ error: 'Acesso negado: Você não é o mestre da campanha desta sessão.' }), {
                headers: responseHeaders,
                status: 403, // Acesso Negado
            });
        }

        console.log('Autorização de mestre da campanha verificada com sucesso.');

    } catch (authCheckError: any) { // Captura e tipa o erro
        console.error('Erro durante a verificação de autorização:', authCheckError?.message);
        return new Response(JSON.stringify({ error: 'Erro interno durante a verificação de permissão', details: authCheckError?.message }), {
            headers: responseHeaders,
            status: 500,
        });
    }


    // 6. Sanitar o nome do arquivo para uso no caminho do Storage
    // O caminho no Storage será session_id/nome_sanitizado.extensao
    const originalFileName = file.name;
    // Regex mais robusto para sanitizar nomes de arquivo
    // Permite letras, números, hífen, underline e ponto.
    const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9_.\-]/g, '_').replace(/__+/g, '_');
    const uploadPath = `${sessionId}/${sanitizedFileName}`; // Caminho dentro do bucket: session_id/nome_do_arquivo_sanitizado
    const bucketName = 'session-images'; // <<< CONFIRME SE ESTE É O NOME DO SEU BUCKET!

    // 7. Fazer o upload do arquivo para o Supabase Storage
    // O cliente criado com o JWT do usuário fará esta operação.
    // As políticas de RLS do Storage (para o comando INSERT) configuradas para o usuário autenticado serão avaliadas aqui.
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(bucketName)
      .upload(uploadPath, file, {
         cacheControl: '3600', // Cache por 1 hora
         upsert: true, // Permite sobrescrever se o nome sanitizado for o mesmo no mesmo session_id
      });

    if (uploadError) {
      console.error('Erro ao fazer upload para Storage na Edge Function:', uploadError.message);
      // Se a política de RLS de Storage (INSERT) falhar aqui, o uploadError.message terá a mensagem de erro.
      return new Response(JSON.stringify({ error: 'Falha no upload para Storage', details: uploadError.message }), {
        headers: responseHeaders,
        status: 500, // status: uploadError.statusCode || 500, // statusCode nem sempre disponível
      });
    }

    console.log('Upload para Storage bem-sucedido na Edge Function. Path:', uploadData.path);

    // 8. Inserir os metadados do arquivo na tabela do banco de dados (session_images)
    // *** SALVAR uploadData.path (o caminho), NÃO a URL pública completa ***
    const { data: insertData, error: insertError } = await supabaseClient
      .from('session_images') // <<<<< CONFIRME SE ESTE É O NOME DA SUA TABELA session_images
      .insert({
        session_id: sessionId,
        image_url: uploadData.path, // <<< CORRIGIDO: Salvar o caminho do arquivo no Storage
        description: description,
        is_private: isPrivate,
        user_id: user.id, // Salvar o ID do usuário que fez o upload
        // created_at será preenchido automaticamente se a coluna tiver default NOW()
      })
      .select(); // Use .select() para que a chamada retorne os dados da linha inserida (incluindo o ID gerado)

    if (insertError) {
      console.error('Erro ao inserir metadados no BD na Edge Function:', insertError.message);
      // Se a política de RLS da tabela session_images (INSERT) falhar aqui, o insertError.message terá a mensagem de erro do BD.
      return new Response(JSON.stringify({ error: 'Falha ao salvar metadados no banco de dados', details: insertError.message }), {
        headers: responseHeaders,
        status: 500, // Geralmente erro 500 para erro no banco, mas pode tentar detectar 403 se a mensagem indicar RLS
      });
    }

    console.log('Metadados salvos no BD:', insertData);

    // 9. Retornar uma resposta de sucesso para o cliente com os metadados salvos
    // Não precisamos gerar a URL pública aqui, o frontend fará isso ao exibir.
    return new Response(JSON.stringify({
      message: 'Upload e salvamento de metadados bem-sucedidos!',
      // imageUrl: publicUrlData.publicUrl, // Não precisamos retornar a URL pública daqui
      imageData: insertData ? insertData[0] : null, // Retorna os dados da linha inserida
    }), {
      headers: responseHeaders,
      status: 200, // OK
    });

  } catch (error: any) {
    // Captura erros inesperados que não foram tratados nos blocos try/catch específicos
    console.error('Erro inesperado na Edge Function:', error?.message);
    return new Response(JSON.stringify({ error: 'Erro interno inesperado do servidor', details: error?.message }), {
      headers: responseHeaders,
      status: 500,
    });
  }
});

// Arquivo de cabeçalhos CORS de exemplo (_shared/cors-headers.ts)
// Crie este arquivo na pasta supabase/functions/_shared se ele não existir
/*
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // <--- Mude '*' para o domínio do seu frontend em produção!
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Permite apenas POST e OPTIONS
}
*/