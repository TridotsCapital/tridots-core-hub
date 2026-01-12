import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, CreditCard, QrCode, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export type PaymentMethod = 'pix' | 'card_1x' | 'card_2x' | 'card_3x' | 'card_4x' | 'card_5x' | 'card_6x' | 'card_7x' | 'card_8x' | 'card_9x' | 'card_10x' | 'card_11x' | 'card_12x';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
  value: number;
  discount?: number;
  highlighted?: boolean;
}

interface PaymentOptionsDisplayProps {
  garantiaAnual: number;
  descontoPix: number;
  formaEscolhida?: PaymentMethod;
  onSelect?: (forma: PaymentMethod) => void;
  readOnly?: boolean;
  compact?: boolean;
  showAllByDefault?: boolean;
}

export function PaymentOptionsDisplay({
  garantiaAnual,
  descontoPix,
  formaEscolhida,
  onSelect,
  readOnly = false,
  compact = false,
  showAllByDefault = false,
}: PaymentOptionsDisplayProps) {
  const [showAll, setShowAll] = useState(showAllByDefault);

  const pixValue = garantiaAnual * (1 - descontoPix / 100);

  const allOptions: PaymentOption[] = [
    {
      id: 'pix',
      label: 'PIX à vista',
      description: formatCurrency(pixValue),
      value: pixValue,
      discount: descontoPix,
      highlighted: true,
    },
    {
      id: 'card_1x',
      label: 'Cartão 1x',
      description: formatCurrency(garantiaAnual),
      value: garantiaAnual,
    },
    ...Array.from({ length: 11 }, (_, i) => {
      const parcelas = i + 2;
      const valorParcela = garantiaAnual / parcelas;
      return {
        id: `card_${parcelas}x` as PaymentMethod,
        label: `Cartão ${parcelas}x`,
        description: `${parcelas}x de ${formatCurrency(valorParcela)}`,
        value: valorParcela,
      };
    }),
  ];

  const visibleOptions = compact && !showAll 
    ? [allOptions[0], allOptions[1], allOptions[12]] // PIX, 1x, 12x
    : allOptions;

  const selectedOption = allOptions.find(opt => opt.id === formaEscolhida);

  if (readOnly && selectedOption) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Forma de Pagamento Escolhida</span>
          {selectedOption.discount && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Sparkles className="h-3 w-3 mr-1" />
              {selectedOption.discount}% OFF
            </Badge>
          )}
        </div>
        <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
          <div className="flex items-center gap-3">
            {selectedOption.id === 'pix' ? (
              <QrCode className="h-5 w-5 text-primary" />
            ) : (
              <CreditCard className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="font-semibold">{selectedOption.label}</p>
              <p className="text-sm text-muted-foreground">{selectedOption.description}</p>
              {selectedOption.id !== 'pix' && selectedOption.id !== 'card_1x' && (
                <p className="text-xs text-muted-foreground">(Total: {formatCurrency(garantiaAnual)})</p>
              )}
            </div>
          </div>
        </div>
        
        {compact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Ocultar opções
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver todas as opções
              </>
            )}
          </Button>
        )}
        
        {showAll && (
          <div className="space-y-2 mt-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground font-medium">Outras opções disponíveis:</p>
            <div className="grid gap-2">
              {allOptions.filter(opt => opt.id !== formaEscolhida).map((option) => (
                <div key={option.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                  <span className="flex items-center gap-2">
                    {option.id === 'pix' ? <QrCode className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
                    {option.label}
                    {option.discount && (
                      <Badge variant="outline" className="text-xs">
                        {option.discount}% OFF
                      </Badge>
                    )}
                  </span>
                  <span className="text-muted-foreground">{option.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Forma de Pagamento {!readOnly && '*'}</span>
        <span className="text-xs text-muted-foreground">Garantia Anual: {formatCurrency(garantiaAnual)}</span>
      </div>

      <RadioGroup
        value={formaEscolhida}
        onValueChange={(value) => onSelect?.(value as PaymentMethod)}
        disabled={readOnly}
        className="gap-2"
      >
        {visibleOptions.map((option) => (
          <Label
            key={option.id}
            htmlFor={option.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
              formaEscolhida === option.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              option.highlighted && 'border-green-500/50 bg-green-50 dark:bg-green-950/20',
              readOnly && 'cursor-default'
            )}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value={option.id} id={option.id} />
              {option.id === 'pix' ? (
                <QrCode className={cn('h-4 w-4', option.highlighted ? 'text-green-600' : 'text-muted-foreground')} />
              ) : (
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <span className="font-medium">{option.label}</span>
                {option.discount && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                    {option.discount}% OFF
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={cn('font-semibold', option.highlighted && 'text-green-600')}>
                {option.description}
              </span>
              {option.id !== 'pix' && option.id !== 'card_1x' && (
                <p className="text-xs text-muted-foreground">(Total: {formatCurrency(garantiaAnual)})</p>
              )}
            </div>
          </Label>
        ))}
      </RadioGroup>

      {compact && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full"
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          Ver mais opções de parcelamento
        </Button>
      )}

      {compact && showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(false)}
          className="w-full"
        >
          <ChevronUp className="h-4 w-4 mr-2" />
          Mostrar menos
        </Button>
      )}
    </div>
  );
}

export function getPaymentMethodLabel(method: PaymentMethod | string | null | undefined): string {
  if (!method) return 'Não definida';
  
  const labels: Record<string, string> = {
    pix: 'PIX à vista',
    card_1x: 'Cartão 1x',
    card_2x: 'Cartão 2x',
    card_3x: 'Cartão 3x',
    card_4x: 'Cartão 4x',
    card_5x: 'Cartão 5x',
    card_6x: 'Cartão 6x',
    card_7x: 'Cartão 7x',
    card_8x: 'Cartão 8x',
    card_9x: 'Cartão 9x',
    card_10x: 'Cartão 10x',
    card_11x: 'Cartão 11x',
    card_12x: 'Cartão 12x',
  };
  
  return labels[method] || method;
}
