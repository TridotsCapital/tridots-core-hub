import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SETUP_FEE_OPTIONS, formatCurrency } from '@/lib/validators';
import { Settings, TrendingUp, Wallet } from 'lucide-react';
import { PaymentOptionsDisplay, PaymentOption } from '@/components/payment/PaymentOptionsDisplay';
import { PlanSelector } from '@/components/agency/PlanSelector';
import { getPlanByRate, GUARANTEE_PLANS, type PlanType } from '@/lib/plans';

interface FinancialStepProps {
  form: UseFormReturn<any>;
  descontoPix?: number | null;
}

export function FinancialStep({ form, descontoPix }: FinancialStepProps) {
  const pixEnabled = descontoPix !== null && descontoPix !== undefined && descontoPix > 0;
  const taxaGarantia = form.watch('taxaGarantiaPercentual') || 10;
  const planoGarantia = form.watch('planoGarantia') as PlanType | null;
  const setupFee = form.watch('setupFee') || 100;
  const valorAluguel = form.watch('valorAluguel') || 0;
  const valorCondominio = form.watch('valorCondominio') || 0;
  const valorIptu = form.watch('valorIptu') || 0;
  const formaPagamentoPreferida = form.watch('formaPagamentoPreferida');

  // Calculations
  const totalEncargos = valorAluguel + valorCondominio + valorIptu;
  const taxaMensal = totalEncargos * (taxaGarantia / 100);
  const garantiaAnual = taxaMensal * 12;
  const custoMensalTotal = totalEncargos + taxaMensal;

  // Derive plan from rate if not set
  const currentPlan = planoGarantia || getPlanByRate(taxaGarantia);

  const handlePlanChange = (plan: PlanType, rate: number) => {
    form.setValue('planoGarantia', plan, { shouldValidate: true });
    form.setValue('taxaGarantiaPercentual', rate, { shouldValidate: true });
  };

  const handlePaymentOptionSelect = (option: PaymentOption) => {
    form.setValue('formaPagamentoPreferida', option, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <Settings className="h-5 w-5 text-primary" />
        Configuração Financeira
      </div>

      {/* Plan Selection */}
      <div className="space-y-3">
        <FormLabel>Plano de Garantia *</FormLabel>
        <FormField
          control={form.control}
          name="planoGarantia"
          render={() => (
            <FormItem>
              <FormControl>
                <PlanSelector
                  valorLocaticioTotal={totalEncargos}
                  selectedPlan={currentPlan}
                  selectedRate={taxaGarantia}
                  onPlanChange={handlePlanChange}
                  garantiaAnual={garantiaAnual}
                  showCommission={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Setup Fee */}
      <FormField
        control={form.control}
        name="setupFee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Taxa de Setup</FormLabel>
            <Select
              value={field.value?.toString() || '100'}
              onValueChange={(v) => field.onChange(Number(v))}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o valor" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SETUP_FEE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Calculations Preview */}
      {valorAluguel > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-primary" />
            Resumo dos Custos (Inquilino)
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de Encargos</span>
              <span>{formatCurrency(totalEncargos)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                Taxa Mensal ({taxaGarantia}%)
                <Badge className="bg-primary text-primary-foreground text-xs">
                  <Wallet className="h-3 w-3 mr-1" />
                  Valor do Inquilino
                </Badge>
              </span>
              <span className="font-semibold text-primary">{formatCurrency(taxaMensal)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between font-medium">
              <span>Custo Mensal Total</span>
              <span className="text-primary">{formatCurrency(custoMensalTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Setup Fee (único)</span>
              <span>{formatCurrency(setupFee)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Option Selection */}
      {valorAluguel > 0 && (
        <FormField
          control={form.control}
          name="formaPagamentoPreferida"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento Preferida *</FormLabel>
              <FormControl>
                <PaymentOptionsDisplay
                  garantiaAnual={garantiaAnual}
                  descontoPix={descontoPix}
                  formaEscolhida={field.value}
                  onSelect={handlePaymentOptionSelect}
                  compact={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Observations */}
      <FormField
        control={form.control}
        name="observacoes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Observações</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Informações adicionais sobre a análise (opcional)"
                rows={4}
                maxLength={500}
              />
            </FormControl>
            <div className="text-xs text-muted-foreground text-right">
              {field.value?.length || 0}/500 caracteres
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
