import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { format, parse, isAfter, startOfDay } from 'date-fns';
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

interface ClaimDebtTableProps {
  items: DraftClaimItem[];
  onChange: (items: DraftClaimItem[]) => void;
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

export function ClaimDebtTable({ items, onChange, disabled }: ClaimDebtTableProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  };

  const handleChange = (id: string, field: keyof DraftClaimItem, value: unknown) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
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

    const formattedDate = format(date, 'yyyy-MM-dd');
    const refPeriod = format(date, 'MM/yyyy');

    handleChange(id, 'due_date', formattedDate);
    
    // Auto-fill reference period based on due date
    const item = items.find((i) => i.id === id);
    if (item && !item.reference_period) {
      handleChange(id, 'reference_period', refPeriod);
    }
  };

  const handleAmountChange = (id: string, value: string) => {
    // Remove non-numeric characters except comma/period
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    const numValue = parseFloat(cleanValue) || 0;
    handleChange(id, 'amount', numValue);
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
                    onChange={(e) =>
                      handleChange(item.id, 'reference_period', e.target.value)
                    }
                    placeholder="MM/AAAA"
                    className="h-9"
                    disabled={disabled}
                  />
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
                          ? format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={item.due_date ? new Date(item.due_date) : undefined}
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
                  <Input
                    value={item.amount ? formatCurrency(item.amount).replace('R$', '').trim() : ''}
                    onChange={(e) => handleAmountChange(item.id, e.target.value)}
                    placeholder="0,00"
                    className="h-9 text-right"
                    disabled={disabled}
                  />
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
