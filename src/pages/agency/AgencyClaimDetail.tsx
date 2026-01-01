import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { AgencyClaimDetailView } from "@/components/agency/claims/AgencyClaimDetailView";
import { useClaimDetail } from "@/hooks/useClaims";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MessageSquarePlus } from "lucide-react";
import { ClaimTicketSheet } from "@/components/agency/claims/ClaimTicketSheet";

export default function AgencyClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: claim, isLoading, refetch } = useClaimDetail(id);
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <AgencyLayout title="Detalhes do Sinistro">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AgencyLayout>
    );
  }

  if (!claim) {
    return (
      <AgencyLayout title="Sinistro não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            O sinistro solicitado não foi encontrado.
          </p>
          <Button onClick={() => navigate('/agency/claims')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Sinistros
          </Button>
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout 
      title={`Sinistro - ${claim.analysis?.inquilino_nome || 'Carregando...'}`}
      description={`Contrato: ${claim.analysis?.imovel_endereco || ''}, ${claim.analysis?.imovel_cidade || ''}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setTicketSheetOpen(true)}>
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Abrir Chamado
          </Button>
          <Button variant="ghost" onClick={() => navigate('/agency/claims')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      }
    >
      <AgencyClaimDetailView 
        claim={claim} 
        onUpdate={refetch}
      />

      <ClaimTicketSheet
        open={ticketSheetOpen}
        onOpenChange={setTicketSheetOpen}
        claim={claim}
      />
    </AgencyLayout>
  );
}
