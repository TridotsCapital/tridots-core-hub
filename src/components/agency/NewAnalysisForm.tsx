import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Send, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalysisDraft } from '@/hooks/useAnalysisDraft';
import { validateCPF } from '@/lib/validators';
import { GuaranteeSimulator, SimulatorValues } from './GuaranteeSimulator';
import { AnalysisSuccessScreen } from './AnalysisSuccessScreen';
import { PropertyStep, TenantStep, SpouseStep, SummaryStep } from './NewAnalysisSteps';

const formSchema = z.object({
  // Property
  imovelCep: z.string().min(9, 'CEP inválido'),
  imovelEndereco: z.string().min(3, 'Endereço obrigatório'),
  imovelNumero: z.string().min(1, 'Número obrigatório'),
  imovelComplemento: z.string().optional(),
  imovelBairro: z.string().min(2, 'Bairro obrigatório'),
  imovelCidade: z.string().min(2, 'Cidade obrigatória'),
  imovelEstado: z.string().length(2, 'Estado obrigatório'),
  imovelTipo: z.string().min(1, 'Tipo do imóvel é obrigatório'),
  valorAluguel: z.number().min(1, 'Valor do aluguel obrigatório'),
  valorAluguelDisplay: z.string().optional(),
  valorCondominio: z.number().default(0),
  valorCondominioDisplay: z.string().optional(),
  valorIptu: z.number().default(0),
  valorIptuDisplay: z.string().optional(),
  // Tenant
  inquilinoNome: z.string().min(3, 'Nome obrigatório'),
  inquilinoCpf: z.string().refine(val => validateCPF(val), 'CPF inválido'),
  inquilinoRg: z.string().min(5, 'RG deve ter pelo menos 5 caracteres'),
  inquilinoDataNascimento: z.string().min(1, 'Data de nascimento obrigatória'),
  inquilinoEmail: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  inquilinoTelefone: z.string().min(10, 'Telefone inválido (mínimo 10 dígitos)'),
  inquilinoTelefoneSecundario: z.string().min(10, 'Telefone secundário obrigatório (mínimo 10 dígitos)'),
  inquilinoProfissao: z.string().min(2, 'Profissão obrigatória'),
  inquilinoEmpresa: z.string().min(2, 'Empresa obrigatória'),
  inquilinoRendaMensal: z.number().min(1, 'Renda obrigatória'),
  inquilinoRendaMensalDisplay: z.string().optional(),
  // Spouse
  incluirConjuge: z.boolean().default(false),
  conjugeNome: z.string().optional(),
  conjugeCpf: z.string().optional(),
  conjugeRg: z.string().optional(),
  conjugeDataNascimento: z.string().optional(),
  conjugeWhatsApp: z.string().optional(),
  conjugeProfissao: z.string().optional(),
  conjugeEmpresa: z.string().optional(),
  conjugeRendaMensal: z.number().optional(),
  conjugeRendaMensalDisplay: z.string().optional(),
  // Financial
  taxaGarantiaPercentual: z.number().min(5).max(15).default(8),
  setupFee: z.number().default(100),
  formaPagamentoPreferida: z.string().min(1, 'Forma de pagamento obrigatória'),
  observacoes: z.string().max(500).optional(),
  // Confirmation
  confirmacao: z.boolean().refine(val => val === true, 'Confirmação obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

interface NewAnalysisFormProps {
  agencyId: string;
}

const STEPS = [
  { id: 'property', title: 'Imóvel', component: PropertyStep },
  { id: 'tenant', title: 'Inquilino', component: TenantStep },
  { id: 'spouse', title: 'Cônjuge', component: SpouseStep },
  { id: 'summary', title: 'Resumo', component: SummaryStep },
];

export function NewAnalysisForm({ agencyId }: NewAnalysisFormProps) {
  const { user } = useAuth();
  const { draft, hasDraft, saveDraft, clearDraft, getLastSavedTime } = useAnalysisDraft();
  const [showSimulator, setShowSimulator] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valorAluguel: 0,
      valorCondominio: 0,
      valorIptu: 0,
      inquilinoRendaMensal: 0,
      incluirConjuge: false,
      taxaGarantiaPercentual: 8,
      setupFee: 100,
      formaPagamentoPreferida: '',
      confirmacao: false,
    },
  });

  // Check for draft on mount
  useEffect(() => {
    if (hasDraft && draft) {
      setShowDraftDialog(true);
    }
  }, [hasDraft]);

  // Auto-save form changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (!showSimulator) {
        saveDraft({ ...values, currentStep });
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, saveDraft, currentStep, showSimulator]);

  const handleRestoreDraft = () => {
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        if (key !== 'lastSavedAt' && key !== 'currentStep') {
          form.setValue(key as any, value as any);
        }
      });
      setCurrentStep(draft.currentStep || 0);
      setShowSimulator(false);
    }
    setShowDraftDialog(false);
  };

  const handleStartFresh = () => {
    clearDraft();
    setShowDraftDialog(false);
  };

  const handleSimulatorComplete = (values: SimulatorValues) => {
    form.setValue('valorAluguel', values.aluguel);
    form.setValue('valorAluguelDisplay', values.aluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    form.setValue('valorCondominio', values.condominio);
    form.setValue('valorCondominioDisplay', values.condominio.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    form.setValue('valorIptu', values.iptu);
    form.setValue('valorIptuDisplay', values.iptu.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    form.setValue('taxaGarantiaPercentual', values.taxaGarantia);
    form.setValue('setupFee', values.setupFee);
    form.setValue('formaPagamentoPreferida', values.formaPagamento);
    setShowSimulator(false);
  };

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleNext = async () => {
    const incluirConjuge = form.getValues('incluirConjuge');
    
    const stepFields: Record<number, (keyof FormData)[]> = {
      0: ['imovelCep', 'imovelEndereco', 'imovelNumero', 'imovelBairro', 'imovelCidade', 'imovelEstado', 'imovelTipo', 'valorAluguel'],
      1: ['inquilinoNome', 'inquilinoCpf', 'inquilinoRg', 'inquilinoDataNascimento', 'inquilinoEmail', 'inquilinoTelefone', 'inquilinoTelefoneSecundario', 'inquilinoProfissao', 'inquilinoEmpresa', 'inquilinoRendaMensal'],
      2: incluirConjuge ? ['conjugeNome', 'conjugeCpf', 'conjugeProfissao', 'conjugeEmpresa', 'conjugeRendaMensal'] : [],
    };

    const fieldsToValidate = stepFields[currentStep] || [];
    let isValid = await form.trigger(fieldsToValidate);

    // Additional validation for spouse required fields
    if (currentStep === 2 && incluirConjuge) {
      const conjugeProfissao = form.getValues('conjugeProfissao');
      const conjugeEmpresa = form.getValues('conjugeEmpresa');
      
      if (!conjugeProfissao || conjugeProfissao.length < 2) {
        form.setError('conjugeProfissao', { message: 'Profissão do cônjuge é obrigatória' });
        isValid = false;
      }
      if (!conjugeEmpresa || conjugeEmpresa.length < 2) {
        form.setError('conjugeEmpresa', { message: 'Empresa do cônjuge é obrigatória' });
        isValid = false;
      }
    }

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { data: analysis, error } = await supabase
        .from('analyses')
        .insert({
          agency_id: agencyId,
          status: 'pendente',
          imovel_cep: data.imovelCep,
          imovel_endereco: data.imovelEndereco,
          imovel_numero: data.imovelNumero,
          imovel_complemento: data.imovelComplemento || null,
          imovel_bairro: data.imovelBairro,
          imovel_cidade: data.imovelCidade,
          imovel_estado: data.imovelEstado,
          imovel_tipo: data.imovelTipo || null,
          valor_aluguel: data.valorAluguel,
          valor_condominio: data.valorCondominio,
          valor_iptu: data.valorIptu,
          inquilino_nome: data.inquilinoNome,
          inquilino_cpf: data.inquilinoCpf.replace(/\D/g, ''),
          inquilino_rg: data.inquilinoRg,
          inquilino_data_nascimento: data.inquilinoDataNascimento || null,
          inquilino_email: data.inquilinoEmail || null,
          inquilino_telefone: data.inquilinoTelefone || null,
          inquilino_telefone_secundario: data.inquilinoTelefoneSecundario || null,
          inquilino_profissao: data.inquilinoProfissao || null,
          inquilino_empresa: data.inquilinoEmpresa || null,
          inquilino_renda_mensal: data.inquilinoRendaMensal,
          conjuge_nome: data.incluirConjuge ? data.conjugeNome : null,
          conjuge_cpf: data.incluirConjuge ? data.conjugeCpf?.replace(/\D/g, '') : null,
          conjuge_rg: data.incluirConjuge ? data.conjugeRg : null,
          conjuge_data_nascimento: data.incluirConjuge ? data.conjugeDataNascimento : null,
          conjuge_profissao: data.incluirConjuge ? data.conjugeProfissao : null,
          conjuge_empresa: data.incluirConjuge ? data.conjugeEmpresa : null,
          conjuge_renda_mensal: data.incluirConjuge ? data.conjugeRendaMensal : null,
          taxa_garantia_percentual: data.taxaGarantiaPercentual,
          setup_fee: data.setupFee,
          forma_pagamento_preferida: data.formaPagamentoPreferida,
          observacoes: data.observacoes || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      clearDraft();
      setSubmittedId(analysis.id);
      toast.success('Análise enviada com sucesso!');
    } catch (error: any) {
      console.error('Error submitting analysis:', error);
      toast.error('Erro ao enviar análise: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewAnalysis = () => {
    form.reset();
    setSubmittedId(null);
    setCurrentStep(0);
    setShowSimulator(true);
  };

  if (submittedId) {
    return <AnalysisSuccessScreen analysisId={submittedId} onNewAnalysis={handleNewAnalysis} />;
  }

  if (showSimulator) {
    return (
      <>
        <GuaranteeSimulator onStartAnalysis={handleSimulatorComplete} />
        <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rascunho encontrado</DialogTitle>
              <DialogDescription>
                Você tem uma análise não finalizada salva em {getLastSavedTime()}.
                Deseja continuar de onde parou?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleStartFresh}>Iniciar Nova</Button>
              <Button onClick={handleRestoreDraft}>Continuar Rascunho</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const StepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          {STEPS.map((step, index) => (
            <span
              key={step.id}
              className={`${index <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              {step.title}
            </span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <StepComponent form={form} />

              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep === 0 ? () => setShowSimulator(true) : handlePrevious}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {currentStep === 0 ? 'Voltar ao Simulador' : 'Voltar'}
                </Button>

                {currentStep < STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting || !form.watch('confirmacao')}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar Análise
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Auto-save indicator */}
      <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Save className="h-3 w-3" />
        {getLastSavedTime() 
          ? `Rascunho salvo às ${new Date(draft?.lastSavedAt || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Rascunho salvo automaticamente'
        }
      </div>
    </div>
  );
}
