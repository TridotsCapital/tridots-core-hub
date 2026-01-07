import { useState } from 'react';
import { FileText, Info, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'contrato',
    label: 'Contrato de locação',
    description: 'Cópia do contrato assinado entre as partes',
    required: true,
  },
  {
    id: 'boletos',
    label: 'Boletos vencidos',
    description: 'Comprovantes dos valores em atraso',
    required: true,
  },
  {
    id: 'notificacao',
    label: 'Notificação extrajudicial',
    description: 'Se houver, anexe as notificações enviadas',
    required: false,
  },
  {
    id: 'chaves',
    label: 'Comprovante de entrega de chaves',
    description: 'Termo de entrega ou devolução do imóvel',
    required: false,
  },
  {
    id: 'vistoria',
    label: 'Laudo de vistoria',
    description: 'Relatório fotográfico do estado do imóvel',
    required: false,
  },
];

export function ClaimChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card className="bg-muted/30 border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          Documentos Recomendados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={cn(
              'flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors',
              'hover:bg-background/60',
              checked[item.id] && 'bg-background/40'
            )}
          >
            <div className="mt-0.5">
              {checked[item.id] ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'text-sm',
                    checked[item.id]
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  )}
                >
                  {item.label}
                </span>
                {item.required && (
                  <span className="text-[10px] text-orange-600 font-medium">
                    *
                  </span>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p className="text-xs">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-muted">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <p>
              Estes documentos agilizam a análise da garantia. A falta de alguns
              pode não impedir o envio, mas pode atrasar o processo.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
