import { AgencyLayout } from "@/components/layout/AgencyLayout";

export default function AgencySupport() {
  return (
    <AgencyLayout 
      title="Suporte" 
      description="Central de atendimento e tickets"
    >
      <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">
          Página de suporte em desenvolvimento...
        </p>
      </div>
    </AgencyLayout>
  );
}
