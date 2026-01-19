import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, CreditCard, QrCode, Sparkles, Lock, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export type PaymentMethod = 'pix' | 'card_1x' | 'card_2x' | 'card_3x' | 'card_4x' | 'card_5x' | 'card_6x' | 'card_7x' | 'card_8x' | 'card_9x' | 'card_10x' | 'card_11x' | 'card_12x';

export type PaymentOption = PaymentMethod;

interface PaymentOptionItem {
  id: PaymentMethod | 'boleto_imobiliaria';
  label: string;
  description: string;
  value: number;
  discount?: number;
  highlighted?: boolean;
  blocked?: boolean;
}

interface PaymentOptionsDisplayProps {
  garantiaAnual: number;
  descontoPix: number;
  formaEscolhida?: PaymentMethod;
  onSelect?: (forma: PaymentMethod) => void;
  readOnly?: boolean;
  compact?: boolean;
  showAllByDefault?: boolean;
  agencyId?: string;
}

export function PaymentOptionsDisplay({
  garantiaAnual,
  descontoPix,
  formaEscolhida,
  onSelect,
  readOnly = false,
  compact = false,
  showAllByDefault = false,
  agencyId,
}: PaymentOptionsDisplayProps) {
  const [showAll, setShowAll] = useState(showAllByDefault);
  const { toast } = useToast();

  const pixValue = garantiaAnual * (1 - descontoPix / 100);

  const handleBlockedOptionClick = async () => {
    // Log interest in the blocked option
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('payment_option_interest_clicks').insert({
        agency_id: agencyId || null,
        user_id: user?.id || null,
        option_key: 'boleto_imobiliaria',
      });
    } catch (error) {
      console.error('Error logging interest click:', error);
    }

    toast({
      title: "Em breve!",
      description: "Esta opção de pagamento estará disponível em breve. Registramos seu interesse!",
    });
  };

  const allOptions: PaymentOptionItem[] = [
    // Blocked option first
    {
      id: 'boleto_imobiliaria',
      label: 'Pagamento via Imobiliária',
      description: 'Boleto Mensal Unificado',
      value: 0,
      blocked: true,
    },
    // PIX option
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

  // Filter out blocked options for visible options
  const selectableOptions = allOptions.filter(opt => !opt.blocked);

  const visibleOptions = compact && !showAll 
    ? [allOptions[0], allOptions[1], allOptions[2], allOptions[13]] // Blocked, PIX, 1x, 12x
    : allOptions;

  const selectedOption = selectableOptions.find(opt => opt.id === formaEscolhida);

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
        {visibleOptions.map((option) => {
          // Render blocked option differently
          if (option.blocked) {
            return (
              <div
                key={option.id}
                onClick={handleBlockedOptionClick}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all',
                  'border-orange-400 bg-orange-50 dark:bg-orange-950/20',
                  'hover:bg-orange-100 dark:hover:bg-orange-950/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-orange-400 flex items-center justify-center">
                    <Lock className="h-2.5 w-2.5 text-orange-500" />
                  </div>
                  <Building2 className="h-4 w-4 text-orange-600" />
                  <div>
                    <span className="font-medium text-orange-700 dark:text-orange-400">{option.label}</span>
                    <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 text-xs">
                      Em Breve
                    </Badge>
                  </div>
                </div>
                <span className="text-sm text-orange-600 dark:text-orange-400">{option.description}</span>
              </div>
            );
          }

          return (
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
          );
        })}
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