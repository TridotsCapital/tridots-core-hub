import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { useAgencyInvoices } from "@/hooks/useAgencyInvoices";
import { useAgencyInvoiceExports } from "@/hooks/useAgencyInvoiceExports";
import { formatCurrency } from "@/lib/validators";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Eye, FileJson } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgencyPath } from "@/hooks/useAgencyPath";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  rascunho: { label: "Rascunho", variant: "secondary" as const },
  gerada: { label: "Gerada", variant: "default" as const },
  enviada: { label: "Enviada", variant: "default" as const },
  atrasada: { label: "Atrasada", variant: "destructive" as const },
  paga: { label: "Paga", variant: "outline" as const },
  cancelada: { label: "Cancelada", variant: "secondary" as const },
};

export default function AgencyInvoices() {
  const { agencyPath } = useAgencyPath();
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useAgencyInvoices();
  const { isExporting, exportInvoice } = useAgencyInvoiceExports();

  const handleViewDetails = (invoiceId: string) => {
    navigate(agencyPath(`/invoices/${invoiceId}`));
  };

  const handleExportPDF = async (invoiceId: string) => {
    await exportInvoice({ format: 'pdf', invoiceId });
  };

  const handleExportExcel = async (invoiceId: string) => {
    await exportInvoice({ format: 'excel', invoiceId });
  };

  return (
    <AgencyLayout
      title="Minhas Faturas"
      description="Acompanhe suas faturas de garantia"
    >
      <div className="space-y-6">
        {/* Alerts */}
        {invoices?.some(inv => inv.status === "atrasada") && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Fatura em atraso</p>
              <p className="text-sm text-red-800">Você possui faturas vencidas. Por favor, regularize o pagamento.</p>
            </div>
          </div>
        )}

        {/* Invoices List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </>
          ) : invoices && invoices.length > 0 ? (
            invoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {invoice.reference_month}/{invoice.reference_year}
                        </span>
                        <Badge variant={statusConfig[invoice.status]?.variant || "default"}>
                          {statusConfig[invoice.status]?.label || invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {format(new Date(invoice.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(invoice.total_value)}</p>
                        {invoice.paid_value && (
                          <p className="text-xs text-muted-foreground">
                            Pago: {formatCurrency(invoice.paid_value)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPDF(invoice.id)}
                          disabled={isExporting}
                          title="Baixar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportExcel(invoice.id)}
                          disabled={isExporting}
                          title="Baixar Excel"
                        >
                          <FileJson className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(invoice.id)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhuma fatura encontrada.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AgencyLayout>
  );
}
