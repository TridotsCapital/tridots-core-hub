import { Badge } from '@/components/ui/badge';
import { CreditCard, QrCode, Sparkles } from 'lucide-react';

interface PaymentMethodDisplayProps {
  method: string | null | undefined;
  garantiaAnual: number;
  descontoPix?: number | null;
  showDiscount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function PaymentMethodDisplay({
  method,
  garantiaAnual,
  descontoPix,
  showDiscount = true,
  size = 'md',
}: PaymentMethodDisplayProps) {
  if (!method) return null;
  
  const pixDiscountValue = descontoPix ?? 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Handle PIX
  if (method === 'pix') {
    // If no discount, just show PIX without discount info
    if (pixDiscountValue === 0) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <QrCode className={`${iconSize[size]} text-primary shrink-0`} />
          <span className={`font-semibold ${sizeClasses[size]}`}>
            PIX: {formatCurrency(garantiaAnual)}
          </span>
        </div>
      );
    }
    
    const valorComDesconto = garantiaAnual * (1 - pixDiscountValue / 100);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <QrCode className={`${iconSize[size]} text-primary shrink-0`} />
        <span className={`font-semibold ${sizeClasses[size]}`}>
          PIX ({Math.round(pixDiscountValue)}% off): {formatCurrency(valorComDesconto)}
        </span>
        <span className="text-sm text-muted-foreground line-through">
          {formatCurrency(garantiaAnual)}
        </span>
        {showDiscount && pixDiscountValue > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Economia de {formatCurrency(garantiaAnual - valorComDesconto)}
          </Badge>
        )}
      </div>
    );
  }

  // Handle card payments (card_1x, card_3x, card_12x, etc.)
  const cardMatch = method.match(/card_(\d+)x/);
  if (cardMatch) {
    const parcelas = parseInt(cardMatch[1]);
    const valorParcela = garantiaAnual / parcelas;

    return (
      <div className="flex flex-wrap items-center gap-2">
        <CreditCard className={`${iconSize[size]} text-primary shrink-0`} />
        <span className={`font-semibold ${sizeClasses[size]}`}>
          {parcelas}x de {formatCurrency(valorParcela)}
        </span>
        {parcelas > 1 && (
          <span className="text-sm text-muted-foreground">
            (Total: {formatCurrency(garantiaAnual)})
          </span>
        )}
      </div>
    );
  }

  // Fallback for unknown payment methods
  return (
    <div className="flex items-center gap-2">
      <CreditCard className={`${iconSize[size]} text-muted-foreground shrink-0`} />
      <span className={`${sizeClasses[size]} text-muted-foreground`}>{method}</span>
    </div>
  );
}
