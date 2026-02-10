import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  ArrowRight,
  Camera,
  ExternalLink,
  Receipt
} from 'lucide-react';
import logoTridots from '@/assets/logo-tridots-black.webp';

interface AnalysisData {
  id: string;
  inquilino_nome: string;
  inquilino_cpf: string;
  inquilino_rg: string | null;
  inquilino_data_nascimento: string | null;
  inquilino_email: string | null;
  inquilino_telefone: string | null;
  inquilino_profissao: string | null;
  inquilino_empresa: string | null;
  inquilino_renda_mensal: number | null;
  conjuge_nome: string | null;
  conjuge_cpf: string | null;
  imovel_endereco: string;
  imovel_numero: string | null;
  imovel_complemento: string | null;
  imovel_bairro: string | null;
  imovel_cidade: string;
  imovel_estado: string;
  imovel_cep: string | null;
  valor_total: number;
  valor_aluguel: number;
  taxa_garantia_percentual: number;
  setup_fee: number;
  setup_fee_exempt: boolean;
  garantia_mensal: number;
  garantia_anual: number;
  primeira_parcela: number;
  terms_accepted_at: string | null;
  payer_name: string | null;
  payer_cpf: string | null;
  setup_payment_link: string | null;
  guarantee_payment_link: string | null;
  setup_payment_confirmed_at: string | null;
  guarantee_payment_confirmed_at: string | null;
  forma_pagamento_preferida: string | null;
  desconto_pix: number;
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
  const navigate = useNavigate();

