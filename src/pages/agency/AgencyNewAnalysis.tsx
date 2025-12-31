import { AgencyLayout } from "@/components/layout/AgencyLayout";

export default function AgencyNewAnalysis() {
  return (
    <AgencyLayout 
      title="Nova Análise" 
      description="Solicite uma nova análise de crédito"
    >
      <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">
          Formulário de nova análise em desenvolvimento...
        </p>
      </div>
    </AgencyLayout>
  );
}
