import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink 
} from 'lucide-react';
import { useTicketsByAnalysis, useCreateTicket } from '@/hooks/useTickets';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalysisTicketSectionProps {
  analysisId: string;
  agencyId?: string;
  tenantName?: string;
  isAgencyPortal?: boolean;
}

const TICKET_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
  em_atendimento: { label: 'Em Atendimento', color: 'bg-amber-100 text-amber-800', icon: Clock },
  aguardando_cliente: { label: 'Aguardando Resposta', color: 'bg-purple-100 text-purple-800', icon: Clock },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

const formSchema = z.object({
  subject: z.string().min(5, "O assunto deve ter no mínimo 5 caracteres"),
  category: z.enum(["financeiro", "tecnico", "comercial", "urgente"] as const),
  priority: z.enum(["baixa", "media", "alta"] as const),
  description: z.string().max(1000, "Máximo de 1000 caracteres").optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AnalysisTicketSection({ 
  analysisId, 
  agencyId, 
  tenantName, 
  isAgencyPortal = false 
}: AnalysisTicketSectionProps) {
  const navigate = useNavigate();
  const { data: tickets = [], isLoading } = useTicketsByAnalysis(analysisId);
  const createTicket = useCreateTicket();
  const [newTicketOpen, setNewTicketOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: `Dúvida sobre análise - ${tenantName || ''}`,
      category: "tecnico",
      priority: "media",
      description: "",
    },
  });

  const handleViewTicket = (ticketId: string) => {
    if (isAgencyPortal) {
      navigate('/agency/support', { state: { ticketId } });
    } else {
      navigate('/tickets', { state: { ticketId } });
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!agencyId) return;
    
    await createTicket.mutateAsync({
      agency_id: agencyId,
      analysis_id: analysisId,
      subject: data.subject,
      category: data.category,
      priority: data.priority,
      description: data.description,
    });
    form.reset();
    setNewTicketOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="font-semibold">Chamados</span>
          {tickets.length > 0 && (
            <Badge variant="secondary">{tickets.length}</Badge>
          )}
        </div>
        {agencyId && (
          <Button size="sm" onClick={() => setNewTicketOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Chamado
          </Button>
        )}
      </div>

      {/* Tickets list */}
      <ScrollArea className="flex-1 p-4">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Nenhum chamado vinculado
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Abra um chamado para tirar dúvidas ou solicitar suporte sobre esta análise.
            </p>
            {agencyId && (
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-4"
                onClick={() => setNewTicketOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Abrir Chamado
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const statusConfig = TICKET_STATUS_CONFIG[ticket.status] || TICKET_STATUS_CONFIG.aberto;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={ticket.id}
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewTicket(ticket.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{ticket.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Badge className={`${statusConfig.color} text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* New Ticket Sheet */}
      <Sheet open={newTicketOpen} onOpenChange={setNewTicketOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Novo Chamado</SheetTitle>
            <SheetDescription>
              Abra um chamado relacionado à análise de {tenantName || 'inquilino'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Descreva brevemente o problema" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="financeiro">Financeiro</SelectItem>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                            <SelectItem value="comercial">Comercial</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o problema com mais detalhes (opcional)"
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewTicketOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTicket.isPending}>
                    {createTicket.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Abrir Chamado
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
