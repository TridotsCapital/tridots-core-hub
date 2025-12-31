import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { AgencyContractDetail } from "@/components/agency/AgencyContractDetail";

export default function AgencyContractDetailPage() {
  return (
    <AgencyLayout 
      title="Detalhes do Contrato" 
      description="Visualize os detalhes completos"
    >
      <AgencyContractDetail />
    </AgencyLayout>
  );
}
