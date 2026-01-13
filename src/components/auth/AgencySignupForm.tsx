import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Building2, User, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface AgencySignupData {
  // Account
  email: string;
  password: string;
  // Company
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  telefone: string;
  // Responsible
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_telefone: string;
  // Address
  cep: string;
  endereco: string;
  cidade: string;
  estado: string;
}

interface AgencySignupFormProps {
  onSubmit: (data: AgencySignupData) => Promise<void>;
  loading: boolean;
}

const STEPS = [
  { id: 1, title: 'Conta', icon: User },
  { id: 2, title: 'Empresa', icon: Building2 },
  { id: 3, title: 'Responsável', icon: User },
  { id: 4, title: 'Endereço', icon: MapPin },
];

export function AgencySignupForm({ onSubmit, loading }: AgencySignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<AgencySignupData>({
    email: '',
    password: '',
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    telefone: '',
    responsavel_nome: '',
    responsavel_email: '',
    responsavel_telefone: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');

  const updateField = (field: keyof AgencySignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password) {
          toast.error('Preencha email e senha');
          return false;
        }
        if (formData.password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          return false;
        }
        if (formData.password !== confirmPassword) {
          toast.error('As senhas não coincidem');
          return false;
        }
        return true;
      case 2:
        if (!formData.cnpj || !formData.razao_social) {
          toast.error('Preencha CNPJ e Razão Social');
          return false;
        }
        if (formData.cnpj.replace(/\D/g, '').length !== 14) {
          toast.error('CNPJ inválido');
          return false;
        }
        return true;
      case 3:
        if (!formData.responsavel_nome) {
          toast.error('Preencha o nome do responsável');
          return false;
        }
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit if on the final step (step 4)
    if (currentStep !== 4) {
      // If not on final step, just advance to next step
      handleNext();
      return;
    }
    if (validateStep(4)) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isActive && "bg-primary border-primary text-primary-foreground",
                    isCompleted && "bg-primary/20 border-primary text-primary",
                    !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-xs mt-1 font-medium",
                  isActive && "text-primary",
                  !isActive && "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1 mt-[-12px]",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Account */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="agency-email" className="font-medium">Email</Label>
            <Input
              id="agency-email"
              type="email"
              placeholder="contato@imobiliaria.com.br"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agency-password" className="font-medium">Senha</Label>
            <div className="relative">
              <Input
                id="agency-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                minLength={6}
                className="h-11 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agency-confirm-password" className="font-medium">Confirmar Senha</Label>
            <Input
              id="agency-confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="h-11"
            />
          </div>
        </div>
      )}

      {/* Step 2: Company */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="agency-cnpj" className="font-medium">CNPJ *</Label>
            <Input
              id="agency-cnpj"
              type="text"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => updateField('cnpj', formatCNPJ(e.target.value))}
              required
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agency-razao" className="font-medium">Razão Social *</Label>
            <Input
              id="agency-razao"
              type="text"
              placeholder="Razão Social da Empresa"
              value={formData.razao_social}
              onChange={(e) => updateField('razao_social', e.target.value)}
              required
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agency-fantasia" className="font-medium">Nome Fantasia</Label>
            <Input
              id="agency-fantasia"
              type="text"
              placeholder="Nome Fantasia (opcional)"
              value={formData.nome_fantasia}
              onChange={(e) => updateField('nome_fantasia', e.target.value)}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agency-phone" className="font-medium">Telefone</Label>
            <Input
              id="agency-phone"
              type="text"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChange={(e) => updateField('telefone', formatPhone(e.target.value))}
              className="h-11"
            />
          </div>
        </div>
      )}

      {/* Step 3: Responsible */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="resp-nome" className="font-medium">Nome do Responsável *</Label>
            <Input
              id="resp-nome"
              type="text"
              placeholder="Nome completo do responsável"
              value={formData.responsavel_nome}
              onChange={(e) => updateField('responsavel_nome', e.target.value)}
              required
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resp-email" className="font-medium">Email do Responsável</Label>
            <Input
              id="resp-email"
              type="email"
              placeholder="responsavel@imobiliaria.com.br"
              value={formData.responsavel_email}
              onChange={(e) => updateField('responsavel_email', e.target.value)}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resp-phone" className="font-medium">Telefone do Responsável</Label>
            <Input
              id="resp-phone"
              type="text"
              placeholder="(00) 00000-0000"
              value={formData.responsavel_telefone}
              onChange={(e) => updateField('responsavel_telefone', formatPhone(e.target.value))}
              className="h-11"
            />
          </div>
        </div>
      )}

      {/* Step 4: Address */}
      {currentStep === 4 && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="agency-cep" className="font-medium">CEP</Label>
            <Input
              id="agency-cep"
              type="text"
              placeholder="00000-000"
              value={formData.cep}
              onChange={(e) => updateField('cep', formatCEP(e.target.value))}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agency-endereco" className="font-medium">Endereço</Label>
            <Input
              id="agency-endereco"
              type="text"
              placeholder="Rua, número, complemento"
              value={formData.endereco}
              onChange={(e) => updateField('endereco', e.target.value)}
              className="h-11"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agency-cidade" className="font-medium">Cidade</Label>
              <Input
                id="agency-cidade"
                type="text"
                placeholder="Cidade"
                value={formData.cidade}
                onChange={(e) => updateField('cidade', e.target.value)}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agency-estado" className="font-medium">Estado</Label>
              <Input
                id="agency-estado"
                type="text"
                placeholder="UF"
                value={formData.estado}
                onChange={(e) => updateField('estado', e.target.value.toUpperCase().slice(0, 2))}
                maxLength={2}
                className="h-11"
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-2">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11"
            onClick={handleBack}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        )}
        
        {currentStep < 4 ? (
          <Button
            type="button"
            className="flex-1 h-11 font-semibold"
            onClick={handleNext}
          >
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="submit"
            className="flex-1 h-11 font-semibold"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        )}
      </div>
    </form>
  );
}
