import { AlertTriangle, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgencyPath } from "@/hooks/useAgencyPath";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BillingBlockedBannerProps {
  className?: string;
}

export function BillingBlockedBanner({ className }: BillingBlockedBannerProps) {
  const navigate = useNavigate();
  const { agencyPath } = useAgencyPath();

  return (
    <div
      className={cn(
        "bg-destructive text-destructive-foreground rounded-lg p-4 flex items-center gap-4",
        className
      )}
    >
      <AlertTriangle className="h-6 w-6 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">Acesso Bloqueado por Inadimplência</p>
        <p className="text-sm opacity-90">
          Sua imobiliária possui faturas em atraso há mais de 72 horas. Novas análises, acionamentos de garantia e renovações estão temporariamente bloqueados.
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigate(agencyPath("/invoices"))}
        className="flex-shrink-0 gap-2"
      >
        <CreditCard className="h-4 w-4" />
        Ver Faturas
      </Button>
    </div>
  );
}
