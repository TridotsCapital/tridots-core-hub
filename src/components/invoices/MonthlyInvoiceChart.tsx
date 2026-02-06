import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonthSummary } from "@/hooks/useMonthlyInvoiceSummary";

interface MonthlyInvoiceChartProps {
  data: MonthSummary[];
  selectedMonth: number;
  selectedYear: number;
  onSelectMonth: (month: number, year: number) => void;
  isLoading?: boolean;
}

const MONTHS_VISIBLE = 7;
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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

export function MonthlyInvoiceChart({
  data,
  selectedMonth,
  selectedYear,
  onSelectMonth,
  isLoading = false
}: MonthlyInvoiceChartProps) {
  // Find index of current month in data
  const currentMonthIndex = useMemo(() => {
    const now = new Date();
    return data.findIndex(m => m.month === now.getMonth() + 1 && m.year === now.getFullYear());
  }, [data]);

  // Calculate initial offset to center on current/selected month
  const [offset, setOffset] = useState(() => {
    const selectedIndex = data.findIndex(m => m.month === selectedMonth && m.year === selectedYear);
    const targetIndex = selectedIndex >= 0 ? selectedIndex : currentMonthIndex;
    return Math.max(0, targetIndex - Math.floor(MONTHS_VISIBLE / 2));
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
    return Math.max(20, (value / maxValue) * 100);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-end justify-center gap-2 h-32">
          {Array.from({ length: MONTHS_VISIBLE }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-16 bg-muted animate-pulse rounded" />
              <div className="w-8 h-3 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={!canGoLeft}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-end justify-center gap-1 sm:gap-2 flex-1 h-32 overflow-hidden">
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
                  "flex flex-col items-center gap-1 transition-all duration-200 group min-w-[40px] sm:min-w-[48px]",
                  isSelected && "scale-105"
                )}
              >
                <div
                  className={cn(
                    "w-8 sm:w-10 rounded-t transition-all duration-200",
                    barColor,
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  style={{ height: `${barHeight}%`, minHeight: '8px' }}
                />
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium transition-colors",
                  isSelected ? "text-foreground" : "text-muted-foreground",
                  isCurrentMonth && !isSelected && "text-primary"
                )}>
                  {MONTH_NAMES[monthData.month - 1]}
                </span>
                <span className={cn(
                  "text-[9px] sm:text-[10px]",
                  isSelected ? "text-foreground" : "text-muted-foreground/70"
                )}>
                  {monthData.year.toString().slice(-2)}
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
          className="shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Paga</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Atrasada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900/50" />
          <span>Futura</span>
        </div>
      </div>
    </div>
  );
}
