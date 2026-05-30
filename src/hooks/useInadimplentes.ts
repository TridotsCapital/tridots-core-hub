import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InadimplenteRow {
  contract_id: string;
  analysis_id: string;
  agency_id: string;
  agency_nome: string;
  inquilino_nome: string;
  inquilino_cpf: string;
  inquilino_email: string | null;
  inquilino_telefone: string | null;
  imovel_endereco: string;
  valor_aluguel: number;
  qtd_parcelas_atraso: number;
  valor_total_atraso: number;
  dias_atraso_max: number;
  primeira_parcela_atraso: string;
  ultima_parcela_atraso: string;
  ultima_cobranca_at: string | null;
}

export interface InadimplentesFilters {
  agencyId?: string | null;
  atrasoMin?: number;
  atrasoMax?: number;
  valorMin?: number;
}

export function useInadimplentes(filters: InadimplentesFilters = {}) {
  return useQuery({
    queryKey: ["inadimplentes", filters],
    queryFn: async (): Promise<InadimplenteRow[]> => {
      const { data, error } = await supabase.rpc("get_inadimplentes", {
        p_agency_id: filters.agencyId ?? null,
        p_atraso_min: filters.atrasoMin ?? 1,
        p_atraso_max: filters.atrasoMax ?? 9999,
        p_valor_min: filters.valorMin ?? 0,
      });
      if (error) throw error;
      return (data ?? []) as InadimplenteRow[];
    },
    staleTime: 60_000,
  });
}

// Helper: classifica em faixa de atraso
export function faixaAtraso(dias: number): "1-15d" | "16-30d" | "31-60d" | "60d+" {
  if (dias <= 15) return "1-15d";
  if (dias <= 30) return "16-30d";
  if (dias <= 60) return "31-60d";
  return "60d+";
}

// Export CSV - retorna string (cliente faz download via blob)
export function inadimplentesToCSV(rows: InadimplenteRow[]): string {
  const headers = [
    "Imobiliária", "Inquilino", "CPF", "Email", "Telefone", "Imóvel",
    "Aluguel (R$)", "Parcelas em atraso", "Valor em atraso (R$)",
    "Dias atraso (máx)", "Primeira parcela", "Última parcela", "Última cobrança",
  ];
  const escape = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.agency_nome, r.inquilino_nome, r.inquilino_cpf,
      r.inquilino_email, r.inquilino_telefone, r.imovel_endereco,
      r.valor_aluguel.toFixed(2), r.qtd_parcelas_atraso, r.valor_total_atraso.toFixed(2),
      r.dias_atraso_max, r.primeira_parcela_atraso, r.ultima_parcela_atraso,
      r.ultima_cobranca_at ?? "—",
    ].map(escape).join(","));
  }
  return lines.join("\n");
}
