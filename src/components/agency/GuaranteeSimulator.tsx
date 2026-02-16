import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calculator, ArrowRight, TrendingUp, Shield } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput, SETUP_FEE_OPTIONS } from '@/lib/validators';
import { PaymentOptionsDisplay } from '@/components/payment/PaymentOptionsDisplay';
import { PlanSelector } from './PlanSelector';
import { GUARANTEE_PLANS, type PlanType, getPlanByRate } from '@/lib/plans';
import { useCurrentAgencyId } from '@/hooks/useAgencyDashboard';

interface GuaranteeSimulatorProps {
  onStartAnalysis: (values: SimulatorValues) => void;
  initialValues?: Partial<SimulatorValues>;
  descontoPix?: number | null;
}

export interface SimulatorValues {
  aluguel: number;
  condominio: number;
  iptu: number;
  taxaGarantia: number;
  planoGarantia: PlanType;
  setupFee: number;
  formaPagamento: string;
}

export function GuaranteeSimulator({ onStartAnalysis, initialValues, descontoPix }: GuaranteeSimulatorProps) {
  const { data: currentAgencyId } = useCurrentAgencyId();
  const pixEnabled = descontoPix !== null && descontoPix !== undefined && descontoPix > 0;
  
  const [aluguelInput, setAluguelInput] = useState(
    initialValues?.aluguel ? formatCurrencyInput((initialValues.aluguel * 100).toString()) : ''
  );
  const [condominioInput, setCondominioInput] = useState(
    initialValues?.condominio ? formatCurrencyInput((initialValues.condominio * 100).toString()) : ''
  );
  const [iptuInput, setIptuInput] = useState(
    initialValues?.iptu ? formatCurrencyInput((initialValues.iptu * 100).toString()) : ''
  );
  const initialPlan = initialValues?.planoGarantia || (initialValues?.taxaGarantia ? getPlanByRate(initialValues.taxaGarantia) : 'start');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan);
  const [taxaGarantia, setTaxaGarantia] = useState(initialValues?.taxaGarantia || GUARANTEE_PLANS[initialPlan].minRate);
  const [setupFee, setSetupFee] = useState<number | null>(
    initialValues?.setupFee !== undefined ? initialValues.setupFee : null
  );
  const [formaPagamento, setFormaPagamento] = useState<string>('');

  const aluguel = parseCurrencyInput(aluguelInput);
  const condominio = parseCurrencyInput(condominioInput);
  const iptu = parseCurrencyInput(iptuInput);

  // Calculations
  const totalEncargos = aluguel + condominio + iptu;
  const LIMITE_VALOR_LOCATICIO = 4000;
  const excedeLimite = totalEncargos > LIMITE_VALOR_LOCATICIO;
  const taxaMensal = totalEncargos * (taxaGarantia / 100);
  const garantiaAnual = taxaMensal * 12;
  const custoMensalTotal = totalEncargos + taxaMensal;

  const handleCurrencyInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const formatted = formatCurrencyInput(value);
    setter(formatted);
  };

  const handlePlanChange = (plan: PlanType, rate: number) => {
    setSelectedPlan(plan);
    setTaxaGarantia(rate);
  };

  const handleStartAnalysis = () => {
    if (setupFee === null || !formaPagamento) return;
    onStartAnalysis({
      aluguel,
      condominio,
      iptu,
      taxaGarantia,
      planoGarantia: selectedPlan,
      setupFee,
      formaPagamento,
    });
  };

  const isValid = aluguel > 0 && setupFee !== null;
  const canStartAnalysis = isValid && formaPagamento !== '' && !excedeLimite;

  return (
    <div className="space-y-4">
      {/* Rental limit banner - above card */}
      {excedeLimite && (
        <Alert variant="destructive" className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            🚫 A Tridots Capital atende apenas locações de até R$ 4.000,00 de valor locatício mensal. 
            O total informado é de {totalEncargos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.
          </AlertDescription>
        </Alert>
      )}
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
            <Label htmlFor="iptu">IPTU Mensal</Label>
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

        {/* Plan Selector */}
        <PlanSelector
          valorLocaticioTotal={totalEncargos}
          selectedPlan={selectedPlan}
          selectedRate={taxaGarantia}
          onPlanChange={handlePlanChange}
          garantiaAnual={garantiaAnual}
        />

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

        {/* Results - Always visible */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          {/* Section 1: Tridots Guarantee Costs - HIGHLIGHTED */}
          <div className="bg-primary/10 -mx-4 -mt-4 px-4 pt-4 pb-3 rounded-t-lg border-b border-primary/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
              <Shield className="h-4 w-4" />
              Custos da Garantia Tridots
            </div>
            
            <div className="space-y-2">
              {/* Taxa Mensal - MAIN HIGHLIGHT */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Taxa Mensal Tridots ({taxaGarantia}%)</span>
                <span className="text-xl font-bold text-primary">
                  {isValid ? formatCurrency(taxaMensal) : 'R$ --'}
                </span>
              </div>
              
              {/* Garantia Anual */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Garantia Anual (12x)</span>
                <span className="font-semibold">
                  {isValid ? formatCurrency(garantiaAnual) : 'R$ --'}
                </span>
              </div>
              
              {/* Setup Fee */}
              {setupFee !== null && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Setup Fee (único)</span>
                  <span>{setupFee > 0 ? formatCurrency(setupFee) : 'Isenta'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Complementary Information - Less prominent */}
          <div className="pt-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <TrendingUp className="h-3 w-3" />
              Informações Complementares
            </div>
            
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Total de Encargos</span>
                <span>{isValid ? formatCurrency(totalEncargos) : 'R$ --'}</span>
              </div>
              <div className="flex justify-between">
                <span>Custo Mensal Total</span>
                <span>{isValid ? formatCurrency(custoMensalTotal) : 'R$ --'}</span>
              </div>
            </div>
          </div>

          {/* Payment Options (only if valid) */}
          {isValid && (
            <div className="pt-3 border-t">
              <PaymentOptionsDisplay
                garantiaAnual={garantiaAnual}
                descontoPix={descontoPix}
                formaEscolhida={formaPagamento as any}
                onSelect={setFormaPagamento}
                compact={true}
                agencyId={currentAgencyId || undefined}
              />
            </div>
          )}
        </div>

        {/* Start Analysis Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button
                  onClick={handleStartAnalysis}
                  disabled={!canStartAnalysis}
                  className="w-full"
                  size="lg"
                >
                  Iniciar Análise
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TooltipTrigger>
            {excedeLimite && (
              <TooltipContent side="top" className="max-w-xs text-center">
                <p>🔒 A Tridots Capital atende apenas locações de até R$ 4.000,00 de valor locatício mensal.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
    </div>
  );
}
