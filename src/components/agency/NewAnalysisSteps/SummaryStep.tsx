import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { formatCurrency, PROPERTY_TYPES, BRAZILIAN_STATES } from '@/lib/validators';
import { FileCheck, Home, User, Users, DollarSign, MessageSquare } from 'lucide-react';

interface SummaryStepProps {
  form: UseFormReturn<any>;
}

export function SummaryStep({ form }: SummaryStepProps) {
  const values = form.getValues();
  
  const propertyType = PROPERTY_TYPES.find(t => t.value === values.imovelTipo)?.label || values.imovelTipo;
  const stateName = BRAZILIAN_STATES.find(s => s.value === values.imovelEstado)?.label || values.imovelEstado;
  
  const totalEncargos = (values.valorAluguel || 0) + (values.valorCondominio || 0) + (values.valorIptu || 0);
  const taxaMensal = totalEncargos * ((values.taxaGarantiaPercentual || 8) / 100);
  const custoMensalTotal = totalEncargos + taxaMensal;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <FileCheck className="h-5 w-5 text-primary" />
        Resumo da Análise
      </div>

      <p className="text-sm text-muted-foreground">
        Confira os dados antes de enviar a solicitação de análise.
      </p>

      {/* Property Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4" />
            Dados do Imóvel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Endereço:</span>
              <p className="font-medium">
                {values.imovelEndereco}, {values.imovelNumero}
                {values.imovelComplemento && ` - ${values.imovelComplemento}`}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Localização:</span>
              <p className="font-medium">
                {values.imovelBairro}, {values.imovelCidade} - {values.imovelEstado}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">CEP:</span>
              <p className="font-medium">{values.imovelCep}</p>
            </div>
            {propertyType && (
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">{propertyType}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados do Inquilino
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium">{values.inquilinoNome}</p>
            </div>
            <div>
              <span className="text-muted-foreground">CPF:</span>
              <p className="font-medium">{values.inquilinoCpf}</p>
            </div>
            <div>
              <span className="text-muted-foreground">RG:</span>
              <p className="font-medium">{values.inquilinoRg}</p>
            </div>
            {values.inquilinoEmail && (
              <div>
                <span className="text-muted-foreground">E-mail:</span>
                <p className="font-medium">{values.inquilinoEmail}</p>
              </div>
            )}
            {values.inquilinoTelefone && (
              <div>
                <span className="text-muted-foreground">Telefone:</span>
                <p className="font-medium">{values.inquilinoTelefone}</p>
              </div>
            )}
            {values.inquilinoTelefoneSecundario && (
              <div>
                <span className="text-muted-foreground">Telefone Secundário:</span>
                <p className="font-medium">{values.inquilinoTelefoneSecundario}</p>
              </div>
            )}
            {values.inquilinoProfissao && (
              <div>
                <span className="text-muted-foreground">Profissão:</span>
                <p className="font-medium">{values.inquilinoProfissao}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Renda Mensal:</span>
              <p className="font-medium">{formatCurrency(values.inquilinoRendaMensal || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spouse Summary */}
      {values.incluirConjuge && values.conjugeNome && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Dados do Cônjuge/Co-inquilino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{values.conjugeNome}</p>
              </div>
              <div>
                <span className="text-muted-foreground">CPF:</span>
                <p className="font-medium">{values.conjugeCpf}</p>
              </div>
              {values.conjugeProfissao && (
                <div>
                  <span className="text-muted-foreground">Profissão:</span>
                  <p className="font-medium">{values.conjugeProfissao}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Renda Mensal:</span>
                <p className="font-medium">{formatCurrency(values.conjugeRendaMensal || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">Aluguel:</span>
              <p className="font-medium">{formatCurrency(values.valorAluguel || 0)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Condomínio:</span>
              <p className="font-medium">{formatCurrency(values.valorCondominio || 0)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">IPTU:</span>
              <p className="font-medium">{formatCurrency(values.valorIptu || 0)}</p>
            </div>
          </div>
          
          <div className="h-px bg-border" />
          
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Total Encargos:</span>
              <p className="font-medium">{formatCurrency(totalEncargos)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Taxa Mensal Garantia ({values.taxaGarantiaPercentual || 8}%):</span>
              <p className="font-medium">{formatCurrency(taxaMensal)}</p>
            </div>
          </div>
          
          <div className="h-px bg-border" />
          
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Custo Mensal Total:</span>
              <p className="font-semibold text-primary text-lg">{formatCurrency(custoMensalTotal)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Setup Fee:</span>
              <p className="font-semibold">{formatCurrency(values.setupFee || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Observações (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Informações adicionais sobre a análise..."
                    rows={4}
                    maxLength={500}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground text-right">
                  {field.value?.length || 0}/500 caracteres
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Confirmation Checkbox */}
      <FormField
        control={form.control}
        name="confirmacao"
        render={({ field }) => (
          <FormItem>
            <label 
              htmlFor="confirmacao-checkbox"
              className="rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-3"
            >
              <FormControl>
                <Checkbox
                  id="confirmacao-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Confirmo que os dados informados estão corretos
                </p>
                <p className="text-xs text-muted-foreground">
                  Ao enviar esta análise, você declara que as informações são verdadeiras e autoriza 
                  a Tridots a realizar a análise de crédito do inquilino.
                </p>
              </div>
            </label>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
