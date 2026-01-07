import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Plus, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { useTicketsByClaimId, useCreateTicket } from '@/hooks/useTickets';
import { ticketStatusConfig, ticketPriorityConfig, TicketCategory, TicketPriority } from '@/types/tickets';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Claim } from '@/types/claims';

interface InternalClaimTicketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: Claim;
}

export function InternalClaimTicketSheet({ open, onOpenChange, claim }: InternalClaimTicketSheetProps) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('financeiro');
  const [priority, setPriority] = useState<TicketPriority>('media');

  const { data: tickets, isLoading } = useTicketsByClaimId(claim.id);
  const createTicket = useCreateTicket();

  const handleCreateTicket = async () => {
    if (!subject.trim()) return;

    await createTicket.mutateAsync({
      agency_id: claim.agency_id,
      claim_id: claim.id,
      subject,
      description: description || undefined,
      category,
      priority,
    });

    setShowForm(false);
    setSubject('');
    setDescription('');
    setCategory('financeiro');
    setPriority('media');
  };

  const handleOpenTicket = (ticketId: string) => {
    onOpenChange(false);
    navigate('/tickets', { state: { ticketId } });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Chamados do Sinistro
          </SheetTitle>
          <SheetDescription>
            {claim.contract?.analysis?.inquilino_nome} • {claim.agency?.nome_fantasia}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* New Ticket Button */}
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Novo Chamado
            </Button>
          )}

          {/* New Ticket Form */}
          {showForm && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  placeholder="Assunto do chamado"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o chamado..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateTicket}
                  disabled={!subject.trim() || createTicket.isPending}
                  className="flex-1"
                >
                  {createTicket.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Criar Chamado
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Existing Tickets List */}
          <div>
            <h4 className="text-sm font-medium mb-3">
              Chamados vinculados ({tickets?.length || 0})
            </h4>

            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.map((ticket) => {
                    const statusConfig = ticketStatusConfig[ticket.status];
                    const priorityConfig = ticketPriorityConfig[ticket.priority];
                    return (
                      <div
                        key={ticket.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleOpenTicket(ticket.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              #{ticket.id.slice(0, 8).toUpperCase()} •{' '}
                              {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                          <span className={`text-xs ${priorityConfig.color}`}>
                            {priorityConfig.icon} {priorityConfig.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum chamado vinculado a este sinistro.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
