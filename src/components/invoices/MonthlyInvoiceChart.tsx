import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateBR } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MonthSummary } from "@/hooks/useMonthlyInvoiceSummary";

interface MonthlyInvoiceChartProps {
  data: MonthSummary[];
  selectedMonth: number;
  selectedYear: number;
  onSelectMonth: (month: number, year: number) => void;
  isLoading?: boolean;
  /** Optional: Additional info to show in header */
  agencyCount?: number;
  /** Optional: Show status badge */
  showStatus?: boolean;
}

const MONTHS_VISIBLE = 12;
const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_NAMES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  gerada: { label: "Gerada", variant: "default" },
  enviada: { label: "Enviada", variant: "default" },
  atrasada: { label: "Atrasada", variant: "destructive" },
  paga: { label: "Paga", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "secondary" },
  futura: { label: "Aguardando Faturamento", variant: "secondary" },
  pendente: { label: "Pendente", variant: "default" },
};

const getStatusColor = (status: MonthSummary['status'], hasInvoice: boolean) => {
  if (!hasInvoice) return 'bg-blue-200 dark:bg-blue-900/50';
  switch (status) {
    case 'paga': return 'bg-green-500';
    case 'atrasada': return 'bg-red-500';
    case 'pendente': 
    case 'rascunho' as any:
    case 'gerada' as any:
    case 'enviada' as any:
      return 'bg-yellow-500';
    default: return 'bg-blue-200 dark:bg-blue-900/50';
  }
};

const getStatusColorSelected = (status: MonthSummary['status'], hasInvoice: boolean) => {
  if (!hasInvoice) return 'bg-blue-400 dark:bg-blue-700';
  switch (status) {
    case 'paga': return 'bg-green-600';
    case 'atrasada': return 'bg-red-600';
    case 'pendente':
    case 'rascunho' as any:
    case 'gerada' as any:
    case 'enviada' as any:
      return 'bg-yellow-600';
    default: return 'bg-blue-400 dark:bg-blue-700';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function MonthlyInvoiceChart({
  data,
  selectedMonth,
  selectedYear,
  onSelectMonth,
  isLoading = false,
  agencyCount,
  showStatus = true
}: MonthlyInvoiceChartProps) {
  // Find index of current month in data
  const currentMonthIndex = useMemo(() => {
    const now = new Date();
    return data.findIndex(m => m.month === now.getMonth() + 1 && m.year === now.getFullYear());
  }, [data]);

  // Calculate initial offset to position current month visible (not necessarily centered)
  const [offset, setOffset] = useState(() => {
    const now = new Date();
    const currentMonthIdx = data.findIndex(
      m => m.month === now.getMonth() + 1 && m.year === now.getFullYear()
    );
    
    if (currentMonthIdx < 0) return 0;
    
    // Position current month on the left third of the visible area
    const idealOffset = Math.max(0, currentMonthIdx - Math.floor(MONTHS_VISIBLE / 4));
    return Math.min(idealOffset, Math.max(0, data.length - MONTHS_VISIBLE));
  });

  // Get visible months
  const visibleMonths = useMemo(() => {
    return data.slice(offset, offset + MONTHS_VISIBLE);
  }, [data, offset]);

  // Calculate max value for bar height scaling
  const maxValue = useMemo(() => {
    const max = Math.max(...data.map(m => m.totalValue), 1);
    return max;
  }, [data]);

  // Selected month data
  const selectedMonthData = useMemo(() => {
    return data.find(m => m.month === selectedMonth && m.year === selectedYear);
  }, [data, selectedMonth, selectedYear]);

  const canGoLeft = offset > 0;
  const canGoRight = offset + MONTHS_VISIBLE < data.length;

  const handlePrev = () => {
    if (canGoLeft) setOffset(prev => Math.max(0, prev - 3));
  };

  const handleNext = () => {
    if (canGoRight) setOffset(prev => Math.min(data.length - MONTHS_VISIBLE, prev + 3));
  };

  const getBarHeight = (value: number) => {
    if (value === 0) return 8;
    return Math.max(20, Math.round((value / maxValue) * 130));
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="w-32 h-6 bg-muted animate-pulse rounded" />
              <div className="w-24 h-4 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="flex gap-6">
            <div className="space-y-2 text-right">
              <div className="w-16 h-4 bg-muted animate-pulse rounded ml-auto" />
              <div className="w-28 h-8 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        <div className="flex items-end justify-center gap-4 h-36">
          {Array.from({ length: MONTHS_VISIBLE }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full max-w-[56px] h-20 bg-muted animate-pulse rounded" />
              <div className="w-10 h-4 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      {/* Header: Month Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">
              {MONTH_NAMES_FULL[selectedMonth - 1]} {selectedYear}
            </h3>
            {selectedMonthData?.dueDate && (
              <p className="text-sm text-muted-foreground">
                Vencimento: {formatDateBR(selectedMonthData.dueDate, "dd 'de' MMMM")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">{formatCurrency(selectedMonthData?.totalValue || 0)}</p>
          </div>
          {agencyCount !== undefined && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Imobiliárias</p>
              <p className="text-2xl font-bold">{agencyCount}</p>
            </div>
          )}
          {showStatus && selectedMonthData?.hasInvoice && (
            <Badge 
              variant={statusConfig[selectedMonthData.status]?.variant || "default"} 
              className="text-sm px-3 py-1"
            >
              {statusConfig[selectedMonthData.status]?.label || selectedMonthData.status}
            </Badge>
          )}
          {showStatus && !selectedMonthData?.hasInvoice && selectedMonthData?.totalValue && selectedMonthData.totalValue > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Aguardando Faturamento
            </Badge>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={!canGoLeft}
          className="shrink-0 h-10 w-10"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="flex items-end justify-between gap-0.5 flex-1 h-36 px-1">
          {visibleMonths.map((monthData) => {
            const isSelected = monthData.month === selectedMonth && monthData.year === selectedYear;
            const isCurrentMonth = (() => {
              const now = new Date();
              return monthData.month === now.getMonth() + 1 && monthData.year === now.getFullYear();
            })();
            const barHeight = getBarHeight(monthData.totalValue);
            const barColor = isSelected 
              ? getStatusColorSelected(monthData.status, monthData.hasInvoice)
              : getStatusColor(monthData.status, monthData.hasInvoice);

            return (
              <button
                key={`${monthData.month}-${monthData.year}`}
                onClick={() => onSelectMonth(monthData.month, monthData.year)}
                className={cn(
                  "flex flex-col items-center gap-1.5 transition-all duration-200 group flex-1 min-w-0",
                  isSelected && "scale-105"
                )}
              >
                <div
                  className={cn(
                    "w-full max-w-[48px] sm:max-w-[60px] rounded-t transition-all duration-200 shadow-sm",
                    barColor,
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
                  )}
                  style={{ height: `${barHeight}px`, minHeight: '12px' }}
                />
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium transition-colors",
                  isSelected ? "text-foreground font-semibold" : "text-muted-foreground",
                  isCurrentMonth && !isSelected && "text-primary font-semibold"
                )}>
                  {MONTH_NAMES_SHORT[monthData.month - 1]}
                </span>
                <span className={cn(
                  "text-[9px] sm:text-[10px]",
                  isSelected ? "text-foreground" : "text-muted-foreground/70"
                )}>
                  {monthData.year}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={!canGoRight}
          className="shrink-0 h-10 w-10"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-4 border-t text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Paga</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span>Atrasada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900/50" />
          <span>Futura</span>
        </div>
      </div>
    </div>
  );
}
