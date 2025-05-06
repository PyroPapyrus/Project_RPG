// src/components/CampaignFilter.tsx

'use client';

// Remova 'useState' pois o estado será gerenciado pelo pai. Mantenha 'memo' se quiser otimização.
import { memo } from 'react'; // Removido useState aqui
import { Button } from '@/components/ui/button';

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
  //   status: 'todos',
  //   sortBy: 'date_desc',
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
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm">

      {/* Dropdown para Filtrar por Status */}
      <div className="flex items-center gap-2">
        <label htmlFor="campaign-status-filter" className="text-sm font-medium text-gray-700">Status:</label>
        <select
          id="campaign-status-filter"
          value={filters.status} // <-- AGORA BINDEADO À PROP filters.status
          onChange={handleStatusChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="todos">Todos</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="hiato">Em Hiato</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>

      {/* Dropdown para Ordenar por */}
      <div className="flex items-center gap-2">
        <label htmlFor="campaign-sort-by" className="text-sm font-medium text-gray-700">Ordenar por:</label>
        <select
          id="campaign-sort-by"
          value={filters.sortBy} // <-- AGORA BINDEADO À PROP filters.sortBy
          onChange={handleSortByChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="date_desc">Mais Recentes</option>
          <option value="date_asc">Mais Antigas</option>
          <option value="name_asc">Nome (A-Z)</option>
          <option value="name_desc">Nome (Z-A)</option>
        </select>
      </div>

    </div>
  );
}