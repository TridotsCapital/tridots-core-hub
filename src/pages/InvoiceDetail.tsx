import { useParams, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useInvoiceDetail, useInvoiceTimeline } from '@/hooks/useAgencyInvoices';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Download, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InvoicePaymentModal from '@/components/invoices/InvoicePaymentModal';
import InvoiceTimelineView from '@/components/invoices/InvoiceTimelineView';
import { useState } from 'react';

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  gerada: 'Gerada',
  enviada: 'Enviada',
  atrasada: 'Atrasada',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(searchParams.get('tab') === 'payment');

  const { data: invoice, isLoading } = useInvoiceDetail(invoiceId || null);
  const { data: timeline } = useInvoiceTimeline(invoiceId || '');

  if (isLoading) {
    return (
      <DashboardLayout title="Carregando..." description="">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando fatura...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout title="Fatura não encontrada" description="">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Fatura não encontrada</p>
        </div>
      </DashboardLayout>
    );
  }

  const items = invoice.invoice_items || [];
  const invoiceValue = invoice.adjusted_value || invoice.total_value || 0;

  return (
    <DashboardLayout
      title={`Fatura ${invoice.reference_month.toString().padStart(2, '0')}/${invoice.reference_year}`}
      description={invoice.agencies?.razao_social}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/financial/invoices')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
            {(invoice as any).boleto_url && (
              <Button variant="outline" size="sm" onClick={() => window.open((invoice as any).boleto_url, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Boleto
              </Button>
            )}
            {invoice.status === 'rascunho' && (
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            )}
          </div>
        </div>

        {/* Resumo da Fatura */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-2">Status</p>
            <Badge className="text-base">{statusLabels[invoice.status]}</Badge>
          </div>
          <div className="bg-background rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-2">Vencimento</p>
            <p className="text-lg font-semibold">
              {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="bg-background rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-2">Valor Total</p>
            <p className="text-lg font-semibold text-primary">R$ {invoiceValue.toFixed(2)}</p>
          </div>
          <div className="bg-background rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-2">Valor Pago</p>
            <p className="text-lg font-semibold">
              R$ {(invoice.paid_value || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Abas */}
        <Tabs defaultValue="items" className="bg-background rounded-lg border p-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Itens ({items.length})</TabsTrigger>
            <TabsTrigger value="timeline">Histórico</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-6 space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum item na fatura
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map(item => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{item.contract_id.slice(0, 8)}</TableCell>
                      <TableCell>{item.tenant_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.property_address}</TableCell>
                      <TableCell>{item.installment_number}/12</TableCell>
                      <TableCell className="text-right font-semibold">R$ {item.value.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            {timeline && <InvoiceTimelineView events={timeline} />}
          </TabsContent>

          <TabsContent value="details" className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Imobiliária</p>
                <p className="font-semibold">{invoice.agencies?.razao_social}</p>
                <p className="text-sm text-muted-foreground">{invoice.agencies?.cnpj}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p>{invoice.agencies?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data de Criação</p>
                <p>{format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
                <p>{format(new Date(invoice.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
            </div>

            {invoice.status === 'paga' && (
              <div className="bg-primary/5 rounded-lg border border-primary/20 p-4 space-y-2">
                <p className="font-semibold">Informações de Pagamento</p>
                <p className="text-sm"><strong>Data:</strong> {format(new Date(invoice.paid_at!), 'dd/MM/yyyy', { locale: ptBR })}</p>
                <p className="text-sm"><strong>Valor Pago:</strong> R$ {(invoice.paid_value || 0).toFixed(2)}</p>
                {invoice.payment_notes && <p className="text-sm"><strong>Observações:</strong> {invoice.payment_notes}</p>}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Ação: Registrar Pagamento */}
        {['rascunho', 'gerada', 'enviada', 'atrasada'].includes(invoice.status) && (
          <div className="flex justify-end">
            <Button size="lg" onClick={() => setShowPaymentModal(true)}>
              Registrar Pagamento
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && (
        <InvoicePaymentModal
          invoiceId={invoice.id}
          invoiceValue={invoiceValue}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
