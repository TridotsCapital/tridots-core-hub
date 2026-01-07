import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Construction, 
  ArrowLeft, 
  History, 
  TrendingUp, 
  LineChart, 
  FileSpreadsheet, 
  Wallet 
} from "lucide-react";

const features = [
  {
    icon: History,
    title: "Histórico Completo",
    description: "Visualize todo o histórico de comissões recebidas e pendentes"
  },
  {
    icon: LineChart,
    title: "Gráficos de Evolução",
    description: "Acompanhe a evolução mensal dos seus ganhos com gráficos interativos"
  },
  {
    icon: TrendingUp,
    title: "Projeções Futuras",
    description: "Veja projeções de rendimentos baseadas no seu portfólio atual"
  },
  {
    icon: FileSpreadsheet,
    title: "Relatórios Financeiros",
    description: "Exporte relatórios detalhados para sua contabilidade"
  },
  {
    icon: Wallet,
    title: "Solicitação de Saques",
    description: "Solicite saques dos valores disponíveis diretamente pela plataforma"
  }
];

export default function AgencyCommissions() {
  const navigate = useNavigate();

  return (
    <AgencyLayout 
      title="Comissões" 
      description="Acompanhe e gerencie suas comissões"
    >
      <div className="flex flex-col items-center justify-center py-12 space-y-8">
        {/* Construction Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-full border border-primary/20">
            <Construction className="h-16 w-16 text-primary animate-bounce" />
          </div>
        </div>

        {/* Title and Message */}
        <div className="text-center space-y-3 max-w-lg">
          <h2 className="text-2xl font-bold text-foreground">
            Módulo de Comissões em Construção
          </h2>
          <p className="text-muted-foreground">
            Estamos trabalhando para trazer esta funcionalidade em breve. 
            Enquanto isso, acompanhe suas comissões pelo Dashboard.
          </p>
        </div>

        {/* Features Preview */}
        <div className="w-full max-w-3xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Em breve você poderá:
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-muted/30 border-dashed border-muted-foreground/20 hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-foreground">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => navigate('/agency')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>
    </AgencyLayout>
  );
}