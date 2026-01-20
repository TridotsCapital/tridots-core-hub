import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileWarning, ArrowRight } from 'lucide-react';
import { useAgencyPath } from '@/hooks/useAgencyPath';

interface PendingDocsContractsBannerProps {
  count: number;
}

export function PendingDocsContractsBanner({ count }: PendingDocsContractsBannerProps) {
  const navigate = useNavigate();
  const { agencyPath } = useAgencyPath();

  if (count === 0) return null;

  const handleClick = () => {
    navigate(agencyPath('/contracts?status=documentacao_pendente'));
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
          <FileWarning className="h-5 w-5 text-amber-600 dark:text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            {count === 1 
              ? '1 contrato aguardando documentação'
              : `${count} contratos aguardando documentação`}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Envie os documentos para ativar a garantia
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={handleClick}
        className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50"
      >
        Ver Contratos
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
