import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgencies } from "@/hooks/useAgencies";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TicketStatus, TicketCategory, TicketPriority, ticketStatusConfig, ticketCategoryConfig, ticketPriorityConfig } from "@/types/tickets";
import { Filter } from "lucide-react";

interface TicketFiltersProps {
  filters: {
    status?: TicketStatus | 'all';
    category?: TicketCategory | 'all';
    priority?: TicketPriority | 'all';
    agency_id?: string;
    assigned_to?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function TicketFilters({ filters, onFiltersChange }: TicketFiltersProps) {
  const { data: agencies } = useAgencies();
  
  const { data: analysts } = useQuery({
    queryKey: ["analysts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          user_roles!inner(role)
        `)
        .eq("active", true);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">Filtros:</span>

      <Select
        value={filters.status || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Status</SelectItem>
          {Object.entries(ticketStatusConfig).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, category: value })}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Categorias</SelectItem>
          {Object.entries(ticketCategoryConfig).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, priority: value })}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {Object.entries(ticketPriorityConfig).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.icon} {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.agency_id || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, agency_id: value })}
      >
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue placeholder="Imobiliária" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Imobiliárias</SelectItem>
          {agencies?.map((agency) => (
            <SelectItem key={agency.id} value={agency.id}>
              {agency.nome_fantasia || agency.razao_social}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.assigned_to || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, assigned_to: value })}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Analista" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Analistas</SelectItem>
          {analysts?.map((analyst) => (
            <SelectItem key={analyst.id} value={analyst.id}>
              {analyst.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
