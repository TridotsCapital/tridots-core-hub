import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FileCheck, Shield, Link2 } from 'lucide-react';

interface LinkedEntity {
  type: 'analysis' | 'contract' | 'claim';
  id: string;
  label?: string;
}

interface LinkedEntitiesCardProps {
  entities: LinkedEntity[];
  isAgencyPortal?: boolean;
}

const ENTITY_CONFIG = {
  analysis: {
    label: 'Análise',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    path: (id: string, isAgency: boolean) => isAgency ? `/agency/contracts/${id}` : `/analyses/${id}`,
  },
  contract: {
    label: 'Contrato',
    icon: FileCheck,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    path: (id: string, isAgency: boolean) => isAgency ? `/agency/contracts/${id}` : `/contracts/${id}`,
  },
  claim: {
    label: 'Garantia',
    icon: Shield,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    path: (id: string, isAgency: boolean) => isAgency ? `/agency/claims/${id}` : `/claims/${id}`,
  },
};

export function LinkedEntitiesCard({ entities, isAgencyPortal = false }: LinkedEntitiesCardProps) {
  const navigate = useNavigate();

  if (!entities || entities.length === 0) {
    return null;
  }

  const handleClick = (entity: LinkedEntity) => {
    const config = ENTITY_CONFIG[entity.type];
    const path = config.path(entity.id, isAgencyPortal);
    navigate(path);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Vínculos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {entities.map((entity) => {
            const config = ENTITY_CONFIG[entity.type];
            const Icon = config.icon;
            const shortId = entity.id.slice(0, 8).toUpperCase();

            return (
              <Badge
                key={`${entity.type}-${entity.id}`}
                variant="outline"
                className={`${config.color} cursor-pointer hover:opacity-80 transition-opacity px-3 py-1.5`}
                onClick={() => handleClick(entity)}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {config.label} #{shortId}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
