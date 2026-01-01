import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { TicketDetail } from "./TicketDetail";

interface TicketDetailSheetProps {
  ticketId: string | null;
  onClose: () => void;
}

export function TicketDetailSheet({ ticketId, onClose }: TicketDetailSheetProps) {
  const isOpen = !!ticketId;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-[800px] p-0">
        {ticketId ? (
          <TicketDetail ticketId={ticketId} onClose={onClose} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
