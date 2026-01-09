import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, PartyPopper } from 'lucide-react';

export default function RenewalAcceptanceSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardContent className="pt-10 pb-10 space-y-6">
          <div className="relative inline-block">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            <PartyPopper className="h-8 w-8 text-amber-500 absolute -top-2 -right-2 animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-green-700">
              Renovação Aceita com Sucesso!
            </h1>
            <p className="text-muted-foreground">
              Seu contrato foi renovado. Você receberá um e-mail com a confirmação.
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Próximos passos:</h3>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• Sua imobiliária será notificada sobre o aceite</li>
              <li>• O novo contrato entrará em vigor na data de renovação</li>
              <li>• Mantenha seus pagamentos em dia</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Pode fechar esta janela.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
