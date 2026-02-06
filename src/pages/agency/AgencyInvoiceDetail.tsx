import { useParams } from "react-router-dom";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { useInvoiceDetail } from "@/hooks/useAgencyInvoices";
import { formatCurrency } from "@/lib/validators";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgencyPath } from "@/hooks/useAgencyPath";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusConfig = {
  rascunho: { label: "Rascunho", variant: "secondary" as const },
  gerada: { label: "Gerada", variant: "default" as const },
  enviada: { label: "Enviada", variant: "default" as const },
  atrasada: { label: "Atrasada", variant: "destructive" as const },
  paga: { label: "Paga", variant: "outline" as const },
  cancelada: { label: "Cancelada", variant: "secondary" as const },
};

export default function AgencyInvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { agencyPath } = useAgencyPath();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoiceDetail(invoiceId || "");

  if (isLoading || !invoice) {
    return (
      <AgencyLayout title="Detalhes da Fatura">
        <Skeleton className="h-screen w-full rounded-lg" />
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout title="Detalhes da Fatura">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(agencyPath("/invoices"))}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Fatura {invoice.reference_month}/{invoice.reference_year}
            </h1>
            <p className="text-muted-foreground mt-1">
              Vencimento: {format(new Date(invoice.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <Badge variant={statusConfig[invoice.status]?.variant || "default"} className="text-base px-3 py-1">
            {statusConfig[invoice.status]?.label || invoice.status}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(invoice.total_value)}</p>
            </CardContent>
          </Card>
          {invoice.paid_value && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(invoice.paid_value)}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Itens da Fatura</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.invoice_items && invoice.invoice_items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.tenant_name}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {item.property_address}
                    </TableCell>
                    <TableCell>{item.installment_number}/12</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.value)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        Faturada
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Timeline */}
        {invoice.invoice_timeline && invoice.invoice_timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.invoice_timeline.map((event: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {idx < invoice.invoice_timeline.length - 1 && (
                        <div className="w-0.5 h-12 bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">{event.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AgencyLayout>
  );
}
