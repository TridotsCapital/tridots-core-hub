import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAgencies } from '@/hooks/useAgencies';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Building2, Phone, Mail, Edit } from 'lucide-react';

export default function Agencies() {
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const { data: agencies, isLoading } = useAgencies(!showInactive);

  const filteredAgencies = agencies?.filter(agency => 
    agency.razao_social.toLowerCase().includes(search.toLowerCase()) ||
    agency.cnpj.includes(search) ||
    agency.responsavel_nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Imobiliárias" description="Gestão de parceiros imobiliários">
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou responsável..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showInactive ? 'secondary' : 'outline'}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? 'Mostrando inativas' : 'Mostrar inativas'}
            </Button>
            <Button asChild>
              <Link to="/agencies/new">
                <Plus className="h-4 w-4 mr-2" />
                Nova Imobiliária
              </Link>
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAgencies?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Building2 className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma imobiliária encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgencies?.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{agency.razao_social}</p>
                          {agency.nome_fantasia && (
                            <p className="text-sm text-muted-foreground">{agency.nome_fantasia}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{agency.cnpj}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{agency.responsavel_nome}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {agency.telefone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {agency.telefone}
                              </span>
                            )}
                            {agency.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {agency.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agency.active ? 'default' : 'secondary'}>
                          {agency.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/agencies/${agency.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
