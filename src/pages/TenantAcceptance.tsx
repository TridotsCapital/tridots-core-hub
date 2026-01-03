import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Upload, 
  User, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  Loader2,
  Building2,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import logoTridots from '@/assets/logo-tridots-black.webp';

interface AnalysisData {
  id: string;
  inquilino_nome: string;
  inquilino_cpf: string;
  inquilino_email: string | null;
  inquilino_telefone: string | null;
  imovel_endereco: string;
  imovel_numero: string | null;
  imovel_cidade: string;
  imovel_estado: string;
  imovel_cep: string | null;
  valor_total: number;
  taxa_garantia_percentual: number;
  setup_fee: number;
  setup_fee_exempt: boolean;
  garantia_mensal: number;
  primeira_parcela: number;
  terms_accepted_at: string | null;
  payer_name: string | null;
  payer_cpf: string | null;
}

interface AgencyData {
  id: string;
  nome: string;
  logo_url: string | null;
}

type TokenStatus = 'loading' | 'valid' | 'expired' | 'used' | 'invalid' | 'error';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

export default function TenantAcceptance() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get('canceled') === 'true';

  const [status, setStatus] = useState<TokenStatus>('loading');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Terms & Identity
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [isUploadingIdentity, setIsUploadingIdentity] = useState(false);
  
  // Step 2: Payer data
  const [payerIsTenant, setPayerIsTenant] = useState(true);
  const [payerData, setPayerData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
  });
  
  // Step 3: Payment
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setStatus('invalid');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('validate-acceptance-token', {
          body: { token }
        });

        if (error) throw error;

        if (!data.valid) {
          setStatus(data.reason as TokenStatus);
          return;
        }

        setAnalysis(data.analysis);
        setAgency(data.agency);
        setExpiresAt(data.expiresAt);
        setStatus('valid');

        // Pre-fill payer data with tenant data
        setPayerData({
          name: data.analysis.inquilino_nome || '',
          cpf: data.analysis.inquilino_cpf || '',
          email: data.analysis.inquilino_email || '',
          phone: data.analysis.inquilino_telefone || '',
          address: data.analysis.imovel_endereco || '',
          number: data.analysis.imovel_numero || '',
          complement: '',
          neighborhood: '',
          city: data.analysis.imovel_cidade || '',
          state: data.analysis.imovel_estado || '',
          cep: data.analysis.imovel_cep || '',
        });

        // If terms already accepted, skip to step 2 or 3
        if (data.analysis.terms_accepted_at) {
          if (data.analysis.payer_name) {
            setCurrentStep(3);
          } else {
            setCurrentStep(2);
          }
        }
      } catch (error) {
        console.error('Error validating token:', error);
        setStatus('error');
      }
    }

    validateToken();
  }, [token]);

  // Show canceled message
  useEffect(() => {
    if (canceled) {
      toast.error('Pagamento cancelado. Você pode tentar novamente.');
    }
  }, [canceled]);

  const handleIdentityUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setIdentityFile(file);
    setIdentityPreview(URL.createObjectURL(file));
  };

  const handleStep1Submit = async () => {
    if (!termsAccepted) {
      toast.error('Você precisa aceitar os termos para continuar.');
      return;
    }

    if (!identityFile) {
      toast.error('Envie uma foto segurando seu documento.');
      return;
    }

    setIsUploadingIdentity(true);

    try {
      // Upload identity photo
      const fileExt = identityFile.name.split('.').pop();
      const filePath = `${analysis?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('identity-verification')
        .upload(filePath, identityFile);

      if (uploadError) throw uploadError;

      // Move to step 2
      setCurrentStep(2);
      
      // Save progress (identity photo path will be saved in step 2)
      localStorage.setItem(`acceptance_${token}_identityPath`, filePath);
      
      toast.success('Documento enviado com sucesso!');
    } catch (error) {
      console.error('Error uploading identity:', error);
      toast.error('Erro ao enviar documento. Tente novamente.');
    } finally {
      setIsUploadingIdentity(false);
    }
  };

  const handleStep2Submit = async () => {
    // Validate required fields
    if (!payerData.name || !payerData.cpf || !payerData.email || !payerData.phone ||
        !payerData.address || !payerData.number || !payerData.city || 
        !payerData.state || !payerData.cep) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    // Validate CPF format
    const cpfClean = payerData.cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      toast.error('CPF inválido.');
      return;
    }

    setIsProcessing(true);

    try {
      const identityPath = localStorage.getItem(`acceptance_${token}_identityPath`);
      
      const { error } = await supabase.functions.invoke('submit-acceptance', {
        body: {
          token,
          identityPhotoPath: identityPath,
          payerData: {
            ...payerData,
            isTenant: payerIsTenant,
          }
        }
      });

      if (error) throw error;

      setCurrentStep(3);
      toast.success('Dados confirmados com sucesso!');
    } catch (error) {
      console.error('Error submitting acceptance:', error);
      toast.error('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { token }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao iniciar pagamento. Tente novamente.');
      setIsProcessing(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Validando link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid states
  if (status !== 'valid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src={logoTridots} alt="Tridots Capital" className="h-10 mx-auto" />
            </div>
            {status === 'expired' && (
              <>
                <Clock className="h-16 w-16 text-warning mx-auto mb-4" />
                <CardTitle>Link Expirado</CardTitle>
                <CardDescription>
                  Este link de aceite expirou. Entre em contato com sua imobiliária para solicitar um novo link.
                </CardDescription>
              </>
            )}
            {status === 'used' && (
              <>
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <CardTitle>Link Já Utilizado</CardTitle>
                <CardDescription>
                  Este link já foi utilizado. Se você ainda não completou o pagamento, entre em contato com sua imobiliária.
                </CardDescription>
              </>
            )}
            {(status === 'invalid' || status === 'error') && (
              <>
                <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <CardTitle>Link Inválido</CardTitle>
                <CardDescription>
                  Este link não é válido. Verifique se você copiou o link corretamente ou entre em contato com sua imobiliária.
                </CardDescription>
              </>
            )}
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Valid - show acceptance flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logoTridots} alt="Tridots Capital" className="h-8" />
          {agency?.logo_url && (
            <img 
              src={agency.logo_url} 
              alt={agency.nome} 
              className="h-10 object-contain max-w-[120px]" 
            />
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Welcome message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Olá, {analysis?.inquilino_nome?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Complete os passos abaixo para ativar sua garantia locatícia.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                ${currentStep > step ? 'bg-success text-white' : 
                  currentStep === step ? 'bg-primary text-white' : 
                  'bg-muted text-muted-foreground'}
              `}>
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-success' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Terms & Identity */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Verificação de Identidade
              </CardTitle>
              <CardDescription>
                Aceite os termos e envie uma foto segurando seu documento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Imóvel</p>
                    <p className="text-sm text-muted-foreground">
                      {analysis?.imovel_endereco}, {analysis?.imovel_numero} - {analysis?.imovel_cidade}/{analysis?.imovel_estado}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Garantia Mensal</span>
                  <span className="font-bold text-primary">{formatCurrency(analysis?.garantia_mensal || 0)}</span>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-4">
                <div className="rounded-lg border p-4 max-h-48 overflow-y-auto text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-2">Termos da Garantia Locatícia</p>
                  <p>Ao aceitar estes termos, você declara estar ciente das condições da garantia locatícia oferecida pela Tridots Capital em parceria com a imobiliária {agency?.nome}.</p>
                  <br />
                  <p>A garantia cobre eventuais inadimplências durante o período do contrato de locação, conforme estabelecido nas cláusulas contratuais.</p>
                  <br />
                  <p>O valor da garantia será cobrado mensalmente através do cartão de crédito informado.</p>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                    Li e aceito os termos da garantia locatícia
                  </label>
                </div>
              </div>

              {/* Identity upload */}
              <div className="space-y-3">
                <Label>Foto segurando RG ou CNH</Label>
                <p className="text-xs text-muted-foreground">
                  Tire uma foto em ambiente claro, segurando seu documento de forma legível.
                </p>
                
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {identityPreview ? (
                    <div className="space-y-3">
                      <img 
                        src={identityPreview} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded-lg" 
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIdentityFile(null);
                          setIdentityPreview(null);
                        }}
                      >
                        Trocar foto
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique para enviar ou arraste o arquivo
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={handleIdentityUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleStep1Submit}
                disabled={!termsAccepted || !identityFile || isUploadingIdentity}
              >
                {isUploadingIdentity ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payer Data */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados do Pagador
              </CardTitle>
              <CardDescription>
                Confirme os dados para emissão da nota fiscal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payer toggle */}
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50">
                <Checkbox 
                  id="payerIsTenant" 
                  checked={payerIsTenant}
                  onCheckedChange={(checked) => {
                    setPayerIsTenant(checked as boolean);
                    if (checked && analysis) {
                      setPayerData({
                        name: analysis.inquilino_nome || '',
                        cpf: analysis.inquilino_cpf || '',
                        email: analysis.inquilino_email || '',
                        phone: analysis.inquilino_telefone || '',
                        address: analysis.imovel_endereco || '',
                        number: analysis.imovel_numero || '',
                        complement: '',
                        neighborhood: '',
                        city: analysis.imovel_cidade || '',
                        state: analysis.imovel_estado || '',
                        cep: analysis.imovel_cep || '',
                      });
                    }
                  }}
                />
                <div>
                  <label htmlFor="payerIsTenant" className="text-sm font-medium cursor-pointer">
                    Eu sou o responsável pelo pagamento
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Desmarque se outra pessoa fará o pagamento
                  </p>
                </div>
              </div>

              {/* Payer form */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={payerData.name}
                    onChange={(e) => setPayerData({ ...payerData, name: e.target.value })}
                    disabled={payerIsTenant}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={payerData.cpf}
                      onChange={(e) => setPayerData({ ...payerData, cpf: formatCPF(e.target.value) })}
                      maxLength={14}
                      disabled={payerIsTenant}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={payerData.phone}
                      onChange={(e) => setPayerData({ ...payerData, phone: formatPhone(e.target.value) })}
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={payerData.email}
                    onChange={(e) => setPayerData({ ...payerData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="address">Endereço *</Label>
                    <Input
                      id="address"
                      value={payerData.address}
                      onChange={(e) => setPayerData({ ...payerData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={payerData.number}
                      onChange={(e) => setPayerData({ ...payerData, number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={payerData.complement}
                      onChange={(e) => setPayerData({ ...payerData, complement: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={payerData.neighborhood}
                      onChange={(e) => setPayerData({ ...payerData, neighborhood: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={payerData.city}
                      onChange={(e) => setPayerData({ ...payerData, city: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">UF *</Label>
                    <Input
                      id="state"
                      value={payerData.state}
                      onChange={(e) => setPayerData({ ...payerData, state: e.target.value.toUpperCase() })}
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="grid gap-2 max-w-[150px]">
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={payerData.cep}
                    onChange={(e) => setPayerData({ ...payerData, cep: formatCEP(e.target.value) })}
                    maxLength={9}
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleStep2Submit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Confirmar Dados
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Resumo e Pagamento
              </CardTitle>
              <CardDescription>
                Revise os valores e prossiga para o pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Values summary */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa Setup</span>
                  <span className={analysis?.setup_fee_exempt ? 'text-success font-medium' : ''}>
                    {analysis?.setup_fee_exempt ? 'ISENTA' : formatCurrency(analysis?.setup_fee || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Garantia Mensal</span>
                  <span>{formatCurrency(analysis?.garantia_mensal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t">
                  <span className="font-semibold">1ª Parcela</span>
                  <span className="font-bold text-xl text-primary">
                    {formatCurrency(analysis?.primeira_parcela || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Parcelas 2 a 12</span>
                  <span>{formatCurrency(analysis?.garantia_mensal || 0)}/mês</span>
                </div>
              </div>

              {/* Payer summary */}
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">Dados do Pagador</p>
                <p className="text-sm text-muted-foreground">{payerData.name || analysis?.payer_name}</p>
                <p className="text-sm text-muted-foreground">{payerData.cpf || analysis?.payer_cpf}</p>
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-primary">
                  Você será redirecionado para a página segura do Stripe para completar o pagamento.
                </p>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecionando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Ir para Pagamento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            {expiresAt && (
              <>Link válido até {new Date(expiresAt).toLocaleDateString('pt-BR')} às {new Date(expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
            )}
          </p>
          <p className="mt-2">
            Dúvidas? Entre em contato com a imobiliária {agency?.nome}
          </p>
        </footer>
      </main>
    </div>
  );
}
