import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, ArrowRight } from "lucide-react";
import { useClaimHistory } from "@/hooks/useClaimHistory";
import { claimPublicStatusConfig, claimInternalStatusConfig } from "@/types/claims";

interface ClaimHistorySectionProps {
  claimId: string;
}

export function ClaimHistorySection({ claimId }: ClaimHistorySectionProps) {
  const { data: history, isLoading } = useClaimHistory(claimId);

  const getStatusLabel = (statusType: string, status: string) => {
    if (statusType === 'public') {
      return claimPublicStatusConfig[status as keyof typeof claimPublicStatusConfig]?.label || status;
    }
    return claimInternalStatusConfig[status as keyof typeof claimInternalStatusConfig]?.label || status;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Alterações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history && history.length > 0 ? (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div 
                key={entry.id} 
                className={`flex items-start gap-4 p-4 rounded-lg bg-muted/30 ${
                  index === 0 ? 'border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {entry.old_status 
                        ? getStatusLabel(entry.status_type, entry.old_status)
                        : 'Criado'
                      }
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {getStatusLabel(entry.status_type, entry.new_status)}
                    </span>
                    {entry.status_type === 'internal' && (
                      <span className="text-xs text-muted-foreground">(interno)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{entry.changer?.full_name || 'Sistema'}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {entry.observations && (
                    <p className="mt-2 text-sm text-muted-foreground">{entry.observations}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma alteração registrada ainda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
