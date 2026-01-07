import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, FileWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNps } from "@/contexts/NpsContext";
import type { Claim } from "@/types/claims";

const formSchema = z.object({
  subject: z.string().min(5, 'O assunto deve ter pelo menos 5 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  category: z.string().min(1, 'Selecione uma categoria'),
});

type FormValues = z.infer<typeof formSchema>;

interface ClaimTicketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: Claim;
}

export function ClaimTicketSheet({ open, onOpenChange, claim }: ClaimTicketSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasPendingNps, showNpsModal } = useNps();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If has pending NPS and sheet opens, show NPS modal instead
  useEffect(() => {
    if (open && hasPendingNps) {
      onOpenChange(false);
      showNpsModal();
    }
  }, [open, hasPendingNps, showNpsModal, onOpenChange]);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      description: '',
      category: 'financeiro',
    },
  });

  useEffect(() => {
    const fetchAgencyId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('agency_users')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();
      if (data) setAgencyId(data.agency_id);
    };
    fetchAgencyId();
  }, [user]);

  const onSubmit = async (values: FormValues) => {
    if (!user || !agencyId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .insert([{
          subject: values.subject,
          description: values.description,
          category: values.category as 'financeiro' | 'tecnico' | 'comercial' | 'urgente',
          agency_id: agencyId,
          created_by: user.id,
          claim_id: claim.id,
        }]);

      if (error) throw error;

      toast({
        title: 'Chamado criado',
        description: 'Seu chamado foi enviado com sucesso.',
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar chamado',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>Abrir Chamado</SheetTitle>
          <SheetDescription>
            Este chamado será vinculado ao sinistro selecionado
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
          <FileWarning className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Sinistro vinculado</p>
            <p className="text-xs text-muted-foreground">
              {claim.contract?.analysis?.inquilino_nome} - {claim.contract?.analysis?.imovel_endereco}
            </p>
          </div>
          <Badge variant="secondary">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(claim.total_claimed_value)}
          </Badge>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
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
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva brevemente o assunto..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhe sua solicitação..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Chamado'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
