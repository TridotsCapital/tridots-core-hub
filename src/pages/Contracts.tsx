import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ContractFilters, ContractList } from '@/components/contracts';
import { useContracts, type ContractFilters as ContractFiltersType } from '@/hooks/useContracts';

export default function Contracts() {
  const [filters, setFilters] = useState<ContractFiltersType>({});
  const { data: contracts, isLoading } = useContracts(filters);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search: search || undefined }));
  };

  return (
    <DashboardLayout
      title="Contratos"
      description="Gerencie contratos de garantia aprovados e ativos"
    >
      <div className="space-y-6 animate-fade-in">
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