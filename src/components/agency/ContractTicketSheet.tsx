import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTicket } from "@/hooks/useTickets";
import { TicketCategory, TicketPriority, ticketCategoryConfig, ticketPriorityConfig } from "@/types/tickets";
import { CheckCircle, Loader2, Send } from "lucide-react";

interface ContractTicketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  agencyId: string;
  contractRef: string;
  tenantName?: string;
}

export function ContractTicketSheet({
  open,
  onOpenChange,
  analysisId,
  agencyId,
  contractRef,
  tenantName,
}: ContractTicketSheetProps) {
  const navigate = useNavigate();
  const createTicket = useCreateTicket();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [subject, setSubject] = useState(`Contrato ${contractRef}`);
  const [category, setCategory] = useState<TicketCategory>("tecnico");
  const [priority, setPriority] = useState<TicketPriority>("media");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    await createTicket.mutateAsync({
      agency_id: agencyId,
      analysis_id: analysisId,
      subject,
      category,
      priority,
      description: description || undefined,
    });
    setShowSuccess(true);
  };

  const handleClose = () => {
    setShowSuccess(false);
    onOpenChange(false);
    // Reset form
    setSubject(`Contrato ${contractRef}`);
    setCategory("tecnico");
    setPriority("media");
    setDescription("");
  };

  const handleViewTickets = () => {
    handleClose();
    navigate('/agency/support');
  };

  if (showSuccess) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="flex flex-col items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-semibold">Chamado Aberto!</h3>
            <p className="text-muted-foreground mt-2 max-w-[280px]">
              Seu chamado foi registrado e vinculado ao contrato {contractRef}
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handleViewTickets}>
                Ver Chamados
              </Button>
              <Button onClick={handleClose}>
                Continuar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Abrir Chamado</SheetTitle>
          <SheetDescription>
            Vinculado ao contrato {contractRef}
            {tenantName && ` • ${tenantName}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Descreva brevemente o assunto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ticketCategoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
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
                  {Object.entries(ticketPriorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema ou dúvida..."
              rows={4}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={createTicket.isPending || !subject.trim()}
          >
            {createTicket.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar Chamado
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
