import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, PartyPopper } from 'lucide-react';
import logoTridots from '@/assets/logo-tridots-black.webp';

export default function AcceptanceSuccess() {
  const { token } = useParams<{ token: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <img src={logoTridots} alt="Tridots Capital" className="h-10 mx-auto" />
          </div>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-success" />
              <PartyPopper className="h-8 w-8 text-warning absolute -top-2 -right-2 rotate-12" />
            </div>
          </div>
          <CardTitle className="text-2xl text-success">Pagamento Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sua garantia locatícia foi ativada com sucesso. A imobiliária será notificada para finalizar os documentos.
          </p>
          
          <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-left">
            <p className="text-sm font-medium text-success mb-2">Próximos passos:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• A imobiliária entrará em contato para assinatura do contrato</li>
              <li>• Você receberá um e-mail de confirmação</li>
              <li>• Parcelas serão cobradas mensalmente no cartão cadastrado</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground pt-4">
            Você pode fechar esta janela com segurança.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
