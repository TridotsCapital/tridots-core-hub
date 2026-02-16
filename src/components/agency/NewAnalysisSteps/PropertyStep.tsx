import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCEP, formatCurrencyInput, BRAZILIAN_STATES, PROPERTY_TYPES } from '@/lib/validators';
import { Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const LIMITE_VALOR_LOCATICIO = 4000;

interface PropertyStepProps {
  form: UseFormReturn<any>;
  descontoPix?: number | null;
}

export function PropertyStep({ form }: PropertyStepProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleCepChange = async (value: string) => {
    const formatted = formatCEP(value);
    form.setValue('imovelCep', formatted);

    const cleanedCep = formatted.replace(/\D/g, '');
    if (cleanedCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          form.setValue('imovelEndereco', data.logradouro || '');
          form.setValue('imovelBairro', data.bairro || '');
          form.setValue('imovelCidade', data.localidade || '');
          form.setValue('imovelEstado', data.uf || '');
          toast.success('Endereço preenchido automaticamente!');
        }
      } catch (error) {
        console.error('Error fetching CEP:', error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleCurrencyInput = (field: string, value: string) => {
    const formatted = formatCurrencyInput(value);
    // Store the numeric value
    const digits = value.replace(/\D/g, '');
    const numericValue = digits ? parseInt(digits, 10) / 100 : 0;
    form.setValue(field, numericValue);
    // Store formatted for display
    form.setValue(`${field}Display`, formatted);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <MapPin className="h-5 w-5 text-primary" />
        Dados do Imóvel
      </div>

      {/* CEP with auto-fill */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="imovelCep"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {isLoadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imovelTipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo do Imóvel *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Address fields */}
      <FormField
        control={form.control}
        name="imovelEndereco"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Endereço *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Rua, Avenida, etc." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="imovelNumero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imovelComplemento"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Apto, Bloco, etc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="imovelBairro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Centro" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imovelCidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="São Paulo" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imovelEstado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Financial values */}
      <div className="pt-4 border-t">
        <div className="text-sm font-medium text-muted-foreground mb-4">Valores Financeiros</div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="valorAluguelDisplay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Aluguel *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      {...field}
                      onChange={(e) => handleCurrencyInput('valorAluguel', e.target.value)}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valorCondominioDisplay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condomínio</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      {...field}
                      onChange={(e) => handleCurrencyInput('valorCondominio', e.target.value)}
                      placeholder="0,00"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valorIptuDisplay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IPTU Mensal</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      {...field}
                      onChange={(e) => handleCurrencyInput('valorIptu', e.target.value)}
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

        {/* Alerta de limite de valor locatício */}
        {(() => {
          const valorAluguel = form.watch('valorAluguel') || 0;
          const valorCondominio = form.watch('valorCondominio') || 0;
          const valorIptu = form.watch('valorIptu') || 0;
          const totalLocaticio = valorAluguel + valorCondominio + valorIptu;
          const excedeLimite = totalLocaticio > LIMITE_VALOR_LOCATICIO;

          if (!excedeLimite) return null;

          return (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A Tridots Capital atende apenas locações de até{' '}
                <strong>R$ {LIMITE_VALOR_LOCATICIO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>{' '}
                de valor locatício mensal (aluguel + condomínio + IPTU).
                O valor informado é de{' '}
                <strong>R$ {totalLocaticio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
              </AlertDescription>
            </Alert>
          );
        })()}
      </div>
    </div>
  );
}
