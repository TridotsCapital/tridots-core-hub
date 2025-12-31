import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Clock, 
  Search, 
  CheckCircle, 
  CreditCard, 
  FileCheck,
  XCircle
} from "lucide-react";

interface AgencyMiniKanbanProps {
  analysesByStatus: Record<string, number>;
}

const statusConfig = [
  { 
    key: 'pendente', 
    label: 'Pendente', 
    icon: Clock, 
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  { 
    key: 'em_analise', 
    label: 'Em Análise', 
    icon: Search, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  { 
    key: 'aprovada', 
    label: 'Aprovada', 
    icon: CheckCircle, 
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  { 
    key: 'aguardando_pagamento', 
    label: 'Aguardando Pgto', 
    icon: CreditCard, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  { 
    key: 'ativo', 
    label: 'Ativo', 
    icon: FileCheck, 
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30'
  },
  { 
    key: 'reprovada', 
    label: 'Reprovada', 
    icon: XCircle, 
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
];

export function AgencyMiniKanban({ analysesByStatus }: AgencyMiniKanbanProps) {
  const navigate = useNavigate();

  const handleStatusClick = (status: string) => {
    navigate(`/agency/analyses?status=${status}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funil de Análises</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statusConfig.map((status) => {
            const count = analysesByStatus[status.key] || 0;
            const Icon = status.icon;
            
            return (
              <button
                key={status.key}
                onClick={() => handleStatusClick(status.key)}
                className={`p-4 rounded-lg border-2 ${status.borderColor} ${status.bgColor} hover:shadow-md transition-all text-center group`}
              >
                <Icon className={`h-5 w-5 ${status.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                <p className={`text-2xl font-bold ${status.color}`}>{count}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {status.label}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
