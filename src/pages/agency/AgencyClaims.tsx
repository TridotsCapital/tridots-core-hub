import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AgencyLayout, useAgencyStatus } from "@/components/layout/AgencyLayout";
import { AgencyClaimList } from "@/components/agency/claims/AgencyClaimList";
import { AgencyClaimsKanban } from "@/components/agency/claims/AgencyClaimsKanban";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { useClaims } from "@/hooks/useClaims";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Loader2, List, LayoutGrid } from "lucide-react";

type ViewMode = 'list' | 'kanban';

export default function AgencyClaims() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAgencyActive } = useAgencyStatus();
  const { data: agencyUserData, isLoading: loadingAgency } = useAgencyUser();
  const agencyId = agencyUserData?.agency_id || null;
  const [autoOpenClaimId, setAutoOpenClaimId] = useState<string | null>(null);
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('tridots_claims_view_mode');
    return (saved as ViewMode) || 'kanban';
  });

  // Auto-open claim from notification
  useEffect(() => {
    const state = location.state as { claimId?: string } | null;
    if (state?.claimId) {
      setAutoOpenClaimId(state.claimId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const { data: claims, isLoading, refetch } = useClaims(
    agencyId ? { agencyId } : undefined
  );

  const handleViewModeChange = (value: string) => {
    if (value) {
      setViewMode(value as ViewMode);
      localStorage.setItem('tridots_claims_view_mode', value);
    }
  };

  if (loadingAgency) {
    return (
      <AgencyLayout 
        title="Garantias Solicitadas" 
        description="Gerencie suas solicitações de garantia"
      >
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout 
      title="Garantias Solicitadas" 
      description="Gerencie suas solicitações de garantia"
      actions={
        <div className="flex items-center gap-3">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={handleViewModeChange}
            className="bg-muted rounded-lg p-1"
          >
            <ToggleGroupItem value="kanban" aria-label="Kanban view" className="h-8 px-3">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" className="h-8 px-3">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {isAgencyActive ? (
            <Button onClick={() => navigate('/agency/claims/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Solicitar Garantia
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled>
                      <Plus className="h-4 w-4 mr-2" />
                      Solicitar Garantia
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Disponível após aprovação do cadastro</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      }
    >
      {viewMode === 'kanban' ? (
        <AgencyClaimsKanban 
          claims={claims || []} 
          onRefresh={refetch}
        />
      ) : (
        <AgencyClaimList 
          claims={claims || []} 
          isLoading={isLoading}
          onRefresh={refetch}
          autoOpenClaimId={autoOpenClaimId}
          onAutoOpenHandled={() => setAutoOpenClaimId(null)}
        />
      )}
    </AgencyLayout>
  );
}