  const [status, setStatus] = useState<TokenStatus>('loading');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  
  // Step state - dynamic based on setup_fee_exempt
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Terms & Identity
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [isUploadingIdentity, setIsUploadingIdentity] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Step 2: Payer data - Default: payerIsTenant=true means using tenant data (checkbox CHECKED)
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
  const [originalPayerData, setOriginalPayerData] = useState({
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
  
  // Step 3: Setup payment (conditional)
  const [setupPaymentConfirmed, setSetupPaymentConfirmed] = useState(false);
  const [setupReceiptFile, setSetupReceiptFile] = useState<File | null>(null);
  
  // Step 4: Guarantee payment
  const [guaranteePaymentConfirmed, setGuaranteePaymentConfirmed] = useState(false);
  const [guaranteeReceiptFile, setGuaranteeReceiptFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Calculate total steps based on setup_fee_exempt and forma_pagamento_preferida
  const isSetupExempt = analysis?.setup_fee_exempt || (analysis?.setup_fee || 0) <= 0;
  const isBoletoUnificado = analysis?.forma_pagamento_preferida === 'boleto_imobiliaria';

  // Determine steps based on the combination of conditions
  let totalSteps: number;
  let stepNames: string[];

  if (isBoletoUnificado) {
    if (isSetupExempt) {
      // Boleto + Setup Isento = 1 step only (Termos), auto-ativação no backend
      totalSteps = 1;
      stepNames = ['Termos e Condições'];
    } else {
      // Boleto + Setup NÃO Isento = 3 steps (Termos, Confirmação, Pagamento Setup)
      totalSteps = 3;
      stepNames = ['Termos e Condições', 'Confirmação', 'Pagamento Setup'];
    }
  } else {
    if (isSetupExempt) {
      // Cartão/PIX + Setup Isento = 3 steps (Termos, Confirmação, Pagamento Garantia)
      totalSteps = 3;
      stepNames = ['Termos e Condições', 'Confirmação', 'Pagamento Garantia'];
    } else {
      // Cartão/PIX + Setup NÃO Isento = 4 steps (Termos, Confirmação, Pagamento Setup, Pagamento Garantia)
      totalSteps = 4;
      stepNames = ['Termos e Condições', 'Confirmação', 'Pagamento Setup', 'Pagamento Garantia'];
    }
  }

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
        const initialPayerData = {
          name: data.analysis.inquilino_nome || '',
          cpf: data.analysis.inquilino_cpf || '',
          email: data.analysis.inquilino_email || '',
          phone: data.analysis.inquilino_telefone || '',
          address: data.analysis.imovel_endereco || '',
          number: data.analysis.imovel_numero || '',
          complement: data.analysis.imovel_complemento || '',
          neighborhood: data.analysis.imovel_bairro || '',
          city: data.analysis.imovel_cidade || '',
          state: data.analysis.imovel_estado || '',
          cep: data.analysis.imovel_cep || '',
        };
        setPayerData(initialPayerData);
        setOriginalPayerData(initialPayerData);

        // Determine starting step based on progress
        if (data.analysis.guarantee_payment_confirmed_at) {
          // Already completed - redirect to success
          navigate(`/aceite/${token}/sucesso`);
        } else if (data.analysis.setup_payment_confirmed_at && !data.analysis.setup_fee_exempt && (data.analysis.setup_fee || 0) > 0) {
          // Setup paid, go to guarantee (step 4)
          setCurrentStep(4);
        } else if (data.analysis.payer_name) {
          // Payer confirmed, go to setup (step 3) or guarantee if exempt
          setCurrentStep((data.analysis.setup_fee_exempt || (data.analysis.setup_fee || 0) <= 0) ? 3 : 3);
        } else if (data.analysis.terms_accepted_at) {
          // Terms accepted, go to payer (step 2)
          setCurrentStep(2);
        }
      } catch (error) {
        console.error('Error validating token:', error);
        setStatus('error');
      }
    }

    validateToken();
  }, [token, navigate]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Não foi possível acessar a câmera. Tente enviar uma foto.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setIdentityFile(file);
        setIdentityPreview(URL.createObjectURL(file));
      }
    }, 'image/jpeg', 0.8);
    
    closeCamera();
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

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

      // Submit terms step
      const { error } = await supabase.functions.invoke('submit-acceptance', {
        body: {
          token,
          step: 'terms',
          identityPhotoPath: filePath,
        }
      });

      if (error) throw error;

      // If boleto_imobiliaria + setup exempt, go directly to success (auto-activation happens in backend)
      if (isBoletoUnificado && isSetupExempt) {
        toast.success('Aceite concluído com sucesso!');
        navigate(`/aceite/${token}/sucesso`);
        return;
      }

      setCurrentStep(2);
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
      const { error } = await supabase.functions.invoke('submit-acceptance', {
        body: {
          token,
          step: 'payer',
          payerData: {
            ...payerData,
            isTenant: payerIsTenant,
          }
        }
      });

      if (error) throw error;

      // Determine next step based on payment method and setup status
      if (isBoletoUnificado) {
        if (isSetupExempt) {
          // Boleto + Setup Isento: aceite completo, redireciona para sucesso
          navigate(`/aceite/${token}/sucesso`);
        } else {
          // Boleto + Setup NÃO Isento: vai para pagamento do setup
          setCurrentStep(3);
        }
      } else {
        // Cartão/PIX: se setup isento vai direto para garantia, senão para setup
        setCurrentStep(isSetupExempt ? 3 : 3);
      }
      toast.success('Dados confirmados com sucesso!');
    } catch (error) {
      console.error('Error submitting payer data:', error);
      toast.error('Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetupPaymentSubmit = async () => {
    if (!setupPaymentConfirmed) {
      toast.error('Confirme que realizou o pagamento.');
      return;
    }

    setIsProcessing(true);

    try {
      let receiptPath = null;
      
      if (setupReceiptFile) {
        const fileExt = setupReceiptFile.name.split('.').pop();
        const filePath = `${analysis?.id}/setup-receipt-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('identity-verification')
          .upload(filePath, setupReceiptFile);
          
        if (!uploadError) {
          receiptPath = filePath;
        }
      }

      const { error } = await supabase.functions.invoke('submit-acceptance', {
        body: {
          token,
          step: 'setup_payment',
          paymentConfirmation: {
            type: 'setup',
            receiptPath,
          }
        }
      });

      if (error) throw error;

      if (isBoletoUnificado) {
        // Boleto Unificado: após pagar setup, aceite completo
        navigate(`/aceite/${token}/sucesso`);
      } else {
        // Cartão/PIX: vai para pagamento da garantia
        setCurrentStep(4);
      }
      toast.success('Pagamento da taxa setup confirmado!');
    } catch (error) {
      console.error('Error confirming setup payment:', error);
      toast.error('Erro ao confirmar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGuaranteePaymentSubmit = async () => {
    if (!guaranteePaymentConfirmed) {
      toast.error('Confirme que realizou o pagamento.');
      return;
    }

    setIsProcessing(true);

    try {
      let receiptPath = null;
      
      if (guaranteeReceiptFile) {
        const fileExt = guaranteeReceiptFile.name.split('.').pop();
        const filePath = `${analysis?.id}/guarantee-receipt-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('identity-verification')
          .upload(filePath, guaranteeReceiptFile);
          
        if (!uploadError) {
          receiptPath = filePath;
        }
      }

      const { error } = await supabase.functions.invoke('submit-acceptance', {
        body: {
          token,
          step: 'guarantee_payment',
          paymentConfirmation: {
            type: 'guarantee',
            receiptPath,
          }
        }
      });

      if (error) throw error;

      // Navigate to success page
      navigate(`/aceite/${token}/sucesso`);
    } catch (error) {
      console.error('Error confirming guarantee payment:', error);
      toast.error('Erro ao confirmar pagamento. Tente novamente.');
    } finally {
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
                  Este link já foi utilizado. Se você ainda não completou o processo, entre em contato com sua imobiliária.
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
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  ${currentStep > step ? 'bg-success text-white' : 
                    currentStep === step ? 'bg-primary text-white' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
                </div>
                {step < totalSteps && (
                  <div className={`w-12 h-1 mx-1 ${currentStep > step ? 'bg-success' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-muted-foreground">{stepNames[currentStep - 1]}</span>
          </div>
        </div>

        {/* Step 1: Terms & Identity */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Termos e Condições
              </CardTitle>
              <CardDescription>
                Aceite os termos e envie uma foto segurando seu documento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Values summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <h4 className="font-semibold text-sm">Resumo dos Valores</h4>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Imóvel</p>
                    <p className="text-sm text-muted-foreground">
                      {analysis?.imovel_endereco}, {analysis?.imovel_numero} - {analysis?.imovel_cidade}/{analysis?.imovel_estado}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor total locatício</span>
                    <span className="font-medium">{formatCurrency(analysis?.valor_total || 0)} /mês</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa anual de Garantia ({analysis?.taxa_garantia_percentual}%)</span>
                    <span>{formatCurrency(analysis?.garantia_anual || 0)}/ano</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa Setup</span>
                    <span className={analysis?.setup_fee_exempt ? 'text-success font-medium' : ''}>
                      {analysis?.setup_fee_exempt ? 'ISENTA' : formatCurrency(analysis?.setup_fee || 0)}
                    </span>
                  </div>
                </div>
                
                {/* Forma de pagamento destacada */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold">Forma de pagamento Garantia:</span>
                    <span className="font-bold text-primary">
                      {(() => {
                        const method = analysis?.forma_pagamento_preferida;
                        const valorAnual = analysis?.garantia_anual || 0;
                        const descontoPix = analysis?.desconto_pix ?? 0;
                        
                        if (!method) {
                          return 'Não definida';
                        }
                        
                        if (method === 'pix') {
                          // Se não tem desconto, mostrar apenas o valor
                          if (descontoPix === 0) {
                            return `PIX: ${formatCurrency(valorAnual)}`;
                          }
                          // Para PIX, o garantia_anual já vem com desconto do banco
                          const valorSemDesconto = valorAnual / (1 - descontoPix / 100);
                          return `PIX (${Math.round(descontoPix)}% off): ${formatCurrency(valorAnual)} (de ${formatCurrency(valorSemDesconto)})`;
                        }
                        
                        const match = method.match(/card_(\d+)x/);
                        if (match) {
                          const parcelas = parseInt(match[1]);
                          const valorParcela = valorAnual / parcelas;
                          return `${parcelas}x de ${formatCurrency(valorParcela)} (Total: ${formatCurrency(valorAnual)})`;
                        }
                        
                        return 'Não definida';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-4">
                <div className="rounded-lg border p-4 max-h-48 overflow-y-auto text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-2">Termos da Garantia Locatícia</p>
                  
                  {/* DAS CONDIÇÕES GERAIS */}
                  <p className="font-bold text-foreground mt-4 mb-2 border-b pb-1">DAS CONDIÇÕES GERAIS</p>
                  
                  <p className="mb-2"><strong>Cláusula primeira:</strong> Os serviços prestados pela TRIDOTS trata-se de garantia para pagamentos de alugueis, taxa condominial, taxa anual de IPTU e encargos apresentados no contrato de locação, ou ainda, taxa de saída, com base na vistoria do imóvel, que vierem a ser inadimplidos, conforme os termos e condições apresentados na cláusula primeira e segunda do título "CLÁUSULAS CONTRATUAIS DO SERVIÇO".</p>
                  
                  <p className="mb-1"><strong>Parágrafo primeiro:</strong> A TRIDOTS garante os valores inadimplentes de até 20 (vinte) vezes o valor do aluguel vigente no contrato de locação, com a possibilidade de utilizando, sem extrapolar o limite garantido, as seguintes despesas:</p>
                  <ul className="list-disc ml-6 mb-2 space-y-1">
                    <li>até 3 (três) vezes o valor do aluguel para ser utilizados com reforma (pintura, parte hidráulica e elétrica etc), ou ainda, como taxa de saída;</li>
                    <li>até 3 (três) parcelas a título de taxa condominial;</li>
                    <li>36% (trinta e seis por cento) do limite máximo para valores a título de parcela anual de IPTU;</li>
                  </ul>
                  <p className="mb-2">Fica autorizado desde já a TRIDOTS o direito de ressarcimento dos valores inadimplidos do inquilino/locatário indenizado ao locador, através de cobranças do cartão de crédito daquele ou ainda do garantidor.</p>
                  
                  <p className="mb-2"><strong>Cláusula segunda:</strong> Eventuais alterações realizadas no valor do aluguel, após a contratação dos serviços TRIDOTS só serão indenizáveis se devidamente comunicadas pelos contratantes, quais sejam cliente, garantidor, locador ou imobiliária, com o pagamento da diferente a TRIDOTS, bem como anteriormente a eventual inadimplência, nos termos da lei e sempre com anuência prévia expressa ou via eletrônica pela TRIDOTS.</p>
                  
                  <p className="mb-2"><strong>Cláusula terceira:</strong> Eventual alteração do garantidor somente será aceita por prévia autorização de crédito da TRIDOTS de forma expressa, seja escrita ou por meio eletrônico, reservado o direito da mesma em recusar o garantidor em caso de não aprovação pela TRIDOTS.</p>
                  
                  <p className="mb-2"><strong>Cláusula quarta:</strong> Na ocorrência de postergação de vencimentos ou modificações de forma e prazo convencionados originalmente para o pagamento dos aluguéis, por força de lei, decretos ou aditivos no contrato de locação, fica acordado, desde já, que os prazos de vencimento passarão a ser aquele apresentados em lei, decretos e aditivos para efeitos da TRIDOTS.</p>
                  
                  <p className="mb-2"><strong>Cláusula quinta:</strong> Para utilização e realização do cadastro do proponente locatário e/ou garantidor, por meio da imobiliário, é indispensável a leitura e aceitação na íntegra de todos os termos do presente contrato e políticas apresentadas pela TRIDOTS.</p>
                  
                  <p className="mb-2"><strong>Cláusula sexta:</strong> Qualquer pessoa que queira e pretenda utilizar os serviços ofertados pela TRIDOTS, deverá certificar de ter compreendido e aceitar todos os termos estabelecidos no presente contrato, bem como demais documentos incorporados ao mesmo.</p>
                  
                  <p className="mb-2"><strong>Cláusula sétima:</strong> Após o locador definir as condições em que aceita o serviço, o locatário e garantidor deverão escolher a modalidade de prestação de serviços dentre aquelas aceita pelo locador, ou seja, o numero de meses abrangidos.</p>
                  
                  {/* DAS COBERTURAS EXCLUÍDAS PELA TRIDOTS */}
                  <p className="font-bold text-foreground mt-4 mb-2 border-b pb-1">DAS COBERTURAS EXCLUÍDAS PELA TRIDOTS</p>
                  
                  <p className="font-semibold mt-2 mb-1">LOCAÇÕES:</p>
                  <ul className="list-disc ml-6 mb-2 space-y-1">
                    <li>De vagas autônomas ou de espaços para estacionamento de veículos;</li>
                    <li>De espaços destinados a publicidade;</li>
                    <li>Em apart hotéis, hotéis-residenciais ou equiparados, assim considerados aqueles que prestam serviços regulares a seus usurários e como tais sejam autorizados a funcionar;</li>
                    <li>Arrendamento mercantil em qualquer de suas modalidades;</li>
                    <li>Locação realizada com a inobservância de quaisquer princípios estabelecidos por lei, decretos, regulamentos, portarias ou normas emanadas das autoridades competentes.</li>
                  </ul>
                  
                  <p className="font-semibold mt-2 mb-1">DESPESAS E DANOS:</p>
                  <ul className="list-disc ml-6 mb-2 space-y-1">
                    <li>Taxas e despesas provenientes de intermediação ou administração imobiliária, tais como água, luz e telefone, salvo se expressamente descritas no contrato de locação;</li>
                    <li>Cessão ou empréstimo do imóvel locado, total ou parcialmente, decorrentes de qualquer causa, ainda que verificadas após a contratação deste serviço, mesmo que tenha o consentimento expresso do locador;</li>
                    <li>Danos e deteriorações decorrentes do uso normal do imóvel, provenientes do tempo, como temperatura, umidade, vibrações, desmoronamentos, inundações, tremores de terra, erupção vulcânica, infiltrações, poluição e contaminações, tanto áreas externas como internas, bem como danos decorrentes de terceiros ou desvalorização de qualquer natureza ou causa;</li>
                    <li>Impossibilidade de pagamentos por fatos de origem da natureza ou poder público;</li>
                    <li>Atos de autoridade pública, hostilidade ou guerra, operações bélicas, revolução, rebeliões, insurreição, confisco, tumultos, motins, greves, bem como os demais acontecimentos relacionados a estes eventos;</li>
                    <li>Danos decorrentes de radiação, contaminação por radioatividade ou ainda qualquer combustível nuclear, resíduos matérias de armas nucleares;</li>
                    <li>Danos oriundos de recomposições ou despesas de trabalhos artísticos e decorações, pinturas ou gravações em quaisquer tipos de local, seja em vidros, portas, paredes e muros;</li>
                    <li>Danos morais, lucros cessantes e prejuízos indiretos, ainda que de origem deste contrato;</li>
                    <li>Danos decorrentes da rede hidráulica ou elétrica, onde a manutenção e responsabilidade seja das concessionarias de serviços públicos ou, em caso de condomínios, do administrador legal;</li>
                    <li>Danos apresentados na rede hidráulica, elétrica ou telhado;</li>
                    <li>Danos de originados por atos ilícitos, dolosos ou por culpa grave, com equiparação ao dolo, seja ele praticado pelo locatário, beneficiário ou representante, deste ou daquele, ainda que causados pelos sócios controladores, seus dirigentes e administradores legais, bem como beneficiários e representantes, em caso de pessoa jurídica;</li>
                    <li>Aluguéis devidos posterior ao falecimento do locatário, sem que haja pessoa definida em lei como sucessores da locação.</li>
                  </ul>
                  
                  {/* DO FUNCIONAMENTO DOS SERVIÇOS */}
                  <p className="font-bold text-foreground mt-4 mb-2 border-b pb-1">DO FUNCIONAMENTO DOS SERVIÇOS</p>
                  
                  <ol className="list-decimal ml-6 mb-2 space-y-2">
                    <li>A imobiliária e TRIDOTS realização as negociações, onde todas as informações e dados do interessado serão captados por aquela, bem como do garantidor, a fim de realizar a contratação dos serviços oferecidos pela TRIDOTS.</li>
                    <li>Será cobrado do locatário um valor a título de setup no valor entre R$ 0,00 (zero) e R$235,00 (duzentos e trinta e cinco reais), ou seja, para análise e aprovação de cadastro, onde os valores serão pagos somente em cadastros aprovados, assim que for efetivada a aprovação.</li>
                    <li>Cabe a TRIDOTS a análise de crédito para aprovação ou não do proponente locatário, garantindo àquela o direito de recusa, sem que haja qualquer justificativa da referida desaprovação.</li>
                    <li>Aprovado o cadastro, com o aceite dos termos e condições pelo locatário e garantidor, bem como pela confirmação dos serviços contratados, os pagamentos devidos a TRIDOTS será realizado através de cartão de crédito, pix ou boleto único (disponível apenas para imobiliárias contratantes), do valor anual devido em uma única vez (pix) ou parcelado em 12 (doze) vezes mensais fixo. Após o pagamento, a confirmação do contrato com a TRIDOTS se concretizará.</li>
                    <li>O vencimento dos valores devidos a TRIDOTS supramencionados no item 4 serão pagos da seguinte forma: se boleto (imobiliária) conforme vencimento acordado, em caso de parcelamento via cartão de crédito este respeitara o vecimento e fechamento de cada operadora de cartão. O valor da taxa de setup será de forma à vista ou parcelado em até 03 (três) vezes no cartão.</li>
                    <li>A TRIDOTS cobrará o valor de 10% a 15%, conforme análise cadastral, do valor do aluguel, a ser debitado no cartão de crédito do locatário, conforme descrito no item 4 supramencionado, durante a vigência do contrato de locação, se renovando a cada 12 (doze) meses.</li>
                    <li>Fica desde já expressamente autorizado pelo locatário e garantidor, a TRIDOTS realizar o protesto de títulos decorrentes de inadimplementos de débitos, bem como a inscrição em entidades de crédito, como SERASA, SPC e outros órgãos equivalentes.</li>
                    <li>O locatário e garantidor ficam cientes, desde já, que a TRIDOTS procederá de forma judicial a cobrança de débitos inadimplidos dos devedores.</li>
                    <li>Diante do item 8 supramencionado, fica autorizado expressamente pelo garantidor que o mesmo sub-rogasse ao pagamento do locatário em caso de inadimplemento, autorizando a cobrança de serviços em seu cartão de crédito apresentado na contratação dos serviços TRIDOTS.</li>
                  </ol>
                  
                  {/* DA ACEITAÇÃO, VIGÊNCIA E RENOVAÇÃO DO SERVIÇO */}
                  <p className="font-bold text-foreground mt-4 mb-2 border-b pb-1">DA ACEITAÇÃO, VIGÊNCIA E RENOVAÇÃO DO SERVIÇO</p>
                  
                  <ol className="list-decimal ml-6 mb-2 space-y-2">
                    <li>A negociação com a aceitação de serviço será realizada através do e-mail informado pela imobiliária parceira.</li>
                    <li>Os serviços da TRIDOTS serão ativos com a assinatura dos termos e condições do contrato estabelecidos, devendo ser realizado também pelo seu garantidor, com sua qualificação completa, bem como a efetivação do pagamentos devidos.</li>
                    <li>A solicitação de documentos complementares poderá ser realizado a qualquer momento pela TRIDOTS, enquanto perdurar a vigência do contrato.</li>
                    <li>Os serviços oferecidos pela TRIDOTS irá perdurar pelo prazo estipulado no contrato de locação.</li>
                    <li>O presente contrato passa iniciar a sua vigência a partir do pagamento da taxa do serviço TRIDOTS, bem como a assinatura dos termos e condições, dando o seu aceite.</li>
                    <li>Os serviços oferecidos pela TRIDOTS será renovado automaticamente, enquanto perdurar a vigência do contrato de locação, ou até a comunicação formal expressa de forma escrita ou por meio eletrônico a TRIDOTS, comunicando o encerramento do contrato de locação.</li>
                  </ol>
                  
                  {/* DAS OBRIGAÇÕES GERAIS DO USUÁRIO */}
                  <p className="font-bold text-foreground mt-4 mb-2 border-b pb-1">DAS OBRIGAÇÕES GERAIS DO USUÁRIO</p>
                  
                  <p className="mb-2">Cabe a imobiliária manter o contrato de locação em perfeita forma, bem como pelos meios legais, não realizando qualquer alteração do contrato de locação, sem a concordância prévia da TRIDOTS, sob pena de cancelamento/perda do direito da validação do crédito aprovado.</p>
                  
                  {/* DA LGPD */}
                  <p className="font-bold text-foreground mt-4 mb-2 border-b pb-1">DA LEI GERAL DE PROTEÇÃO DE DADOS, SIGILO E CONFIDENCIALIDADE</p>
                  
                  <p className="mb-2">A TRIDOTS, por si e por seus colaboradores, obriga-se a atuar no presente contrato em conformidade com a Legislação vigente sobre Proteção de Dados Pessoais e as determinações de órgãos reguladores/fiscalizadores sobre a matéria, em especial a Lei 13.709/2018, além das demais normas e políticas de proteção de dados de cada país onde houver qualquer tipo de tratamento dos dados dos clientes, o que inclui os dados dos clientes desta. No manuseio dos dados a TRIDOTS deverá:</p>
                  
                  <ul className="list-disc ml-6 mb-2 space-y-1">
                    <li>Tratar os dados pessoais a que tiver acesso apenas de acordo com as instruções do Cliente/Garantidor e em conformidade com estas cláusulas.</li>
                    <li>Manter e utilizar medidas de segurança administrativas, técnicas e físicas apropriadas e suficientes para proteger a confidencialidade e integridade de todos os dados pessoais mantidos ou consultados/transmitidos eletronicamente, para garantir a proteção desses dados contra acesso não autorizado, destruição, uso, modificação, divulgação ou perda acidental ou indevida.</li>
                    <li>Acessar os dados dentro de seu escopo e na medida abrangida por sua permissão de acesso (autorização) e que os dados pessoais não podem ser lidos, copiados, modificados ou removidos sem autorização expressa e por escrito do Cliente/Garantidor.</li>
                    <li>Garantir, por si própria ou quaisquer de seus empregados, prepostos, sócios, diretores, representantes ou terceiros contratados, a confidencialidade dos dados processados, assegurando que todos os seus colaboradores prepostos, sócios, diretores, representantes ou terceiros contratados que lidam com os dados pessoais.</li>
                    <li>Os dados pessoais não poderão ser revelados a terceiros, com exceção da prévia autorização por escrito do Cliente/Garantidor, quer direta ou indiretamente, seja mediante a distribuição de cópias, resumos, compilações, extratos, análises, estudos ou outros meios que contenham ou de outra forma reflitam referidas Informações.</li>
                    <li>Caso a TRIDOTS seja obrigada por determinação legal a fornecer dados pessoais a uma autoridade pública, deverá informar previamente ao Cliente/Garantidor para que esta tome as medidas que julgar cabíveis.</li>
                  </ul>
                  
                  <p className="mb-2">A TRIDOTS deverá notificar o Cliente/Garantidor em até 24 (vinte e quatro) horas a respeito de:</p>
                  <ul className="list-disc ml-6 mb-2 space-y-1">
                    <li>Qualquer não cumprimento (ainda que suspeito) das disposições legais relativas à proteção de Dados Pessoais pela TRIDOTS, seus funcionários, ou terceiros autorizados;</li>
                    <li>Qualquer outra violação de segurança no âmbito das atividades e responsabilidades da TRIDOTS.</li>
                  </ul>
                  
                  {/* DO FORO */}
                  <p className="font-bold text-foreground mt-4 mb-2 border-b pb-1">DO FORO</p>
                  
                  <p className="mb-4">Fica estabelecido o Foro de Maringá, Estado do Paraná, para dirimir qualquer questão oriunda deste termo.</p>
                  
                  {/* Assinaturas dinâmicas */}
                  <div className="border-t mt-4 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="font-bold text-foreground">LOCATÁRIO</p>
                        <p className="text-sm mt-1">{analysis?.inquilino_nome || '---'}</p>
                        <p className="text-xs">CPF: {formatCPF(analysis?.inquilino_cpf || '')}</p>
                      </div>
                      <div>
                        <p className="font-bold text-foreground">GARANTIDOR</p>
                        <p className="text-sm mt-1">TRIDOTS SOLUTIONS LTDA</p>
                        <p className="text-xs">CNPJ: 54.409.383/0001-85</p>
                      </div>
                    </div>
                  </div>
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

              {/* Identity upload/camera */}
              <div className="space-y-3">
                <Label>Foto segurando RG ou CNH</Label>
                <p className="text-xs text-muted-foreground">
                  Tire uma selfie em ambiente claro, segurando seu documento de forma legível.
                </p>
                
                {isCameraOpen ? (
                  <div className="space-y-3">
                    <video 
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-lg bg-black"
                    />
                    <div className="flex gap-2">
                      <Button onClick={capturePhoto} className="flex-1">
                        <Camera className="h-4 w-4 mr-2" />
                        Capturar
                      </Button>
                      <Button variant="outline" onClick={closeCamera}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
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
                      <div className="space-y-3">
                        <Button onClick={openCamera} variant="default">
                          <Camera className="h-4 w-4 mr-2" />
                          Tirar Foto
                        </Button>
                        <p className="text-sm text-muted-foreground">ou</p>
                        <label className="cursor-pointer">
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Enviar Arquivo
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleIdentityUpload}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
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
                Confirmação de Dados
              </CardTitle>
              <CardDescription>
                Confirme os dados do pagador para emissão da nota fiscal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payer toggle - Checked = tenant is payer (frozen fields), Unchecked = different payer (empty editable fields) */}
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50">
                <Checkbox 
                  id="payerIsTenant" 
                  checked={payerIsTenant}
                  onCheckedChange={(checked) => {
                    const isTenantPayer = checked as boolean;
                    setPayerIsTenant(isTenantPayer);
                    if (isTenantPayer) {
                      // Restore original tenant data and freeze
                      setPayerData(originalPayerData);
                    } else {
                      // Clear fields for different payer
                      setPayerData({
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
                    }
                  }}
                />
                <div>
                  <label htmlFor="payerIsTenant" className="text-sm font-medium cursor-pointer">
                    Os dados do pagador são os mesmos do inquilino
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

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep(1)}
                >
                  Voltar
                </Button>
                <Button 
                  className="flex-1" 
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Setup Payment (conditional) - Skip step if exempt, go directly to guarantee */}
        {currentStep === 3 && !isSetupExempt && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Pagamento da Taxa Setup
              </CardTitle>
              <CardDescription>
                Realize o pagamento da taxa de setup e confirme abaixo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Value */}
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Valor da Taxa Setup</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(analysis?.setup_fee || 0)}</p>
              </div>

              {/* Payment link */}
              {analysis?.setup_payment_link && (
                <Button 
                  className="w-full" 
                  size="lg"
                  variant="outline"
                  onClick={() => window.open(analysis.setup_payment_link!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Link de Pagamento
                </Button>
              )}

              {/* Confirmation checkbox */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border">
                <Checkbox 
                  id="setupConfirm" 
                  checked={setupPaymentConfirmed}
                  onCheckedChange={(checked) => setSetupPaymentConfirmed(checked as boolean)}
                />
                <label htmlFor="setupConfirm" className="text-sm leading-tight cursor-pointer font-medium">
                  Confirmo que realizei o pagamento da taxa setup
                </label>
              </div>

              {/* Optional receipt upload */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Comprovante (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {setupReceiptFile ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{setupReceiptFile.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSetupReceiptFile(null)}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Anexar comprovante</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSetupReceiptFile(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Após realizar o pagamento, marque a confirmação acima para prosseguir.
              </p>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep(2)}
                >
                  Voltar
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSetupPaymentSubmit}
                  disabled={!setupPaymentConfirmed || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Guarantee Payment */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Pagamento da Garantia
              </CardTitle>
              <CardDescription>
                Realize o pagamento da garantia locatícia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Setup Exempt Banner */}
              {isSetupExempt && (
                <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <p className="font-medium text-success">Taxa Setup Isenta!</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Parabéns! A taxa de setup foi isenta pela imobiliária parceira.
                  </p>
                </div>
              )}
              
              {/* Value */}
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Valor da Garantia Anual</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(analysis?.garantia_anual || 0)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {(() => {
                    const method = analysis?.forma_pagamento_preferida;
                    const valorAnual = analysis?.garantia_anual || 0;
                    const descontoPix = analysis?.desconto_pix ?? 0;
                    
                    if (!method) {
                      return 'Forma de pagamento não definida';
                    }
                    
                    if (method === 'pix') {
                      // Se não tem desconto, mostrar apenas o valor
                      if (descontoPix === 0) {
                        return `PIX: ${formatCurrency(valorAnual)}`;
                      }
                      const valorSemDesconto = valorAnual / (1 - descontoPix / 100);
                      return `PIX (${Math.round(descontoPix)}% off): ${formatCurrency(valorAnual)} (de ${formatCurrency(valorSemDesconto)})`;
                    }
                    
                    const match = method.match(/card_(\d+)x/);
                    if (match) {
                      const parcelas = parseInt(match[1]);
                      const valorParcela = valorAnual / parcelas;
                      return `${parcelas}x de ${formatCurrency(valorParcela)} (Total: ${formatCurrency(valorAnual)})`;
                    }
                    
                    return 'Forma de pagamento não definida';
                  })()}
                </p>
              </div>

              {/* Payment link */}
              {analysis?.guarantee_payment_link && (
                <Button 
                  className="w-full" 
                  size="lg"
                  variant="outline"
                  onClick={() => window.open(analysis.guarantee_payment_link!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Link de Pagamento
                </Button>
              )}

              {/* Confirmation checkbox */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border">
                <Checkbox 
                  id="guaranteeConfirm" 
                  checked={guaranteePaymentConfirmed}
                  onCheckedChange={(checked) => setGuaranteePaymentConfirmed(checked as boolean)}
                />
                <label htmlFor="guaranteeConfirm" className="text-sm leading-tight cursor-pointer font-medium">
                  Confirmo que realizei o pagamento da garantia
                </label>
              </div>

              {/* Optional receipt upload */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Comprovante (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {guaranteeReceiptFile ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{guaranteeReceiptFile.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setGuaranteeReceiptFile(null)}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Anexar comprovante</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setGuaranteeReceiptFile(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Após realizar o pagamento, marque a confirmação acima para finalizar.
              </p>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep(isSetupExempt ? 2 : 3)}
                >
                  Voltar
                </Button>
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={handleGuaranteePaymentSubmit}
                  disabled={!guaranteePaymentConfirmed || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar
                    </>
                  )}
                </Button>
              </div>
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
