import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/validators';

interface PayerInfoCardProps {
  payerIsTenant: boolean | null;
  payerName?: string | null;
  payerCpf?: string | null;
  payerEmail?: string | null;
  payerPhone?: string | null;
  payerAddress?: string | null;
  payerNumber?: string | null;
  payerComplement?: string | null;
  payerNeighborhood?: string | null;
  payerCity?: string | null;
  payerState?: string | null;
  payerCep?: string | null;
}

export function PayerInfoCard({
  payerIsTenant,
  payerName,
  payerCpf,
  payerEmail,
  payerPhone,
  payerAddress,
  payerNumber,
  payerComplement,
  payerNeighborhood,
  payerCity,
  payerState,
  payerCep,
}: PayerInfoCardProps) {
  // Only show if payer is different from tenant
  if (payerIsTenant !== false || !payerName) {
    return null;
  }

  const fullAddress = [
    payerAddress,
    payerNumber,
    payerComplement,
    payerNeighborhood,
    payerCity && payerState ? `${payerCity} - ${payerState}` : payerCity || payerState,
    payerCep,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <User className="h-4 w-4" />
          Responsável pelo Pagamento
        </CardTitle>
        <p className="text-xs text-amber-600 dark:text-amber-500">
          O pagador é diferente do inquilino
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Nome</p>
            <p className="font-medium">{payerName}</p>
          </div>
          {payerCpf && (
            <div>
              <p className="text-xs text-muted-foreground">CPF</p>
              <p className="font-medium">{formatCPF(payerCpf)}</p>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {payerEmail && (
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="text-sm">{payerEmail}</p>
              </div>
            </div>
          )}
          {payerPhone && (
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm">{formatPhone(payerPhone)}</p>
              </div>
            </div>
          )}
        </div>

        {fullAddress && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Endereço</p>
              <p className="text-sm">{fullAddress}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
