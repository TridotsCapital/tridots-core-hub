import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, CalendarSync, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAgencies } from '@/hooks/useAgencies';
import type { ContractFilters as ContractFiltersType } from '@/hooks/useContracts';
import type { Database } from '@/integrations/supabase/types';

type ContractStatus = Database['public']['Enums']['contract_status'];

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'documentacao_pendente', label: 'Doc. Pendente' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'encerrado', label: 'Encerrado' },
];

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface Props {
  filters: ContractFiltersType;
  onFiltersChange: (filters: ContractFiltersType) => void;
  onSearch: (term: string) => void;
}

export function ContractFilters({ filters, onFiltersChange, onSearch }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: agencies } = useAgencies();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleStatusChange = (status: ContractStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    onFiltersChange({ ...filters, status: newStatuses.length ? newStatuses : undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setSearchTerm('');
    onSearch('');
  };

  const activeFilterCount = [
    filters.status?.length ? 1 : 0,
    filters.agencyId ? 1 : 0,
    filters.startDate || filters.endDate ? 1 : 0,
    filters.minRent || filters.maxRent ? 1 : 0,
    filters.city ? 1 : 0,
    filters.state ? 1 : 0,
    filters.renewalPeriod ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const toggleRenewalPeriod = () => {
    onFiltersChange({ 
      ...filters, 
      renewalPeriod: !filters.renewalPeriod,
      status: !filters.renewalPeriod ? undefined : filters.status 
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Badges */}
        {STATUS_OPTIONS.map(option => (
          <Badge
            key={option.value}
            variant={filters.status?.includes(option.value) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleStatusChange(option.value)}
          >
            {option.label}
          </Badge>
        ))}

        <div className="h-5 w-px bg-border" />

        {/* Special Filter: Renewal Period */}
        <Badge
          variant={filters.renewalPeriod ? 'default' : 'outline'}
          className={`cursor-pointer transition-colors ${
            filters.renewalPeriod 
              ? 'bg-violet-600 hover:bg-violet-700 text-white' 
              : 'hover:bg-violet-100 hover:text-violet-700 hover:border-violet-300'
          }`}
          onClick={toggleRenewalPeriod}
        >
          <CalendarSync className="h-3 w-3 mr-1.5" />
          No Prazo de Renovação
        </Badge>

        <div className="h-5 w-px bg-border" />

        {/* Agency Filter */}
        <Select
          value={filters.agencyId || 'all'}
          onValueChange={(v) => onFiltersChange({ ...filters, agencyId: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Imobiliária" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Imobiliárias</SelectItem>
            {agencies?.map(agency => (
              <SelectItem key={agency.id} value={agency.id}>
                {agency.nome_fantasia || agency.razao_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* State Filter */}
        <Select
          value={filters.state || 'all'}
          onValueChange={(v) => onFiltersChange({ ...filters, state: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[100px] h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos UF</SelectItem>
            {STATES.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City Filter */}
        <Input
          placeholder="Cidade"
          value={filters.city || ''}
          onChange={(e) => onFiltersChange({ ...filters, city: e.target.value || undefined })}
          className="w-[130px] h-9"
        />

        <div className="h-5 w-px bg-border" />

        {/* Period Filter */}
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {filters.startDate ? format(filters.startDate, 'dd/MM/yy') : 'De'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => onFiltersChange({ ...filters, startDate: date || undefined })}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {filters.endDate ? format(filters.endDate, 'dd/MM/yy') : 'Até'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => onFiltersChange({ ...filters, endDate: date || undefined })}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Rent Range */}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="Aluguel mín"
            value={filters.minRent || ''}
            onChange={(e) => onFiltersChange({ ...filters, minRent: e.target.value ? Number(e.target.value) : undefined })}
            className="w-[100px] h-9"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="number"
            placeholder="máx"
            value={filters.maxRent || ''}
            onChange={(e) => onFiltersChange({ ...filters, maxRent: e.target.value ? Number(e.target.value) : undefined })}
            className="w-[70px] h-9"
          />
        </div>
      </div>
    </div>
  );
}
