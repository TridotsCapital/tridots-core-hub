import { useState, useMemo } from "react";
import { useInadimplentes, inadimplentesToCSV, faixaAtraso, type InadimplentesFilters } from "@/hooks/useInadimplentes";
import { useAgencies } from "@/hooks/useAgencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, AlertTriangle, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

const FAIXAS = [
  { label: "Todos", min: 1, max: 9999 },
  { label: "1–15 dias", min: 1, max: 15 },
  { label: "16–30 dias", min: 16, max: 30 },
  { label: "31–60 dias", min: 31, max: 60 },
  { label: "60+ dias", min: 61, max: 9999 },
];

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatDate = (s: string | null) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
};

export default function Inadimplentes() {
  const [filters, setFilters] = useState<InadimplentesFilters>({
    atrasoMin: 1,
    atrasoMax: 9999,
    valorMin: 0,
  });

  const { data: agencies = [] } = useAgencies();
  const { data: rows = [], isLoading, error } = useInadimplentes(filters);

  const totals = useMemo(() => {
    return {
      contratos: rows.length,
      valor: rows.reduce((acc, r) => acc + Number(r.valor_total_atraso), 0),
      maxDias: rows.reduce((acc, r) => Math.max(acc, r.dias_atraso_max), 0),
    };
  }, [rows]);

  const onExportCSV = () => {
    const csv = inadimplentesToCSV(rows);
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inadimplentes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} linha(s) exportada(s)`);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="text-orange-500" />
            Relatório de Inadimplentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Contratos com parcelas vencidas. Atualizado em tempo real.
          </p>
        </div>
        <Button onClick={onExportCSV} disabled={rows.length === 0} className="gap-2">
          <Download size={16} /> Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Imobiliária</Label>
            <Select
              value={filters.agencyId ?? "all"}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, agencyId: v === "all" ? null : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {agencies.map((a: { id: string; razao_social: string }) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Faixa de atraso</Label>
            <Select
              value={`${filters.atrasoMin}_${filters.atrasoMax}`}
              onValueChange={(v) => {
                const f = FAIXAS.find((x) => `${x.min}_${x.max}` === v);
                if (f) setFilters((s) => ({ ...s, atrasoMin: f.min, atrasoMax: f.max }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FAIXAS.map((f) => (
                  <SelectItem key={f.label} value={`${f.min}_${f.max}`}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Valor mínimo em atraso (R$)</Label>
            <Input
              type="number"
              min={0}
              step="100"
              value={filters.valorMin ?? 0}
              onChange={(e) =>
                setFilters((f) => ({ ...f, valorMin: Number(e.target.value) || 0 }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Contratos em atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totals.contratos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Valor total em atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{formatBRL(totals.valor)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Atraso máximo (dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totals.maxDias}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? "Carregando…" : `${rows.length} contrato(s) em atraso`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-600">Erro ao carregar: {(error as Error).message}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imobiliária</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead className="text-right">Aluguel</TableHead>
                  <TableHead className="text-center">Parcelas</TableHead>
                  <TableHead className="text-right">Em atraso</TableHead>
                  <TableHead className="text-center">Dias</TableHead>
                  <TableHead>Faixa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      Nenhum contrato em atraso com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => {
                  const f = faixaAtraso(r.dias_atraso_max);
                  return (
                    <TableRow key={r.contract_id}>
                      <TableCell className="font-medium">{r.agency_nome}</TableCell>
                      <TableCell>
                        <div>{r.inquilino_nome}</div>
                        <div className="text-xs text-muted-foreground">{r.inquilino_cpf}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {r.inquilino_telefone && (
                            <a href={`tel:${r.inquilino_telefone}`} className="flex items-center gap-1 text-blue-600">
                              <Phone size={12} /> {r.inquilino_telefone}
                            </a>
                          )}
                          {r.inquilino_email && (
                            <a href={`mailto:${r.inquilino_email}`} className="flex items-center gap-1 text-blue-600">
                              <Mail size={12} /> {r.inquilino_email}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{r.imovel_endereco}</TableCell>
                      <TableCell className="text-right">{formatBRL(Number(r.valor_aluguel))}</TableCell>
                      <TableCell className="text-center">{r.qtd_parcelas_atraso}</TableCell>
                      <TableCell className="text-right font-bold text-orange-600">
                        {formatBRL(Number(r.valor_total_atraso))}
                      </TableCell>
                      <TableCell className="text-center">{r.dias_atraso_max}</TableCell>
                      <TableCell>
                        <Badge
                          variant={f === "60d+" ? "destructive" : f === "31-60d" ? "secondary" : "default"}
                        >
                          {f}
                        </Badge>
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
  );
}
