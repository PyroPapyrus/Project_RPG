// src/components/CampaignNotes.tsx

'use client'; // Componente cliente que roda no navegador

import { useState, useEffect } from 'react';
import { useSessionContext } from '@supabase/auth-helpers-react'; // Hook para acessar o cliente Supabase e sessão
import { Button } from '@/components/ui/button'; // Componentes de UI (Shadcn/ui)
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify'; // Para notificações
import { Plus } from 'lucide-react';

// Define a estrutura de um objeto Note (Nota de Campanha ou Sessão)
interface Note {
 id: string; // UUID único da nota
 title: string; // Título da nota
 content: string; // Conteúdo da nota (pode ser texto longo)
 is_private: boolean; // Indica se a nota é privada (visível só para o autor) ou pública
 session_id: string | null; // ID da sessão à qual a nota pertence (null para notas de campanha)
 campaign_id: string | null; // ID da campanha à qual a nota pertence (null para notas de sessão - não relevante aqui)
 user_id: string; // ID do usuário que criou a nota
 created_at: string; // Timestamp de criação
 updated_at: string; // Timestamp de última atualização
 users?: { id: string; username: string | null }[] | null; // Opcional: dados do autor (populado via join/select)
}

// Propriedades esperadas pelo componente CampaignNotes
interface CampaignNotesProps {
 campaignId: string; // ID da campanha atual
}

// Define os tipos de filtro disponíveis para as notas
type NoteFilter = 'all' | 'mine' | 'public_others';


