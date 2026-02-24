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
import { Shield } from "lucide-react";

interface ImpersonationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyName: string;
  onConfirm: () => void;
}

export function ImpersonationConfirmDialog({
  open,
  onOpenChange,
  agencyName,
  onConfirm,
}: ImpersonationConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Ação em nome da imobiliária
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está agindo como suporte em nome de{" "}
            <strong>{agencyName}</strong>. Esta ação será registrada nos logs.
            Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirmar e Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
