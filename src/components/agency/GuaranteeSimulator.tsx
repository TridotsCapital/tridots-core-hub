import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, ArrowRight, TrendingUp } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput, SETUP_FEE_OPTIONS } from '@/lib/validators';

interface GuaranteeSimulatorProps {
  onStartAnalysis: (values: SimulatorValues) => void;
  initialValues?: Partial<SimulatorValues>;
}

export interface SimulatorValues {
  aluguel: number;
  condominio: number;
  iptu: number;
  taxaGarantia: number;
  setupFee: number;
}

export function GuaranteeSimulator({ onStartAnalysis, initialValues }: GuaranteeSimulatorProps) {
  const [aluguelInput, setAluguelInput] = useState(
    initialValues?.aluguel ? formatCurrencyInput((initialValues.aluguel * 100).toString()) : ''
  );
  const [condominioInput, setCondominioInput] = useState(
    initialValues?.condominio ? formatCurrencyInput((initialValues.condominio * 100).toString()) : ''
  );
  const [iptuInput, setIptuInput] = useState(
    initialValues?.iptu ? formatCurrencyInput((initialValues.iptu * 100).toString()) : ''
  );
  const [taxaGarantia, setTaxaGarantia] = useState(initialValues?.taxaGarantia || 8);
  const [setupFee, setSetupFee] = useState<number | null>(
    initialValues?.setupFee !== undefined ? initialValues.setupFee : null
  );

  const aluguel = parseCurrencyInput(aluguelInput);
  const condominio = parseCurrencyInput(condominioInput);
  const iptu = parseCurrencyInput(iptuInput);

  // Calculations
  const totalEncargos = aluguel + condominio + iptu;
  const taxaMensal = totalEncargos * (taxaGarantia / 100);
  const custoMensalTotal = totalEncargos + taxaMensal;

  const handleCurrencyInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const formatted = formatCurrencyInput(value);
    setter(formatted);
  };

  const handleStartAnalysis = () => {
    if (setupFee === null) return;
    onStartAnalysis({
      aluguel,
      condominio,
      iptu,
      taxaGarantia,
      setupFee,
    });
  };

  const isValid = aluguel > 0 && iptu > 0 && setupFee !== null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Simulador de Garantia</CardTitle>
            <CardDescription>
              Calcule os custos para o inquilino antes de iniciar a análise
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="aluguel">Valor do Aluguel *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="aluguel"
                value={aluguelInput}
                onChange={(e) => handleCurrencyInput(e.target.value, setAluguelInput)}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condominio">Condomínio</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="condominio"
                value={condominioInput}
                onChange={(e) => handleCurrencyInput(e.target.value, setCondominioInput)}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iptu">IPTU Mensal *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="iptu"
                value={iptuInput}
                onChange={(e) => handleCurrencyInput(e.target.value, setIptuInput)}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Taxa de Garantia Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Taxa de Garantia</Label>
            <span className="text-lg font-semibold text-primary">{taxaGarantia}%</span>
          </div>
          <Slider
            value={[taxaGarantia]}
            onValueChange={([value]) => setTaxaGarantia(value)}
            min={10}
            max={15}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10%</span>
            <span>15%</span>
          </div>
        </div>

        {/* Setup Fee Select */}
        <div className="space-y-2">
          <Label htmlFor="setupFee">Taxa de Setup *</Label>
          <Select 
            value={setupFee !== null ? setupFee.toString() : undefined} 
            onValueChange={(v) => setSetupFee(Number(v))}
          >
            <SelectTrigger id="setupFee">
              <SelectValue placeholder="Selecione o valor" />
            </SelectTrigger>
            <SelectContent>
              {SETUP_FEE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isValid && (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Custos para o Inquilino
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de Encargos</span>
                <span>{formatCurrency(totalEncargos)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa Mensal Tridots ({taxaGarantia}%)</span>
                <span>{formatCurrency(taxaMensal)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between font-medium">
                <span>Custo Mensal Total</span>
                <span className="text-primary">{formatCurrency(custoMensalTotal)}</span>
              </div>
              {setupFee !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Setup Fee (único)</span>
                  <span>{formatCurrency(setupFee)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Start Analysis Button */}
        <Button
          onClick={handleStartAnalysis}
          disabled={!isValid}
          className="w-full"
          size="lg"
        >
          Iniciar Análise
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
