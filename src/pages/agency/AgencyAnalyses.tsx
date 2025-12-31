import { AgencyLayout } from "@/components/layout/AgencyLayout";

export default function AgencyAnalyses() {
  return (
    <AgencyLayout 
      title="Minhas Análises" 
      description="Gerencie suas solicitações de análise de crédito"
    >
      <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">
          Página de análises em desenvolvimento...
        </p>
      </div>
    </AgencyLayout>
  );
}
