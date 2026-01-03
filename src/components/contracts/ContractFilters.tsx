import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { CalendarIcon, Filter, Search, X } from 'lucide-react';
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
  const [showFilters, setShowFilters] = useState(false);
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
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
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

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>

          {/* Agency Filter */}
          <div className="space-y-2">
            <Label>Imobiliária</Label>
            <Select
              value={filters.agencyId || 'all'}
              onValueChange={(v) => onFiltersChange({ ...filters, agencyId: v === 'all' ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {agencies?.map(agency => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.nome_fantasia || agency.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Filter */}
          <div className="space-y-2">
            <Label>Período (Criação)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
          </div>

          {/* State Filter */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={filters.state || 'all'}
              onValueChange={(v) => onFiltersChange({ ...filters, state: v === 'all' ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City Filter */}
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              placeholder="Nome da cidade"
              value={filters.city || ''}
              onChange={(e) => onFiltersChange({ ...filters, city: e.target.value || undefined })}
            />
          </div>

          {/* Rent Range */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Faixa de Aluguel</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Mín"
                value={filters.minRent || ''}
                onChange={(e) => onFiltersChange({ ...filters, minRent: e.target.value ? Number(e.target.value) : undefined })}
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="number"
                placeholder="Máx"
                value={filters.maxRent || ''}
                onChange={(e) => onFiltersChange({ ...filters, maxRent: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
