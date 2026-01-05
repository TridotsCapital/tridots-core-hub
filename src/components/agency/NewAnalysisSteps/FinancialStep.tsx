import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { SETUP_FEE_OPTIONS, formatCurrency } from '@/lib/validators';
import { Settings, TrendingUp } from 'lucide-react';

interface FinancialStepProps {
  form: UseFormReturn<any>;
}

export function FinancialStep({ form }: FinancialStepProps) {
  const taxaGarantia = form.watch('taxaGarantiaPercentual') || 10;
  const setupFee = form.watch('setupFee') || 100;
  const valorAluguel = form.watch('valorAluguel') || 0;
  const valorCondominio = form.watch('valorCondominio') || 0;
  const valorIptu = form.watch('valorIptu') || 0;

  // Calculations
  const totalEncargos = valorAluguel + valorCondominio + valorIptu;
  const taxaMensal = totalEncargos * (taxaGarantia / 100);
  const custoMensalTotal = totalEncargos + taxaMensal;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <Settings className="h-5 w-5 text-primary" />
        Configuração Financeira
      </div>

      {/* Taxa de Garantia */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FormLabel>Taxa de Garantia</FormLabel>
          <span className="text-lg font-semibold text-primary">{taxaGarantia}%</span>
        </div>
        <FormField
          control={form.control}
          name="taxaGarantiaPercentual"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Slider
                  value={[field.value || 10]}
                  onValueChange={([value]) => field.onChange(value)}
                  min={10}
                  max={15}
                  step={0.5}
                  className="w-full"
                />
              </FormControl>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>15%</span>
              </div>
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa Mensal ({taxaGarantia}%)</span>
              <span>{formatCurrency(taxaMensal)}</span>
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
