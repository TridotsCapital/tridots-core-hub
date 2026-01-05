import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, PartyPopper, ExternalLink } from 'lucide-react';
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
          <CardTitle className="text-2xl text-success">Tudo Certo!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Sua garantia locatícia foi solicitada com sucesso. Agora é só aguardar!
          </p>
          
          <div className="rounded-lg bg-muted/50 border p-4 text-left">
            <p className="text-sm font-medium mb-3">Próximos passos:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>A Tridots irá validar seus pagamentos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Você receberá um e-mail de confirmação</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>A imobiliária será notificada para finalizar os documentos</span>
              </li>
            </ul>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={() => window.open('https://www.tridotscapital.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Conhecer a Tridots Capital
          </Button>

          <p className="text-xs text-muted-foreground pt-2">
            Você pode fechar esta janela com segurança.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
