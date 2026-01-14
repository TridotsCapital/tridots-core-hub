import { Home } from 'lucide-react';

const formatCurrency = (value: number | null) =>
  value !== null
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : '-';

interface ComposicaoAnaliseCardProps {
  valorAluguel: number;
  valorCondominio: number | null;
  valorIptu: number | null;
  valorOutrosEncargos?: number | null;
}

export function ComposicaoAnaliseCard({
  valorAluguel,
  valorCondominio,
  valorIptu,
  valorOutrosEncargos,
}: ComposicaoAnaliseCardProps) {
  const valorTotal = valorAluguel + (valorCondominio || 0) + (valorIptu || 0) + (valorOutrosEncargos || 0);

  return (
    <div className="rounded-lg border p-4">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Home className="h-4 w-4 text-muted-foreground" />
        Composição da Análise
      </h4>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Aluguel</span>
          <span>{formatCurrency(valorAluguel)}</span>
        </div>
        
        {(valorCondominio !== null && valorCondominio > 0) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Condomínio</span>
            <span>{formatCurrency(valorCondominio)}</span>
          </div>
        )}
        
        {(valorIptu !== null && valorIptu > 0) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IPTU</span>
            <span>{formatCurrency(valorIptu)}</span>
          </div>
        )}
        
        {(valorOutrosEncargos !== null && valorOutrosEncargos !== undefined && valorOutrosEncargos > 0) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Outros Encargos</span>
            <span>{formatCurrency(valorOutrosEncargos)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm pt-2 border-t">
          <span className="font-medium">Valor Total</span>
          <span className="font-semibold">
            {formatCurrency(valorTotal)}
            <span className="text-muted-foreground font-normal"> /mês</span>
          </span>
        </div>
      </div>
    </div>
  );
}
