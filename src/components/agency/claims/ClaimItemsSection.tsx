import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Loader2, Package } from "lucide-react";
import { useClaimItems, useCreateClaimItem, useUpdateClaimItem, useDeleteClaimItem } from "@/hooks/useClaimItems";
import { claimItemCategoryList, claimItemCategoryConfig } from "@/types/claims";
import type { ClaimItem, ClaimItemCategory } from "@/types/claims";

const itemSchema = z.object({
  category: z.string().min(1, 'Selecione uma categoria'),
  description: z.string().optional(),
  reference_period: z.string().min(1, 'Informe o período de referência'),
  due_date: z.string().min(1, 'Informe a data de vencimento'),
  amount: z.string().min(1, 'Informe o valor').refine(
    (val) => !isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) > 0,
    'Valor deve ser maior que zero'
  ),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface ClaimItemsSectionProps {
  claimId: string;
  canEdit: boolean;
  onUpdate: () => void;
}

export function ClaimItemsSection({ claimId, canEdit, onUpdate }: ClaimItemsSectionProps) {
  const { data: items, isLoading } = useClaimItems(claimId);
  const createItem = useCreateClaimItem();
  const updateItem = useUpdateClaimItem();
  const deleteItem = useDeleteClaimItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClaimItem | null>(null);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      category: '',
      description: '',
      reference_period: '',
      due_date: '',
      amount: '',
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalValue = items?.reduce((sum, item) => sum + item.amount, 0) || 0;

  const openAddDialog = () => {
    form.reset({
      category: '',
      description: '',
      reference_period: '',
      due_date: '',
      amount: '',
    });
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: ClaimItem) => {
    form.reset({
      category: item.category,
      description: item.description || '',
      reference_period: item.reference_period,
      due_date: item.due_date,
      amount: item.amount.toString().replace('.', ','),
    });
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: ItemFormValues) => {
    const amount = parseFloat(values.amount.replace(',', '.'));

    if (editingItem) {
      await updateItem.mutateAsync({
        id: editingItem.id,
        category: values.category as ClaimItemCategory,
        description: values.description || null,
        reference_period: values.reference_period,
        due_date: values.due_date,
        amount,
      });
    } else {
      await createItem.mutateAsync({
        claim_id: claimId,
        category: values.category as ClaimItemCategory,
        description: values.description || undefined,
        reference_period: values.reference_period,
        due_date: values.due_date,
        amount,
      });
    }

    setDialogOpen(false);
    onUpdate();
  };

  const handleDelete = async (item: ClaimItem) => {
    if (confirm('Deseja remover este item do sinistro?')) {
      await deleteItem.mutateAsync({ itemId: item.id, claimId });
      onUpdate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Itens Solicitados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens Solicitados
          </CardTitle>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{formatCurrency(totalValue)}</p>
          </div>
          {canEdit && (
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {claimItemCategoryConfig[item.category]?.label || item.category}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell>{item.reference_period}</TableCell>
                    <TableCell>
                      {format(new Date(item.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum item adicionado ainda.</p>
            {canEdit && (
              <Button variant="outline" className="mt-4" onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Adicionar Item'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {claimItemCategoryList.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Aluguel de Janeiro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reference_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período de Referência</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 01/2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createItem.isPending || updateItem.isPending}
                >
                  {(createItem.isPending || updateItem.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingItem ? (
                    'Salvar'
                  ) : (
                    'Adicionar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
