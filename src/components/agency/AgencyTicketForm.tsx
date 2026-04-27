import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { useCreateTicket } from "@/hooks/useTickets";
import { TicketCategory, TicketPriority } from "@/types/tickets";
import { useAgencyStatus } from "@/components/layout/AgencyLayout";
import { useNps } from "@/contexts/NpsContext";

const formSchema = z.object({
  subject: z.string().min(5, "O assunto deve ter no mínimo 5 caracteres"),
  category: z.enum(["financeiro", "tecnico", "comercial", "urgente"] as const),
  priority: z.enum(["baixa", "media", "alta"] as const),
  description: z.string().max(1000, "Máximo de 1000 caracteres").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AgencyTicketFormProps {
  agencyId: string;
}

const categoryLabels: Record<TicketCategory, string> = {
  financeiro: "Financeiro",
  tecnico: "Técnico",
  comercial: "Comercial",
  urgente: "Urgente",
  solicitacao_link: "Solicitação de Link",
};

const priorityLabels: Record<TicketPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export function AgencyTicketForm({ agencyId }: AgencyTicketFormProps) {
  const [open, setOpen] = useState(false);
  const createTicket = useCreateTicket();
  const { isAgencyActive } = useAgencyStatus();
  const { hasPendingNps, showNpsModal } = useNps();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      category: "tecnico",
      priority: "media",
      description: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    await createTicket.mutateAsync({
      agency_id: agencyId,
      subject: data.subject,
      category: data.category,
      priority: data.priority,
      description: data.description,
    });
    form.reset();
    setOpen(false);
  };

  if (!isAgencyActive) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button className="gap-2" disabled>
              <Plus className="h-4 w-4" />
              Novo Chamado
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Disponível após aprovação do cadastro</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (hasPendingNps) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="gap-2" variant="outline" onClick={showNpsModal}>
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Novo Chamado
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Avalie seus chamados anteriores para abrir novos</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Chamado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Abrir Novo Chamado</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para abrir um chamado para a equipe GarantFácil.
          </DialogDescription>
        </DialogHeader>

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
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
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
                        {Object.entries(priorityLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
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
                onClick={() => setOpen(false)}
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
      </DialogContent>
    </Dialog>
  );
}
