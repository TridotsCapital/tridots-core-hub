import { useState } from 'react';
import { Plus, Trash2, AlertCircle, RotateCcw } from 'lucide-react';
import { format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { ClaimItemCategory } from '@/types/claims';
import { claimItemCategoryList } from '@/types/claims';
import type { DraftClaimItem } from '@/hooks/useClaimDraft';

// Parse date string (YYYY-MM-DD) to local Date without timezone shift
const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

interface ClaimDebtTableProps {
  items: DraftClaimItem[];
  onChange: (items: DraftClaimItem[]) => void;
  onClearAll?: () => void;
  disabled?: boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyItem = (): DraftClaimItem => ({
  id: generateId(),
  category: 'aluguel',
  description: '',
  reference_period: '',
  due_date: '',
  amount: 0,
});

export function ClaimDebtTable({ items, onChange, onClearAll, disabled }: ClaimDebtTableProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [referenceErrors, setReferenceErrors] = useState<Record<string, string>>({});
  const [editingAmounts, setEditingAmounts] = useState<Record<string, string>>({});

  const handleAddRow = () => {
    onChange([...items, createEmptyItem()]);
  };

  const handleRemoveRow = (id: string) => {
    if (items.length <= 1) return;
    onChange(items.filter((item) => item.id !== id));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${id}-due_date`];
      return newErrors;
    });
    setReferenceErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
    setEditingAmounts((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleChange = (id: string, field: keyof DraftClaimItem, value: unknown) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Reference field mask and validation (MM/AAAA)
  const handleReferenceChange = (id: string, value: string) => {
    // Remove everything except numbers
    let numericValue = value.replace(/\D/g, '');
    
    // Limit to 6 digits (MMAAAA)
    numericValue = numericValue.slice(0, 6);
    
    // Apply MM/AAAA mask
    let formatted = numericValue;
    if (numericValue.length > 2) {
      formatted = `${numericValue.slice(0, 2)}/${numericValue.slice(2)}`;
    }
    
    // Validate when complete (6 digits)
    if (numericValue.length === 6) {
      const month = parseInt(numericValue.slice(0, 2), 10);
      const year = parseInt(numericValue.slice(2), 10);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      if (month < 1 || month > 12) {
        setReferenceErrors(prev => ({ ...prev, [id]: 'Mês inválido' }));
      } else if (year > currentYear || (year === currentYear && month > currentMonth)) {
        setReferenceErrors(prev => ({ ...prev, [id]: 'Período futuro não permitido' }));
      } else {
        setReferenceErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    } else {
      // Clear error if incomplete
      setReferenceErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
    
    handleChange(id, 'reference_period', formatted);
  };

  const handleDateSelect = (id: string, date: Date | undefined) => {
    if (!date) return;

    const today = startOfDay(new Date());
    const selectedDate = startOfDay(date);

    if (isAfter(selectedDate, today)) {
      setErrors((prev) => ({
        ...prev,
        [`${id}-due_date`]: 'A data deve ser no passado',
      }));
      return;
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${id}-due_date`];
      return newErrors;
    });

    // Usar componentes de data local para evitar problemas de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    handleChange(id, 'due_date', formattedDate);
  };

  // Amount field handlers - use local state while editing
  const handleAmountFocus = (id: string, currentAmount: number) => {
    const displayValue = currentAmount > 0 
      ? currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '';
    setEditingAmounts(prev => ({ ...prev, [id]: displayValue }));
  };

  const handleAmountInputChange = (id: string, value: string) => {
    // Allow only numbers, comma and dot
    const cleanValue = value.replace(/[^\d,\.]/g, '');
    setEditingAmounts(prev => ({ ...prev, [id]: cleanValue }));
  };

  const handleAmountBlur = (id: string) => {
    const rawValue = editingAmounts[id] || '';
    
    // Convert to number: remove thousand separators (dots), replace comma with dot
    const cleanValue = rawValue.replace(/\./g, '').replace(',', '.');
    const numValue = parseFloat(cleanValue) || 0;
    
    handleChange(id, 'amount', numValue);
    
    // Clear editing state
    setEditingAmounts(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const getAmountDisplayValue = (id: string, amount: number): string => {
    // If editing, show the editing value
    if (id in editingAmounts) {
      return editingAmounts[id];
    }
    // Always show formatted value (with currency mask)
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-3">
      {onClearAll && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            disabled={disabled}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar Tabela
          </Button>
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[160px]">Categoria</TableHead>
              <TableHead className="w-[180px]">Descrição</TableHead>
              <TableHead className="w-[100px]">Referência</TableHead>
              <TableHead className="w-[150px]">Vencimento</TableHead>
              <TableHead className="w-[130px] text-right">Valor</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="group">
                <TableCell className="p-2">
                  <Select
                    value={item.category}
                    onValueChange={(value) =>
                      handleChange(item.id, 'category', value as ClaimItemCategory)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {claimItemCategoryList.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      handleChange(item.id, 'description', e.target.value)
                    }
                    placeholder="Opcional"
                    className="h-9"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    value={item.reference_period}
                    onChange={(e) => handleReferenceChange(item.id, e.target.value)}
                    placeholder="MM/AAAA"
                    className={cn("h-9", referenceErrors[item.id] && "border-destructive")}
                    disabled={disabled}
                    maxLength={7}
                    inputMode="numeric"
                  />
                  {referenceErrors[item.id] && (
                    <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {referenceErrors[item.id]}
                    </div>
                  )}
                </TableCell>
                <TableCell className="p-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full h-9 justify-start text-left font-normal',
                          !item.due_date && 'text-muted-foreground',
                          errors[`${item.id}-due_date`] && 'border-destructive'
                        )}
                        disabled={disabled}
                      >
                        {item.due_date
                          ? format(parseDateString(item.due_date), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={item.due_date ? parseDateString(item.due_date) : undefined}
                        onSelect={(date) => handleDateSelect(item.id, date)}
                        disabled={(date) => isAfter(date, new Date())}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors[`${item.id}-due_date`] && (
                    <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors[`${item.id}-due_date`]}
                    </div>
                  )}
                </TableCell>
                <TableCell className="p-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      value={getAmountDisplayValue(item.id, item.amount)}
                      onChange={(e) => handleAmountInputChange(item.id, e.target.value)}
                      onFocus={() => handleAmountFocus(item.id, item.amount)}
                      onBlur={() => handleAmountBlur(item.id)}
                      placeholder="0,00"
                      className="h-9 text-right pl-8"
                      disabled={disabled}
                      inputMode="decimal"
                    />
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveRow(item.id)}
                    disabled={disabled || items.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/30">
              <TableCell colSpan={4} className="font-semibold text-right">
                Total Geral
              </TableCell>
              <TableCell className="font-bold text-right text-lg">
                {formatCurrency(total)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        disabled={disabled}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Adicionar Linha
      </Button>
    </div>
  );
}
