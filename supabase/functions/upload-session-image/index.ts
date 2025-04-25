// supabase/functions/upload-session-image/index.ts

// Importa as dependências necessárias
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0'; // Versão estável do SDK JS
// Importa parseMultipartFormData para lidar com FormData (pode ser necessário dependendo da versão do Deno)
// import { parseMultipartFormData } from 'https://deno.land/std@0.177.0/mime/multipart.ts';

// Configurações CORS (ajuste conforme necessário para o domínio do seu frontend em produção)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // <--- Mude '*' para o domínio do seu frontend em produção!
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Permite apenas POST e OPTIONS
};

console.log('Edge function "upload-session-image" started');

serve(async (req: Request) => {
  // Lida com requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  // Adiciona CORS headers à resposta para todas as requisições (exceto OPTIONS)
  const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };


  try {
    // 1. Inicializar o cliente Supabase na Edge Function com o JWT do usuário
    // Isso permite que as operações subsequentes respeitem as políticas de RLS configuradas para o usuário
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Usamos a chave anon, mas o header de autorização proverá o contexto do usuário
      { global: { headers: { 'Authorization': authHeader! } } }
    );

    // 2. Autenticar e obter o usuário logado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Erro de autenticação na Edge Function:', userError);
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        headers: responseHeaders, // Use os headers CORS na resposta de erro
        status: 401,
      });
    }

    console.log('Usuário autenticado na Edge Function:', user.id);

    // 3. Processar o corpo da requisição (espera-se FormData)
    const formData = await req.formData(); // Lê o corpo da requisição como FormData
    const file = formData.get('file') as File | null; // Obtém o arquivo
    const sessionId = formData.get('sessionId') as string | null; // Obtém o session ID
    const description = formData.get('description') as string | null; // Obtém a descrição
    const isPrivateStr = formData.get('isPrivate') as string | null; // Obtém a privacidade como string

    // 4. Validar se todos os dados necessários foram recebidos
    if (!file || !sessionId || description === null || isPrivateStr === null) {
         console.error('Dados obrigatórios faltando na requisição da Edge Function');
         return new Response(JSON.stringify({ error: 'Dados obrigatórios faltando (arquivo, sessionId, description, isPrivate)' }), {
             headers: responseHeaders, // Use os headers CORS
             status: 400, // Bad Request
         });
    }

    const isPrivate = isPrivateStr === 'true'; // Converte a string 'true'/'false' de volta para boolean

    // 5. Implementar a lógica de Autorização (Verificar se o usuário é o mestre da campanha)
    // Esta verificação protege a sua Edge Function contra uso indevido.
    try {
        const { data: sessionData, error: sessionError } = await supabaseClient
           .from('sessions')
           .select('campaign_id')
           .eq('id', sessionId)
           .single();

        if (sessionError || !sessionData) {
            console.error('Erro ao buscar sessão ou sessão não encontrada para autorização:', sessionError);
            return new Response(JSON.stringify({ error: 'Sessão inválida ou não encontrada para verificação de permissão' }), {
                headers: responseHeaders, // Use os headers CORS
                status: 404,
            });
        }

        const { data: campaignData, error: campaignError } = await supabaseClient
            .from('campaigns')
            .select('master_id')
            .eq('id', sessionData.campaign_id)
            .single();

        if (campaignError || !campaignData || campaignData.master_id !== user.id) {
            console.error('Usuário autenticado não é mestre desta campanha:', user.id);
            return new Response(JSON.stringify({ error: 'Acesso negado: Você não é o mestre da campanha desta sessão.' }), {
                headers: responseHeaders, // Use os headers CORS
                status: 403, // Acesso Negado
            });
        }

        console.log('Autorização de mestre da campanha verificada com sucesso.');

    } catch (authCheckError: any) { // Captura e tipa o erro
        console.error('Erro durante a verificação de autorização:', authCheckError);
        return new Response(JSON.stringify({ error: 'Erro interno durante a verificação de permissão', details: authCheckError.message }), {
            headers: responseHeaders, // Use os headers CORS
            status: 500,
        });
    }


    // 6. Sanitar o nome do arquivo para uso no caminho do Storage
    const originalFileName = file.name;
    // Remove caracteres que não são a-z, A-Z, 0-9, _, ., - e substitui múltiplos underlines por um único
    const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9_.\-]/g, '_').replace(/__+/g, '_');
    const uploadPath = `${sessionId}/${sanitizedFileName}`;
    const bucketName = 'session-images'; // Nome do seu bucket no Storage

    // 7. Fazer o upload do arquivo para o Supabase Storage
    // O cliente criado com o JWT do usuário fará esta operação.
    // As políticas de RLS do Storage (para o comando INSERT) configuradas para o usuário autenticado serão avaliadas aqui.
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(bucketName)
      .upload(uploadPath, file, {
         cacheControl: '3600', // Cache por 1 hora
         upsert: true, // Permite sobrescrever se o nome sanitizado for o mesmo
      });

    if (uploadError) {
      console.error('Erro ao fazer upload para Storage na Edge Function:', uploadError);
      // Se a política de RLS de Storage falhar aqui, o uploadError.message terá a mensagem de RLS.
      return new Response(JSON.stringify({ error: 'Falha no upload para Storage', details: uploadError.message }), {
        headers: responseHeaders, // Use os headers CORS
        status: uploadError.statusCode || 500, // Tenta usar o status code do erro do Storage, se disponível
      });
    }

    console.log('Upload para Storage bem-sucedido na Edge Function:', uploadData.path);

    // 8. Obter a URL pública do arquivo uploaded
    // Esta chamada é síncrona e geralmente não falha após um upload bem-sucedido com path retornado
    const { data: publicUrlData } = supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('Erro ao obter URL pública após upload na Edge Function');
        return new Response(JSON.stringify({ error: 'Falha ao gerar URL pública após upload' }), {
            headers: responseHeaders, // Use os headers CORS
            status: 500,
        });
    }

    console.log('URL pública obtida:', publicUrlData.publicUrl);

    // 9. Inserir os metadados do arquivo na tabela do banco de dados (session_images)
    // O cliente criado com o JWT do usuário fará esta operação.
    // As políticas de RLS da tabela session_images (para o comando INSERT) configuradas para o usuário autenticado serão avaliadas aqui.
    const { data: insertData, error: insertError } = await supabaseClient
      .from('session_images')
      .insert({
        session_id: sessionId,
        image_url: publicUrlData.publicUrl, // Salva a URL pública
        description: description,
        is_private: isPrivate,
        // created_at será preenchido automaticamente se a coluna tiver default NOW()
      })
      .select(); // Use .select() para que a chamada retorne os dados da linha inserida

    if (insertError) {
      console.error('Erro ao inserir metadados no BD na Edge Function:', insertError);
      // Se a política de RLS da tabela session_images falhar aqui, o insertError.message terá a mensagem de RLS do BD.
      return new Response(JSON.stringify({ error: 'Falha ao salvar metadados no banco de dados', details: insertError.message }), {
        headers: responseHeaders, // Use os headers CORS
        status: insertError.code === 'PGRST303' || insertError.message?.includes('policy') ? 403 : 500, // Tenta identificar erro de RLS
      });
    }

    console.log('Metadados salvos no BD:', insertData);

    // 10. Retornar uma resposta de sucesso para o cliente
    return new Response(JSON.stringify({
      message: 'Upload e salvamento de metadados bem-sucedidos!',
      imageUrl: publicUrlData.publicUrl,
      imageData: insertData ? insertData[0] : null, // Retorna os dados da linha inserida, se houver
    }), {
      headers: responseHeaders, // Use os headers CORS
      status: 200, // OK
    });

  } catch (error: any) {
    // Captura erros inesperados que não foram tratados nos blocos try/catch específicos
    console.error('Erro inesperado na Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Erro interno inesperado do servidor', details: error.message }), {
      headers: responseHeaders, // Use os headers CORS
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