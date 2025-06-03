// src/components/CampaignFilter.tsx

'use client';

// Definição dos tipos (mantidos)
export type CampaignStatusFilter = 'todos' | 'em_andamento' | 'hiato' | 'concluido';
export type CampaignSortBy = 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc';

// Interface para o estado dos filtros (mantida)
interface CampaignFilterState {
  status: CampaignStatusFilter;
  sortBy: CampaignSortBy;
}

// Interface de Props para o componente CampaignFilter - AGORA RECEBE filters COMO PROP
interface CampaignFilterProps {
  onFilterChange: (filters: CampaignFilterState) => void;
  filters: CampaignFilterState; // <-- ESTA PROP VAI RECEBER O ESTADO ATUAL DOS FILTROS DO PAI
}

// Usamos 'export function' sem memo por enquanto para focar no fluxo de dados.
// memo pode ser adicionado depois para otimização se necessário.
// export const CampaignFilter = memo(function CampaignFilter({ onFilterChange, filters }: CampaignFilterProps) {
export function CampaignFilter({ onFilterChange, filters }: CampaignFilterProps) { // <-- RECEBE filters COMO PROP AQUI

  // --- REMOVA ESTE BLOCO DE ESTADO LOCAL INTEIRO ---
  // const [filters, setFilters] = useState<CampaignFilterState>({
  //   status: 'todos',
  //   sortBy: 'date_desc',
  // });
  // --------------------------------------------------


  // Handler para a mudança no filtro de Status - Cria o objeto com o novo valor e chama o pai
  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as CampaignStatusFilter;
    // Cria o NOVO objeto de filtros, combinando os filtros EXISTENTES (que vieram via prop 'filters')
    // e o novo status.
    const updatedFilters = { ...filters, status: newStatus };
    onFilterChange(updatedFilters); // Notifica o componente pai com o objeto ATUALIZADO
    // NÃO CHAMA setFilters aqui, o estado é atualizado pelo pai na página dashboard/page.tsx
  };

  // Handler para a mudança na Ordenação - Cria o objeto com o novo valor e chama o pai
  const handleSortByChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = event.target.value as CampaignSortBy;
    // Cria o NOVO objeto de filtros, combinando os filtros EXISTENTES (que vieram via prop 'filters')
    // e a nova ordenação.
    const updatedFilters = { ...filters, sortBy: newSortBy };
    onFilterChange(updatedFilters); // Notifica o componente pai com o objeto ATUALIZADO
    // NÃO CHAMA setFilters aqui
  };

  // --- UI do Componente de Filtro ---
  return (
    <div className="p-4 space-y-3">
      {/* Status filter */}
      <div className="">
        <label className="text-sm font-medium text-white">Status</label>
        <select 
          value={filters.status}
          onChange={(e) => handleStatusChange(e)}
          className="w-full bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
        >
          <option value="todos">Todos</option>
          <option className='bg-green-100 text-green-600' value="em_andamento">Em Andamento</option>
          <option className='bg-yellow-100 text-yellow-600' value="hiato">Em Hiato</option>
          <option className='bg-red-100 text-red-600' value="concluido">Concluído</option>
        </select>
      </div>

      {/* Sort filter */}
      <div className="">
        <label className="text-sm font-medium text-white">Ordenar por</label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleSortByChange(e)}
          className="w-full bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
        >
          <option value="date_asc">Mais Antigas</option>
          <option value="date_desc">Mais Recentes</option>
          <option value="name_asc">Nome (A-Z)</option>
          <option value="name_desc">Nome (Z-A)</option>
        </select>
      </div>
    </div>
  );
}