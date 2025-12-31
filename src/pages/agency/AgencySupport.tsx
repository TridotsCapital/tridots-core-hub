import { useState } from "react";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { AgencyTicketForm } from "@/components/agency/AgencyTicketForm";
import { AgencyTicketList } from "@/components/agency/AgencyTicketList";
import { AgencyTicketDetail } from "@/components/agency/AgencyTicketDetail";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { useAgencyTickets } from "@/hooks/useTickets";
import { Loader2 } from "lucide-react";

export default function AgencySupport() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { data: agencyUser, isLoading: agencyUserLoading } = useAgencyUser();
  const { data: tickets = [], isLoading: ticketsLoading } = useAgencyTickets(
    agencyUser?.agency_id
  );

  if (agencyUserLoading) {
    return (
      <AgencyLayout title="Suporte" description="Central de atendimento e tickets">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AgencyLayout>
    );
  }

  if (!agencyUser?.agency_id) {
    return (
      <AgencyLayout title="Suporte" description="Central de atendimento e tickets">
        <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">
            Você não está vinculado a nenhuma imobiliária.
          </p>
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout
      title="Suporte"
      description="Central de atendimento e tickets"
      actions={<AgencyTicketForm agencyId={agencyUser.agency_id} />}
    >
      <AgencyTicketList
        tickets={tickets}
        isLoading={ticketsLoading}
        onSelectTicket={setSelectedTicketId}
        selectedTicketId={selectedTicketId || undefined}
      />

      <AgencyTicketDetail
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </AgencyLayout>
  );
}
