import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Search, FileWarning } from "lucide-react";
import type { Claim, ClaimPublicStatus } from "@/types/claims";
import { claimPublicStatusConfig, claimPublicStatusList } from "@/types/claims";

interface AgencyClaimListProps {
  claims: Claim[];
  isLoading: boolean;
  onRefresh: () => void;
  autoOpenClaimId?: string | null;
  onAutoOpenHandled?: () => void;
}

export function AgencyClaimList({
  claims,
  isLoading,
  autoOpenClaimId,
  onAutoOpenHandled,
}: AgencyClaimListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Auto-navigate to claim from notification
  useEffect(() => {
    if (autoOpenClaimId) {
      navigate(`/agency/claims/${autoOpenClaimId}`);
      onAutoOpenHandled?.();
    }
  }, [autoOpenClaimId, navigate, onAutoOpenHandled]);

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = 
      claim.contract?.analysis?.inquilino_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.contract?.analysis?.imovel_endereco?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.public_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Sinistros</CardTitle>
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
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Meus Sinistros
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar inquilino ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-[250px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {claimPublicStatusList.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredClaims.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {claims.length === 0 
              ? "Você ainda não possui sinistros registrados."
              : "Nenhum sinistro encontrado com os filtros selecionados."
            }
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Valor Solicitado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => {
                  const statusConfig = claimPublicStatusConfig[claim.public_status];
                  
                  return (
                    <TableRow 
                      key={claim.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/agency/claims/${claim.id}`)}
                    >
                      <TableCell className="font-medium">
                        {claim.contract?.analysis?.inquilino_nome || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {claim.contract?.analysis?.imovel_endereco}, {claim.contract?.analysis?.imovel_cidade}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(claim.total_claimed_value)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`${statusConfig.bgColor} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(claim.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/agency/claims/${claim.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
