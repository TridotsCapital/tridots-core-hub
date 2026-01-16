import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContractFilters, ContractList } from '@/components/contracts';
import { useContracts, type ContractFilters as ContractFiltersType } from '@/hooks/useContracts';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

export default function Contracts() {
  const [filters, setFilters] = useState<ContractFiltersType>({});
  const { data: contracts, isLoading } = useContracts(filters);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search: search || undefined }));
  };

  const totalContracts = contracts?.length || 0;
  const activeContracts = contracts?.filter(c => c.status === 'ativo').length || 0;

  return (
    <DashboardLayout
      title="Contratos"
      description="Gerencie contratos de garantia aprovados e ativos"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Contract Counter */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Total de Contratos</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{totalContracts}</span>
              <Badge variant="default" className="bg-green-600">
                {activeContracts} ativos
              </Badge>
            </div>
          </div>
        </div>

        <ContractFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
        />

        <ContractList
          contracts={contracts || []}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}