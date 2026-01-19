import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { AgencyLayout, useAgencyStatus } from "@/components/layout/AgencyLayout";
import { useSubdomain } from "@/contexts/SubdomainContext";
import { AgencyKanbanBoard } from "@/components/agency/AgencyKanbanBoard";
import { AgencyAnalysisList } from "@/components/agency/AgencyAnalysisList";
import { useAgencyAnalyses } from "@/hooks/useAgencyAnalyses";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, LayoutGrid, List } from "lucide-react";
import { AnalysisStatus, statusConfig } from "@/types/database";
import { useQueryClient } from "@tanstack/react-query";
import { useUnreadItemIds } from "@/hooks/useUnreadItemIds";

type ViewMode = "kanban" | "table";

const VIEW_MODE_KEY = "agency-analyses-view-mode";

export default function AgencyAnalyses() {
  const location = useLocation();
  const { isAgencyPortal } = useSubdomain();
  const { isAgencyActive, isAgencyStatusLoading } = useAgencyStatus();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved as ViewMode) || "kanban";
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AnalysisStatus | "all">("all");
  const [unreadFilter, setUnreadFilter] = useState<"all" | "unread">("all");
  const [autoOpenAnalysisId, setAutoOpenAnalysisId] = useState<string | null>(null);
  const { data: unreadIds } = useUnreadItemIds();

  const { data: analyses = [], isLoading, refetch } = useAgencyAnalyses({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Auto-open analysis from notification
  useEffect(() => {
    const state = location.state as { analysisId?: string } | null;
    if (state?.analysisId) {
      setAutoOpenAnalysisId(state.analysisId);
      // Clear state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const handleViewModeChange = (value: string) => {
    if (value === "kanban" || value === "table") {
      setViewMode(value);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Map analyses to the format expected by AgencyContractList, applying unread filter
  const mappedAnalyses = useMemo(() => {
    let filtered = analyses;
    
    // Filter by unread
    if (unreadFilter === "unread" && unreadIds?.analises) {
      filtered = analyses.filter(a => unreadIds.analises.has(a.id));
    }
    
    return filtered.map((a) => ({
      id: a.id,
      inquilino_nome: a.inquilino_nome,
      inquilino_cpf: a.inquilino_cpf,
      status: a.status,
      valor_aluguel: a.valor_aluguel,
      valor_total: a.valor_total,
      created_at: a.created_at,
      approved_at: a.approved_at,
    }));
  }, [analyses, unreadFilter, unreadIds]);

  return (
    <AgencyLayout 
      title="Minhas Análises" 
      description="Acompanhe o status das suas solicitações de análise de crédito"
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou endereço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as AnalysisStatus | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Unread Filter */}
            <Select
              value={unreadFilter}
              onValueChange={(value) => setUnreadFilter(value as "all" | "unread")}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Leitura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unread">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    Não lidos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 items-center w-full sm:w-auto justify-between sm:justify-end">
            {/* View Toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={handleViewModeChange}
              className="border rounded-lg"
            >
              <ToggleGroupItem value="kanban" aria-label="Visualização Kanban">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Visualização em tabela">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            {/* New Analysis Button */}
            {isAgencyActive && !isAgencyStatusLoading ? (
              <Button asChild>
                <Link to={isAgencyPortal ? "/analyses/new" : "/agency/analyses/new"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Análise
                </Link>
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button disabled>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Análise
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Disponível após aprovação do cadastro</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Content */}
        {viewMode === "kanban" ? (
          <AgencyKanbanBoard 
            analyses={unreadFilter === "unread" && unreadIds?.analises 
              ? analyses.filter(a => unreadIds.analises.has(a.id))
              : analyses
            } 
            isLoading={isLoading} 
            autoOpenAnalysisId={autoOpenAnalysisId}
            onAutoOpenHandled={() => setAutoOpenAnalysisId(null)}
          />
        ) : (
          <AgencyAnalysisList 
            analyses={mappedAnalyses} 
            isLoading={isLoading} 
            onRefresh={handleRefresh} 
          />
        )}
      </div>
    </AgencyLayout>
  );
}
