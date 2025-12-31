import { AgencyLayout } from "@/components/layout/AgencyLayout";

export default function AgencyContracts() {
  return (
    <AgencyLayout 
      title="Meus Contratos" 
      description="Visualize seus contratos ativos de garantia locatícia"
    >
      <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">
          Página de contratos em desenvolvimento...
        </p>
      </div>
    </AgencyLayout>
  );
}
