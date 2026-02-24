import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/contexts/ImpersonationContext";

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedAgencyName, impersonatedAgencyId, stopImpersonation } =
    useImpersonation();

  if (!isImpersonating) return null;

  const handleBackToPanel = () => {
    stopImpersonation();
    // Navigate to the agency detail page in the internal portal
    window.location.href = `/agencies/${impersonatedAgencyId}`;
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-600 px-4 py-2 text-white shadow-md">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 shrink-0" />
        <span>
          Você está acessando como suporte Tridots —{" "}
          <strong>{impersonatedAgencyName}</strong>
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="shrink-0 gap-1.5 bg-white/20 text-white hover:bg-white/30 border-0"
        onClick={handleBackToPanel}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao Painel
      </Button>
    </div>
  );
}