// Componente principal para gerenciar e exibir notas de campanha
export default function CampaignNotes({ campaignId }: CampaignNotesProps) {
 // Obtém a instância do cliente Supabase e a sessão do usuário autenticado
 const { supabaseClient, session } = useSessionContext();
 const user = session?.user; // Objeto user da sessão
 const userId = user?.id; // UUID do usuário autenticado

 // --- ESTADOS DO COMPONENTE ---
 const [notes, setNotes] = useState<Note[]>([]); // Armazena a lista completa de notas buscadas (sujeita a RLS)
 const [editingNote, setEditingNote] = useState<Note | null>(null); // Nota sendo editada no momento
 // Estado para o formulário de nova nota (inicializa com campaign_id da prop e session_id null)
 const [newNote, setNewNote] = useState({ title: '', content: '', is_private: true, campaign_id: campaignId, session_id: null as string | null });
 const [loading, setLoading] = useState(false); // Indica estado de carregamento (para adicionar nota)
 // Indica qual nota está tendo seu status de privacidade atualizado (para desabilitar o botão)
 const [updatingPrivateStatus, setUpdatingPrivateStatus] = useState<string | null>(null);
 // Estado para o filtro de exibição das notas, padrão 'all'
 const [filter, setFilter] = useState<NoteFilter>('all');
 // --- FIM ESTADOS DO COMPONENTE ---


 // --- EFEITO: Buscar notas ao carregar ou mudar campaign/usuário ---
 // Este efeito inicializa o formulário de nova nota e busca as notas
 // sempre que a campanha ou o usuário logado muda.
 useEffect(() => {
  // Só tenta buscar notas se houver um usuário autenticado
  if (userId) {
   setNewNote({ title: '', content: '', is_private: true, campaign_id: campaignId, session_id: null }); // Resetar formulário de nova nota
   fetchNotes(); // Buscar as notas
  } else {
   setNotes([]); // Limpar notas se não houver usuário logado
  }
  // Dependências: re-executa se campaignId, userId ou a instância do cliente supabase mudar
  // Incluir supabaseClient é recomendado quando ele é usado dentro do efeito ou funções chamadas por ele
 }, [campaignId, userId, supabaseClient]);


 // --- FUNÇÃO: Buscar notas do Supabase ---
 // Busca notas da tabela 'notes' para a campanha atual (ignorando notas de sessão).
 // A quais notas o usuário tem acesso é determinado pelas políticas de RLS no Supabase.
 const fetchNotes = async () => {
  const { data, error } = await supabaseClient
   .from('notes')
   .select('id, title, content, is_private, session_id, campaign_id, user_id, created_at, updated_at') // Seleciona as colunas relevantes
   .eq('campaign_id', campaignId) // Filtra pela campanha atual
   .is('session_id', null) // Garante que são notas de campanha (não de sessão)
   .order('created_at', { ascending: true }); // Ordena pela data de criação

  if (error) {
   console.error("Erro ao buscar notas da campanha:", error);
   toast.error('Erro ao buscar notas da campanha.');
  } else {
   // Se houver notas buscadas e um usuário logado, busca os nomes dos autores
   if (data && data.length > 0 && userId) {
    const userIds = Array.from(new Set(data.map(note => note.user_id))); // IDs únicos dos autores

    // Busca os nomes dos usuários na tabela 'users'
    const { data: usersData, error: usersError } = await supabaseClient
     .from('users')
     .select('id, username')
     .in('id', userIds); // Filtra pelos IDs de usuários encontrados nas notas

    if (usersError) {
     console.error("Erro ao buscar nomes dos usuários:", usersError);
     toast.error('Não foi possível carregar nomes dos autores.');
     // Define as notas sem os nomes mapeados se a busca de usuários falhar
     setNotes(data || []);
    } else {
     // Mapeia os nomes dos usuários para as notas correspondentes
     const notesWithUserNames = data.map(note => {
     
      const author = usersData?.find(user => user.id === note.user_id);
      return {
       ...note,
       users: author ? [{ id: author.id, username: author.username }] : null // Anexa os dados do autor à nota
      };
     });
     setNotes(notesWithUserNames); // Atualiza o estado com as notas e nomes dos autores
    }
   } else {
     // Define as notas se não houver notas buscadas ou userId não disponível
     setNotes(data || []);
   }
  }
 };


 // --- HANDLER: Editar uma nota existente ---
 const handleEdit = async () => {
  // Só edita se houver uma nota selecionada para edição e o usuário logado
  if (!editingNote || !userId) return;

  // Envia a atualização para o Supabase
  // A RLS deve garantir que apenas o autor possa atualizar sua nota.
  const { error } = await supabaseClient
   .from('notes')
   .update({
    title: editingNote.title,
    content: editingNote.content
   })
   .eq('id', editingNote.id) // Onde o ID corresponde à nota sendo editada
   .eq('user_id', userId); // Garante que o usuário logado é o autor (redundante com RLS, mas boa prática)

  if (error) {
   console.error("Erro ao atualizar nota de campanha:", error);
   toast.error('Erro ao atualizar a nota.');
  } else {
   toast.success('Nota atualizada com sucesso.');
   setEditingNote(null); // Sai do modo de edição
   fetchNotes(); // Recarrega as notas para refletir a mudança
  }
 };

 // --- HANDLER: Excluir uma nota ---
 const handleDelete = async (id: string) => {
  // Só exclui se houver usuário logado
  if (!userId) return;

  // Envia a requisição de exclusão para o Supabase
  // A RLS deve garantir que apenas o autor possa excluir sua nota.
  const { error } = await supabaseClient.from('notes')
   .delete()
   .eq('id', id) // Onde o ID corresponde à nota a ser excluída
   .eq('user_id', userId); // Garante que o usuário logado é o autor (redundante com RLS)

  if (error) {
   console.error("Erro ao excluir nota de campanha:", error);
   toast.error('Erro ao excluir a nota.');
  } else {
   toast.success('Nota excluída com sucesso.');
   fetchNotes(); // Recarrega as notas para refletir a exclusão
  }
 };

 // --- HANDLER: Adicionar uma nova nota ---
 const handleAddNote = async () => {
  // Só adiciona se houver usuário autenticado e título/conteúdo preenchidos (pode adicionar validação mais robusta)
  if (!userId || !newNote.title || !newNote.content) {
   toast.error("Por favor, preencha o título e o conteúdo da nota.");
   return;
  }

  setLoading(true); // Ativa estado de loading

  // Prepara o objeto da nova nota para inserção
  const noteToInsert = {
   title: newNote.title,
   content: newNote.content,
   is_private: newNote.is_private,
   user_id: userId, // Associa a nota ao usuário logado
   campaign_id: campaignId, // Associa a nota à campanha atual
   session_id: null, // Garante que é uma nota SOMENTE de campanha
  };

  // Envia a nova nota para o Supabase
  // A RLS deve garantir que o usuário possa inserir a nota (ex: se ele for jogador/mestre na campanha).
  const { error } = await supabaseClient.from('notes').insert([noteToInsert]);

  setLoading(false); // Desativa estado de loading

  if (error) {
   console.error("Erro ao adicionar nota de campanha:", error);
   toast.error('Erro ao adicionar a nota.');
  } else {
   setNewNote({ title: '', content: '', is_private: true, campaign_id: campaignId, session_id: null }); // Limpa e reseta o formulário
   toast.success('Nota adicionada com sucesso.');
   fetchNotes(); // Recarrega as notas para incluir a nova
  }
 };


 // --- HANDLER: Alternar o status de privacidade de uma nota ---
 // Permite que o autor de uma nota a torne pública ou privada.
 const handleTogglePrivate = async (note: Note) => {
  // Só o autor pode alterar a privacidade da nota
  if (!userId || note.user_id !== userId) return;

  setUpdatingPrivateStatus(note.id); // Indica qual nota está sendo atualizada visualmente

  const newPrivateStatus = !note.is_private; // Inverte o status atual

  try {
    // Envia a atualização do status de privacidade para o Supabase
    // A RLS deve garantir que apenas o autor possa atualizar o campo is_private.
    const { data, error } = await supabaseClient
      .from('notes')
      .update({ is_private: newPrivateStatus }) // Atualiza apenas o campo is_private
      .eq('id', note.id) // Onde o ID corresponde à nota
      .eq('user_id', userId) // Garante que só o autor atualiza (redundante com RLS, mas seguro)
      .select('id, is_private') // Opcional: Retorna o ID e o novo status privado
      .single(); // Espera um único resultado

    if (error) throw error; // Lança erro para ser pego pelo catch

    // Atualiza o estado local das notas imediatamente para feedback rápido na UI
    setNotes(prevNotes =>
      prevNotes.map(n =>
        // Encontra a nota atualizada pelo ID e cria um novo objeto com o novo status privado
        n.id === note.id ? { ...n, is_private: newPrivateStatus } : n
      )
    );

    toast.success(`Nota "${note.title}" tornada ${newPrivateStatus ? 'privada' : 'pública'}.`);

  } catch (error: any) {
    console.error("Erro ao alternar privacidade da nota:", error);
    toast.error('Erro ao alternar a privacidade da nota.');
  } finally {
    setUpdatingPrivateStatus(null); // Reseta o estado de atualização visual
  }
};


 // --- Lógica de Filtragem (Executada a cada render) ---
 // Filtra a lista completa de 'notes' com base no estado 'filter'.
 // Esta lógica opera sobre os dados já buscados (sujeitos a RLS).
 const filteredNotes = notes.filter(note => {
  // Garante que só processa se houver um usuário logado (redundante devido ao check no início do return, mas seguro)
  if (!userId) return false;

  // Define a condição para incluir a nota na lista filtrada
  const filterCondition = (
   // Se o filtro for 'all', inclui a nota
   (filter === 'all') ||
   // Se o filtro for 'mine' E a nota for do usuário logado, inclui a nota
   (filter === 'mine' && note.user_id === userId) ||
   // Se o filtro for 'public_others' E a nota for pública E não for do usuário logado, inclui a nota
   (filter === 'public_others' && !note.is_private && note.user_id !== userId)
  );

  return filterCondition; // Retorna true para incluir, false para excluir
 });


 // --- Renderização Condicional: Mostra loading se usuário não estiver carregado ---
 // Este check é feito logo no início do return.
 if (!user) {
   return <p>Carregando informações do usuário...</p>; // Mensagem enquanto a sessão não carrega
 }

 // --- RENDERIZAÇÃO PRINCIPAL ---
 return (
    <div className="space-y-4 mb-4"> {/* Container principal com espaçamento vertical */}
      <div> {/* Seção de exibição e filtro das notas */}
        
          {/* --- DIV COM SELECT DE FILTRO --- */}
          <div className="flex px-4 justify-between rounded items-center gap-2 my-2">
            <select
              className="h-9 rounded-md bg-gray-200 px-2 text-cyan-500 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as NoteFilter)}
            >
              <option value="all">Todas as Notas</option>
              <option value="mine">Minhas Notas</option>
              <option value="public_others">Públicas (Outros)</option>
            </select>
            {/* Botão para adicionar a nota */}
            <Button 
              className='gap-2 text-sm'
              onClick={handleAddNote}
              disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Anotação'}
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        {/* --- FIM DE DIV COM SELECT DE FILTRO --- */}

        {/* --- SEÇÃO: Adicionar Nova Nota --- */}
        <div className="mx-8 px-4 text-black py-2 rounded bg-gray-700"> 
          <div className='justify-between flex'>
            <h3 className="font-semibold mb-1 text-white">Nova Nota de Campanha</h3> {/* Título da seção */}
            {/* Ícone de Cadeado: trancado para privada, aberto para pública */}
            {newNote.is_private ? (
              <span className="material-symbols-rounded text-red-600" title="Nota Privada">lock</span>
                ) : (
              <span className="material-symbols-rounded text-green-500" title="Nota Pública">lock_open</span>
            )}
          </div>
          
          {/* Input para o título */}
          <Textarea
            placeholder="Título/nome da nota"
            className="mb-2 resize-none min-h-[40px] overflow-hidden"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            maxLength={60}
          />
          {/* Textarea para o conteúdo */}
          <Textarea
            placeholder="Conteúdo da nota"
            className="mb-2 resize-none"
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
          />
          {/* Checkbox para definir privacidade */}
          <div className="bg-black text-white px-2 py-1 rounded-sm justify-self-start flex items-center space-x-1 mb-1">
            <input
              id="is_private_campaign"
              type="checkbox"
              checked={newNote.is_private}
              onChange={(e) => setNewNote({ ...newNote, is_private: e.target.checked })}
            />
            <label htmlFor="is_private_campaign" className="text-sm">Privada</label>
          </div>
        </div> {/* Fim da Seção Adicionar Nova Nota */}
  
        {/* Container que lista as notas (filtradas) */}
        <div className="space-y-2 mt-3 text-black"> {/* Espaçamento vertical entre os cards de nota */}
          {/* Mapeia o array de notas FILTRADAS para renderizar cada nota */}
          {filteredNotes.map((note) => (
            /* Card individual da nota */
            <div key={note.id} className="bg-gray-600 rounded p-3 mx-5"> {/* Usa o ID da nota como key */}
              {/* Renderiza o modo de edição se a nota atual for a que está sendo editada */}
              {editingNote?.id === note.id ? (
                // --- MODO EDIÇÃO ---
                <> {/* Fragmento para agrupar elementos */}
                  <Input
                    className="mb-2"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    placeholder="Título"
                    maxLength={40}
                  />
                  <Textarea
                    className="mb-2"
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    placeholder="Conteúdo da nota"
                  />
                     <div className="flex justify-end space-x-2"> {/* Botões de salvar/cancelar */}
                      <Button onClick={handleEdit}>Salvar</Button>
                      <Button variant="outline" onClick={() => setEditingNote(null)}>Cancelar</Button>
                     </div>
                </> /* Fim do Fragmento */
                ) : (
                // --- MODO VISUALIZAÇÃO ---
                <> {/* Fragmento para agrupar elementos */}
                  {/* Título da nota e ícone de privacidade */}
                  <h4 className="font-semibold text-white border-b-2">
                    <div className="flex items-center justify-between"> 
                      <span className="text-lg -mb-2 font-semibold overflow-hidden overflow-wrap-break-word break-words max-w-full">
                        {note.title}
                      </span>
                        {/* Ícone de Cadeado: trancado para privada, aberto para pública */}
                        {note.is_private ? (
                          <span className="material-symbols-rounded text-red-600" title="Nota Privada">lock</span>
                          ) : (
                          <span className="material-symbols-rounded text-green-500" title="Nota Pública">lock_open</span>
                        )}
                    </div>
                      {/* Exibe "(Minha Nota)" se for do usuário logado, ou "por [Nome do Autor]" se for de outro */}
                      {note.user_id === userId ? (
                        <span className="text-sm text-blue-600 font-normal">Minha Nota</span>
                        ) : (
                        note.users?.[0]?.username && ( // Verifica se há dados de usuário e username
                          <span className="text-sm text-yellow-500 font-normal">
                            {' por '}
                            {note.users[0].username}
                          </span>
                        )
                      )}
                  </h4>

                  {/* Conteúdo da nota, preserva quebras de linha */}
                  <p className="text-sm text-white whitespace-pre-wrap">{note.content}</p>
                    {/* Botões de ação (Alternar Privacidade, Editar, Excluir) - visíveis apenas para o autor */}
                    {note.user_id === userId && (
                      <div className="flex justify-end mt-2 space-x-2">
                        {/* Botão para alternar privacidade */}
                        <Button
                          className='bg-black rounded hover:bg-gray-500 text-white'
                          size="sm"
                          onClick={() => handleTogglePrivate(note)}
                          disabled={updatingPrivateStatus === note.id} // Desabilita durante a atualização
                        >
                          {updatingPrivateStatus === note.id ? (
                            'Atualizando...'
                          ) : note.is_private ? (
                            'Tornar Pública'
                          ) : (
                            'Tornar Privada'
                          )}
                        </Button>

                        {/* --- FIM BOTÃO ALTERNAR PRIVACIDADE --- */}
                        <Button className='bg-black rounded hover:bg-gray-500 text-yellow-500' size="sm" onClick={() => setEditingNote(note)}>Editar</Button>
                        <Button className='bg-black rounded hover:bg-gray-500 text-red-600' size="sm" onClick={() => handleDelete(note.id)}>Excluir</Button>
                      </div>
                    )}
                </> /* Fim do Fragmento */
              )} {/* Fim da Lógica Condicional Modo Edição/Visualização */}

            </div> /* Fim do Card individual da nota */
          ))} {/* Fim do Mapeamento de filteredNotes */}

          {/* Mensagem exibida quando a lista filtrada está vazia */}
          {filteredNotes.length === 0 && (
            <p className="text-gray-500 text-center mt-4">
              {filter === 'all' ? (
                'Ainda não há notas para esta campanha que você possa visualizar.' // Mensagem para filtro 'Todas'
              ) : filter === 'mine' ? (
                'Você ainda não adicionou notas para esta campanha.' // Mensagem para filtro 'Minhas Notas'
              ) : ( // filtro 'public_others'
                'Não há notas públicas de outros usuários nesta campanha.' // Mensagem para filtro 'Públicas (Outros)'
              )}
            </p>
          )}
        </div> {/* Fim do Container que lista as notas */}

      </div> {/* Fim da Seção de exibição e filtro */}
    </div> // Fim do Container Principal
 );
}