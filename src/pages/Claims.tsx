import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Search, Filter, Eye, Building2 } from "lucide-react";
import { useClaims } from "@/hooks/useClaims";
import { useAgencies } from "@/hooks/useAgencies";
import { 
  ClaimPublicStatus, 
  ClaimInternalStatus,
  claimPublicStatusConfig,
  claimInternalStatusConfig 
} from "@/types/claims";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Claims() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [publicStatusFilter, setPublicStatusFilter] = useState<ClaimPublicStatus | "all">("all");
  const [internalStatusFilter, setInternalStatusFilter] = useState<ClaimInternalStatus | "all">("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");

  const { data: claims, isLoading } = useClaims({
    publicStatus: publicStatusFilter === "all" ? undefined : publicStatusFilter,
    internalStatus: internalStatusFilter === "all" ? undefined : internalStatusFilter,
    agencyId: agencyFilter === "all" ? undefined : agencyFilter,
  });

  const { data: agencies } = useAgencies();

  const filteredClaims = claims?.filter((claim) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      claim.analysis?.inquilino_nome?.toLowerCase().includes(searchLower) ||
      claim.agency?.nome_fantasia?.toLowerCase().includes(searchLower) ||
      claim.id.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-400/10">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Central de Sinistros</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie todas as solicitações de garantia
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por inquilino, imobiliária ou ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger className="w-[200px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {agencies?.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.nome_fantasia || agency.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={publicStatusFilter} onValueChange={(v) => setPublicStatusFilter(v as ClaimPublicStatus | "all")}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status Público" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(claimPublicStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={internalStatusFilter} onValueChange={(v) => setInternalStatusFilter(v as ClaimInternalStatus | "all")}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status Interno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(claimInternalStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sinistros</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredClaims?.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum sinistro encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status Público</TableHead>
                    <TableHead>Status Interno</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims?.map((claim) => {
                    const publicConfig = claimPublicStatusConfig[claim.public_status];
                    const internalConfig = claimInternalStatusConfig[claim.internal_status];

                    return (
                      <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {claim.analysis?.inquilino_nome || "—"}
                        </TableCell>
                        <TableCell>
                          {claim.agency?.nome_fantasia || claim.agency?.razao_social || "—"}
                        </TableCell>
                        <TableCell className="font-semibold text-amber-600">
                          {formatCurrency(claim.total_claimed_value)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${publicConfig.bgColor} ${publicConfig.color}`}>
                            {publicConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${internalConfig.bgColor} ${internalConfig.color}`}>
                            {internalConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(claim.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/claims/${claim.id}`)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
