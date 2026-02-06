import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CancelInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  onSuccess: () => void;
}

export function CancelInvoiceDialog({
  open,
  onOpenChange,
  invoiceId,
  onSuccess,
}: CancelInvoiceDialogProps) {
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      // First, release all invoice items (set invoice_item_id to null on installments)
      const { data: items } = await supabase
        .from("invoice_items")
        .select("installment_id")
        .eq("invoice_id", invoiceId);

      if (items && items.length > 0) {
        const installmentIds = items
          .map((item) => item.installment_id)
          .filter(Boolean);

        if (installmentIds.length > 0) {
          await supabase
            .from("guarantee_installments")
            .update({ invoice_item_id: null })
            .in("id", installmentIds);
        }
      }

      // Delete invoice items
      await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);

      // Update invoice status to canceled
      const { error } = await supabase
        .from("agency_invoices")
        .update({
          status: "cancelada",
          canceled_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (error) throw error;

      toast({
        title: "Fatura cancelada",
        description:
          "A fatura foi cancelada e as parcelas foram liberadas para novo faturamento",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Cancel error:", error);
      toast({
        title: "Erro ao cancelar fatura",
        description: error.message || "Ocorreu um erro ao processar a solicitação",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar Fatura</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja cancelar esta fatura? As parcelas serão
            liberadas e poderão ser incluídas em uma nova fatura.
            <br />
            <br />
            <strong>Esta ação não pode ser desfeita.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCanceling}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isCanceling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCanceling ? "Cancelando..." : "Confirmar Cancelamento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
