import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRequestRenewal } from '@/hooks/useContractRenewal';
import { Loader2, CalendarSync, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/validators';

interface ContractRenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: {
    id: string;
    data_fim_contrato: string | null;
    analysis: {
      valor_aluguel: number;
      valor_condominio: number | null;
      valor_iptu: number | null;
      valor_outros_encargos: number | null;
      taxa_garantia_percentual: number;
    };
  };
}

export function ContractRenewalModal({ open, onOpenChange, contract }: ContractRenewalModalProps) {
  const { mutate: requestRenewal, isPending } = useRequestRenewal();
  
  const [values, setValues] = useState({
    new_valor_aluguel: contract.analysis.valor_aluguel,
    new_valor_condominio: contract.analysis.valor_condominio || 0,
    new_valor_iptu: contract.analysis.valor_iptu || 0,
    new_valor_outros_encargos: contract.analysis.valor_outros_encargos || 0,
    new_taxa_garantia_percentual: contract.analysis.taxa_garantia_percentual
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    requestRenewal({
      contract_id: contract.id,
      new_valor_aluguel: values.new_valor_aluguel,
      new_valor_condominio: values.new_valor_condominio,
      new_valor_iptu: values.new_valor_iptu,
      new_valor_outros_encargos: values.new_valor_outros_encargos,
      new_taxa_garantia_percentual: values.new_taxa_garantia_percentual,
      old_valor_aluguel: contract.analysis.valor_aluguel,
      old_valor_condominio: contract.analysis.valor_condominio,
      old_valor_iptu: contract.analysis.valor_iptu,
      old_valor_outros_encargos: contract.analysis.valor_outros_encargos,
      old_taxa_garantia_percentual: contract.analysis.taxa_garantia_percentual,
      old_data_fim_contrato: contract.data_fim_contrato
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const newTotal = values.new_valor_aluguel + values.new_valor_condominio + values.new_valor_iptu + values.new_valor_outros_encargos;
  const oldTotal = contract.analysis.valor_aluguel + (contract.analysis.valor_condominio || 0) + (contract.analysis.valor_iptu || 0) + (contract.analysis.valor_outros_encargos || 0);
  const variation = ((newTotal - oldTotal) / oldTotal * 100).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarSync className="h-5 w-5 text-primary" />
            Solicitar Renovação de Contrato
          </DialogTitle>
          <DialogDescription>
            Informe os novos valores para a renovação. A GarantFácil analisará sua solicitação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current values info */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Info className="h-4 w-4" />
              <span>Valores atuais</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span>Aluguel: {formatCurrency(contract.analysis.valor_aluguel)}</span>
              <span>Condomínio: {formatCurrency(contract.analysis.valor_condominio || 0)}</span>
              <span>IPTU: {formatCurrency(contract.analysis.valor_iptu || 0)}</span>
              <span>Outros: {formatCurrency(contract.analysis.valor_outros_encargos || 0)}</span>
            </div>
          </div>

          {/* New values form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new_valor_aluguel">Novo Valor Aluguel *</Label>
              <Input
                id="new_valor_aluguel"
                type="number"
                step="0.01"
                min="0"
                required
                value={values.new_valor_aluguel}
                onChange={(e) => setValues(v => ({ ...v, new_valor_aluguel: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new_valor_condominio">Novo Condomínio</Label>
              <Input
                id="new_valor_condominio"
                type="number"
                step="0.01"
                min="0"
                value={values.new_valor_condominio}
                onChange={(e) => setValues(v => ({ ...v, new_valor_condominio: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new_valor_iptu">Novo IPTU</Label>
              <Input
                id="new_valor_iptu"
                type="number"
                step="0.01"
                min="0"
                value={values.new_valor_iptu}
                onChange={(e) => setValues(v => ({ ...v, new_valor_iptu: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new_valor_outros">Outros Encargos</Label>
              <Input
                id="new_valor_outros"
                type="number"
                step="0.01"
                min="0"
                value={values.new_valor_outros_encargos}
                onChange={(e) => setValues(v => ({ ...v, new_valor_outros_encargos: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_taxa">Nova Taxa de Garantia (%)</Label>
            <Input
              id="new_taxa"
              type="number"
              step="0.1"
              min="1"
              max="20"
              value={values.new_taxa_garantia_percentual}
              onChange={(e) => setValues(v => ({ ...v, new_taxa_garantia_percentual: parseFloat(e.target.value) || 8 }))}
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg border p-3 bg-primary/5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Novo Total Garantido:</span>
              <span className="text-lg font-bold">{formatCurrency(newTotal)}</span>
            </div>
            {Number(variation) !== 0 && (
              <div className="flex justify-end">
                <span className={`text-xs ${Number(variation) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(variation) > 0 ? '+' : ''}{variation}% em relação ao atual
                </span>
              </div>
            )}
          </div>

          {/* Info message */}
          <p className="text-xs text-muted-foreground">
            A renovação será analisada pela equipe GarantFácil. Você receberá uma notificação sobre o resultado.
            Renovações são <strong>isentas de taxa de setup</strong>.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Solicitar Renovação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
