import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Building2, User, MapPin, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  numero: string;
  complemento: string;
  bairro: string;
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

const ESTADOS_BRASIL = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
];

interface CidadeIBGE {
  id: number;
  nome: string;
}

export function AgencySignupForm({ onSubmit, loading }: AgencySignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [cidades, setCidades] = useState<CidadeIBGE[]>([]);
  
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
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');

  const updateField = (field: keyof AgencySignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch cities when estado changes
  useEffect(() => {
    if (formData.estado) {
      fetchCidadesPorUF(formData.estado);
    } else {
      setCidades([]);
    }
  }, [formData.estado]);

  const fetchCidadesPorUF = async (uf: string) => {
    setLoadingCidades(true);
    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
      );
      if (response.ok) {
        const data: CidadeIBGE[] = await response.json();
        setCidades(data);
      }
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
    } finally {
      setLoadingCidades(false);
    }
  };

  const buscarCEP = async (cep: string) => {
    const cepNumeros = cep.replace(/\D/g, '');
    if (cepNumeros.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));

      toast.success('Endereço preenchido automaticamente');
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
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

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    updateField('cep', formatted);
    
    // Auto-fetch when CEP is complete
    if (formatted.replace(/\D/g, '').length === 8) {
      buscarCEP(formatted);
    }
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
    if (currentStep !== 4) {
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
            <div className="relative">
              <Input
                id="agency-cep"
                type="text"
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                className="h-11 pr-10"
              />
              {loadingCep && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-endereco" className="font-medium">Rua / Logradouro</Label>
            <Input
              id="agency-endereco"
              type="text"
              placeholder="Nome da rua"
              value={formData.endereco}
              onChange={(e) => updateField('endereco', e.target.value)}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agency-numero" className="font-medium">Número</Label>
              <Input
                id="agency-numero"
                type="text"
                placeholder="Nº"
                value={formData.numero}
                onChange={(e) => updateField('numero', e.target.value)}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agency-complemento" className="font-medium">Complemento</Label>
              <Input
                id="agency-complemento"
                type="text"
                placeholder="Sala, Andar..."
                value={formData.complemento}
                onChange={(e) => updateField('complemento', e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-bairro" className="font-medium">Bairro</Label>
            <Input
              id="agency-bairro"
              type="text"
              placeholder="Bairro"
              value={formData.bairro}
              onChange={(e) => updateField('bairro', e.target.value)}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agency-estado" className="font-medium">Estado (UF)</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => {
                  updateField('estado', value);
                  updateField('cidade', ''); // Reset city when state changes
                }}
              >
                <SelectTrigger className="h-11 bg-background">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {ESTADOS_BRASIL.map((estado) => (
                    <SelectItem key={estado.uf} value={estado.uf}>
                      {estado.uf} - {estado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agency-cidade" className="font-medium">Cidade</Label>
              <Select
                value={formData.cidade}
                onValueChange={(value) => updateField('cidade', value)}
                disabled={!formData.estado || loadingCidades}
              >
                <SelectTrigger className="h-11 bg-background">
                  {loadingCidades ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </span>
                  ) : (
                    <SelectValue placeholder={formData.estado ? "Selecione" : "Selecione UF primeiro"} />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-60">
                  {cidades.map((cidade) => (
                    <SelectItem key={cidade.id} value={cidade.nome}>
                      {cidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
