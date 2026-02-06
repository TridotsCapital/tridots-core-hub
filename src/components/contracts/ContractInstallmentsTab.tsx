import { useContractInstallments } from "@/hooks/useContractInstallments";
import { formatCurrency } from "@/lib/validators";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertCircle, Ban } from "lucide-react";

interface ContractInstallmentsTabProps {
  contractId: string;
}

const statusConfig = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    className: "bg-muted text-muted-foreground",
    dotColor: "bg-muted-foreground",
  },
  faturada: {
    label: "Faturada",
    icon: AlertCircle,
    className: "bg-blue-100 text-blue-800",
    dotColor: "bg-blue-500",
  },
  paga: {
    label: "Paga",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800",
    dotColor: "bg-green-500",
  },
  cancelada: {
    label: "Cancelada",
    icon: Ban,
    className: "bg-red-100 text-red-800",
    dotColor: "bg-red-500",
  },
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function ContractInstallmentsTab({ contractId }: ContractInstallmentsTabProps) {
  const { data: installments, isLoading } = useContractInstallments(contractId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!installments || installments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma parcela encontrada para este contrato.</p>
        <p className="text-sm mt-1">
          As parcelas são geradas quando o contrato utiliza pagamento via Boleto Unificado.
        </p>
      </div>
    );
  }

  const paidCount = installments.filter(i => i.status === 'paga').length;
  const totalValue = installments.reduce((sum, i) => sum + i.value, 0);
  const paidValue = installments.filter(i => i.status === 'paga').reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{paidCount}/{installments.length}</p>
          <p className="text-xs text-muted-foreground">Parcelas pagas</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{formatCurrency(paidValue)}</p>
          <p className="text-xs text-muted-foreground">Valor pago</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{formatCurrency(totalValue - paidValue)}</p>
          <p className="text-xs text-muted-foreground">Restante</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {installments.map((installment, index) => {
          const config = statusConfig[installment.status] || statusConfig.pendente;
          const StatusIcon = config.icon;
          const isLast = index === installments.length - 1;
          const monthName = MONTH_NAMES[installment.reference_month - 1];

          return (
            <div key={installment.id} className="flex gap-4">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${config.dotColor} z-10`} />
                {!isLast && (
                  <div className="w-0.5 h-full bg-border -mt-0.5" style={{ minHeight: '60px' }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-semibold">{installment.installment_number}/12</p>
                      <p className="text-xs text-muted-foreground">
                        {monthName.substring(0, 3)}/{installment.reference_year}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <p className="font-medium">{formatCurrency(installment.value)}</p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {format(new Date(installment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={config.className}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </div>

                {installment.paid_at && (
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Pago em: {format(new Date(installment.paid_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
