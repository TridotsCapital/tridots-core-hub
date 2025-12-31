import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { formatCPF, formatCurrencyInput, validateCPF } from '@/lib/validators';
import { Users } from 'lucide-react';

interface SpouseStepProps {
  form: UseFormReturn<any>;
}

export function SpouseStep({ form }: SpouseStepProps) {
  const incluirConjuge = form.watch('incluirConjuge');

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    form.setValue('conjugeCpf', formatted);
    
    const cleaned = formatted.replace(/\D/g, '');
    if (cleaned.length === 11) {
      if (!validateCPF(formatted)) {
        form.setError('conjugeCpf', { message: 'CPF inválido' });
      } else {
        form.clearErrors('conjugeCpf');
      }
    }
  };

  const handleCurrencyInput = (field: string, value: string) => {
    const formatted = formatCurrencyInput(value);
    const digits = value.replace(/\D/g, '');
    const numericValue = digits ? parseInt(digits, 10) / 100 : 0;
    form.setValue(field, numericValue);
    form.setValue(`${field}Display`, formatted);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <Users className="h-5 w-5 text-primary" />
        Co-inquilino / Cônjuge
      </div>

      <div className="rounded-lg border p-4 bg-muted/30">
        <FormField
          control={form.control}
          name="incluirConjuge"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <div>
                <FormLabel className="text-base">Incluir cônjuge ou co-inquilino?</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Adicione um segundo responsável para compor renda
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {incluirConjuge && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Name */}
          <FormField
            control={form.control}
            name="conjugeNome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome completo" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CPF and RG */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="conjugeCpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conjugeRg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Documento de identidade" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Birth date */}
          <FormField
            control={form.control}
            name="conjugeDataNascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Professional info */}
          <div className="pt-4 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-4">
              Informações Profissionais
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="conjugeProfissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissão</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Engenheiro, Médico, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conjugeEmpresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da empresa" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-4">
              <FormField
                control={form.control}
                name="conjugeRendaMensalDisplay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renda Mensal *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          R$
                        </span>
                        <Input
                          {...field}
                          onChange={(e) => handleCurrencyInput('conjugeRendaMensal', e.target.value)}
                          placeholder="0,00"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      )}

      {!incluirConjuge && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum co-inquilino será adicionado</p>
          <p className="text-sm">Você pode pular esta etapa</p>
        </div>
      )}
    </div>
  );
}
