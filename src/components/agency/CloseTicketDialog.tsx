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

interface CloseTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  ticketSubject?: string;
}

export function CloseTicketDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  ticketSubject,
}: CloseTicketDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar Chamado</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja encerrar este chamado?
            {ticketSubject && (
              <span className="block mt-2 font-medium text-foreground">
                "{ticketSubject}"
              </span>
            )}
            <span className="block mt-2">
              Após o encerramento, você precisará avaliar o atendimento antes de abrir novos chamados.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Encerrando...
              </>
            ) : (
              "Sim, encerrar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
