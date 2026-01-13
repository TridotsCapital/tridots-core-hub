import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { formatCPF, formatPhone, formatCurrencyInput, validateCPF, validateEmail } from '@/lib/validators';
import { User } from 'lucide-react';
import whatsappIcon from '@/assets/whatsapp-icon.png';

interface TenantStepProps {
  form: UseFormReturn<any>;
}

export function TenantStep({ form }: TenantStepProps) {
  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    form.setValue('inquilinoCpf', formatted);
    
    // Validate CPF
    const cleaned = formatted.replace(/\D/g, '');
    if (cleaned.length === 11) {
      if (!validateCPF(formatted)) {
        form.setError('inquilinoCpf', { message: 'CPF inválido' });
      } else {
        form.clearErrors('inquilinoCpf');
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    form.setValue('inquilinoTelefone', formatted);
  };

  const handleCurrencyInput = (field: string, value: string) => {
    const formatted = formatCurrencyInput(value);
    const digits = value.replace(/\D/g, '');
    const numericValue = digits ? parseInt(digits, 10) / 100 : 0;
    form.setValue(field, numericValue);
    form.setValue(`${field}Display`, formatted);
  };

  const handleEmailChange = (value: string) => {
    form.setValue('inquilinoEmail', value);
    
    if (value && !validateEmail(value)) {
      form.setError('inquilinoEmail', { message: 'E-mail inválido' });
    } else {
      form.clearErrors('inquilinoEmail');
    }
  };

  const handleBirthDateChange = (value: string) => {
    form.setValue('inquilinoDataNascimento', value);
    
    if (value) {
      const birthDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (birthDate > today) {
        form.setError('inquilinoDataNascimento', { message: 'Data de nascimento não pode ser maior que a data atual' });
      } else {
        form.clearErrors('inquilinoDataNascimento');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-medium">
        <User className="h-5 w-5 text-primary" />
        Dados do Inquilino
      </div>

      {/* Name */}
      <FormField
        control={form.control}
        name="inquilinoNome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Completo *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Nome completo do inquilino" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* CPF, RG and Birth date - 3 fields on same line */}
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="inquilinoCpf"
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
          name="inquilinoRg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RG *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Documento de identidade" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inquilinoDataNascimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Nascimento *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="date" 
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Email, WhatsApp and Secondary Phone - 3 fields on same line */}
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="inquilinoEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  type="email"
                  placeholder="email@exemplo.com"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inquilinoTelefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <img src={whatsappIcon} alt="WhatsApp" className="h-4 w-4" />
                WhatsApp *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inquilinoTelefoneSecundario"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <img src={whatsappIcon} alt="WhatsApp" className="h-4 w-4" />
                Telefone Secundário *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    field.onChange(formatted);
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Professional info */}
      <div className="pt-4 border-t">
        <div className="text-sm font-medium text-muted-foreground mb-4">Informações Profissionais</div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="inquilinoProfissao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissão *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Engenheiro, Médico, etc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inquilinoEmpresa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa *</FormLabel>
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
            name="inquilinoRendaMensalDisplay"
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
                      onChange={(e) => handleCurrencyInput('inquilinoRendaMensal', e.target.value)}
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
  );
}
