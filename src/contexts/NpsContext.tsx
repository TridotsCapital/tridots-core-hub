import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePendingNpsSurveys, useSubmitNpsSurvey, PendingSurvey } from "@/hooks/useNpsSurveys";
import { NpsModal } from "@/components/agency/NpsModal";
import { useToast } from "@/hooks/use-toast";

const NPS_CACHE_KEY = "pending_nps_agency";

interface NpsContextType {
  pendingSurveys: PendingSurvey[];
  isLoading: boolean;
  hasPendingNps: boolean;
  showNpsModal: () => void;
  refreshPendingSurveys: () => Promise<void>;
  openModalAfterClose: () => Promise<void>;
}

const NpsContext = createContext<NpsContextType | undefined>(undefined);

// Default values for when NPS is not available (e.g., internal portal)
const defaultNpsContext: NpsContextType = {
  pendingSurveys: [],
  isLoading: false,
  hasPendingNps: false,
  showNpsModal: () => {},
  refreshPendingSurveys: async () => {},
  openModalAfterClose: async () => {},
};

export function useNps() {
  const context = useContext(NpsContext);
  // Return default values if not within NpsProvider (e.g., internal portal)
  if (!context) {
    return defaultNpsContext;
  }
  return context;
}

interface NpsProviderProps {
  children: ReactNode;
  agencyId: string | null;
}

export function NpsProvider({ children, agencyId }: NpsProviderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  
  // Anti-flicker: Check localStorage for cached state
  const [initialHasPending] = useState(() => {
    if (typeof window === "undefined") return false;
    const cached = localStorage.getItem(NPS_CACHE_KEY);
    if (!cached) return false;
    try {
      const data = JSON.parse(cached);
      // Expire cache after 1 hour
      if (Date.now() - data.timestamp > 3600000) {
        localStorage.removeItem(NPS_CACHE_KEY);
        return false;
      }
      return data.agencyId === agencyId && data.count > 0;
    } catch {
      return false;
    }
  });

  const {
    data: pendingSurveys = [],
    isLoading,
    refetch,
  } = usePendingNpsSurveys(agencyId || undefined);

  const submitSurvey = useSubmitNpsSurvey();

  // Update localStorage when surveys change
  useEffect(() => {
    if (!isLoading && agencyId) {
      if (pendingSurveys.length > 0) {
        localStorage.setItem(
          NPS_CACHE_KEY,
          JSON.stringify({
            agencyId,
            count: pendingSurveys.length,
            timestamp: Date.now(),
          })
        );
      } else {
        localStorage.removeItem(NPS_CACHE_KEY);
      }
    }
  }, [pendingSurveys, isLoading, agencyId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!agencyId) return;

    const channel = supabase
      .channel("nps-surveys-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "satisfaction_surveys",
          filter: `agency_id=eq.${agencyId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, refetch]);

  const hasPendingNps = isLoading ? initialHasPending : pendingSurveys.length > 0;

  const showNpsModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const refreshPendingSurveys = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Trigger modal after ticket close - waits for survey to be created
  const openModalAfterClose = useCallback(async () => {
    await refetch();
    // Small delay to ensure trigger has created the survey
    setTimeout(() => {
      setModalOpen(true);
    }, 300);
  }, [refetch]);

  const handleSubmitSurvey = async (surveyId: string, rating: number, comment?: string) => {
    if (!user) return;

    try {
      await submitSurvey.mutateAsync({
        surveyId,
        rating,
        comment,
        userId: user.id,
      });
      toast({
        title: "Avaliação enviada",
        description: "Obrigado pelo seu feedback!",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar avaliação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <NpsContext.Provider
      value={{
        pendingSurveys,
        isLoading,
        hasPendingNps,
        showNpsModal,
        refreshPendingSurveys,
        openModalAfterClose,
      }}
    >
      {children}
      <NpsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        surveys={pendingSurveys}
        onSubmit={handleSubmitSurvey}
        isSubmitting={submitSurvey.isPending}
      />
    </NpsContext.Provider>
  );
}
