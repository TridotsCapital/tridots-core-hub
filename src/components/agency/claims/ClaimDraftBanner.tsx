import { useNavigate } from 'react-router-dom';
import { FileWarning, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAgencyPath } from '@/hooks/useAgencyPath';

interface ClaimDraftBannerProps {
  lastSavedTime: string | null;
  onDiscard: () => void;
}

export function ClaimDraftBanner({ lastSavedTime, onDiscard }: ClaimDraftBannerProps) {
  const navigate = useNavigate();
  const { agencyPath } = useAgencyPath();

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <FileWarning className="h-5 w-5 text-orange-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">
              Você tem uma solicitação de garantia em andamento
            </p>
            {lastSavedTime && (
              <p className="text-sm text-muted-foreground">
                Última edição às {lastSavedTime}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(agencyPath('/claims/new'))}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Continuar
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
