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
    <div className="absolute grid gap-2 z-50">
        <div className='fixed left-6 top-[450px] space-y-2'>
            {/* Dropdown para Filtrar por Status */}
            <div className="flex bg-white px-5 py-2 gap-2 rounded-md items-center shadow-lg">
                <label className="text-md font-bold text-black">Status:</label>
                <select
                    id="campaign-status-filter"
                    value={filters.status}
                    onChange={handleStatusChange}
                    className="block pl-2 pr-2 py-1 text-md rounded-sm border"
                >
                    <option value="todos">Todos</option>
                    <option className='bg-green-100 text-green-600' value="em_andamento">Em Andamento</option>
                    <option className='bg-yellow-100 text-yellow-600' value="hiato">Em Hiato</option>
                    <option className='bg-red-100 text-red-600' value="concluido">Concluído</option>
                </select>
            </div>

            {/* Dropdown para Ordenar por */}
            <div className="flex bg-white px-5 py-2 gap-[3px] rounded-md items-center shadow-lg">
                <label className="text-md font-bold text-black">Ordem:</label>
                <select
                id="campaign-sort-by"
                value={filters.sortBy}
                onChange={handleSortByChange}
                className="block pl-2 pr-[18px] py-1 text-md rounded-sm border"
                >
                    <option value="date_asc">Mais Antigas</option>
                    <option value="date_desc">Mais Recentes</option>
                    <option value="name_asc">Nome (A-Z)</option>
                    <option value="name_desc">Nome (Z-A)</option>
                </select>
            </div>
        </div>
    </div>
  );
}