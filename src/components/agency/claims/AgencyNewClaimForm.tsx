import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Home, User } from "lucide-react";
import { useCreateClaim } from "@/hooks/useClaims";

const formSchema = z.object({
  contract_id: z.string().min(1, 'Selecione um contrato'),
  observations: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Contract {
  id: string;
  status: string;
  analysis: {
    inquilino_nome: string;
    inquilino_cpf: string;
    imovel_endereco: string;
    imovel_cidade: string;
    imovel_estado: string;
    valor_aluguel: number;
  };
}

interface AgencyNewClaimFormProps {
  agencyId: string;
  contracts: Contract[];
  preselectedContractId?: string | null;
  onSuccess: (claimId: string) => void;
}

export function AgencyNewClaimForm({
  agencyId,
  contracts,
  preselectedContractId,
  onSuccess,
}: AgencyNewClaimFormProps) {
  const createClaim = useCreateClaim();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    contracts.find(c => c.id === preselectedContractId) || null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: preselectedContractId || '',
      observations: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await createClaim.mutateAsync({
        contract_id: values.contract_id,
        agency_id: agencyId,
        observations: values.observations,
      });
      onSuccess(result.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleContractChange = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    setSelectedContract(contract || null);
    form.setValue('contract_id', contractId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Após criar o sinistro, você poderá adicionar os itens (débitos) e anexar os documentos comprobatórios.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecione o Contrato</CardTitle>
              <CardDescription>
                Escolha o contrato ativo para o qual deseja solicitar a garantia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={handleContractChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um contrato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.analysis?.inquilino_nome} - {contract.analysis?.imovel_endereco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedContract && selectedContract.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Inquilino</p>
                      <p className="text-sm text-muted-foreground">{selectedContract.analysis.inquilino_nome}</p>
                      <p className="text-xs text-muted-foreground">CPF: {selectedContract.analysis.inquilino_cpf}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Imóvel</p>
                      <p className="text-sm text-muted-foreground">{selectedContract.analysis.imovel_endereco}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedContract.analysis.imovel_cidade}/{selectedContract.analysis.imovel_estado}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Aluguel: <span className="font-medium text-foreground">{formatCurrency(selectedContract.analysis.valor_aluguel)}</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>
                Adicione informações adicionais sobre o sinistro (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o motivo do sinistro, contexto, etc..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Essas informações ajudarão a equipe na análise do sinistro.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={createClaim.isPending}
              className="min-w-[150px]"
            >
              {createClaim.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Sinistro'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
