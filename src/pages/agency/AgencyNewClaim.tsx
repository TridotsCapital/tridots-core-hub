import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useClaimDraft, DraftClaimItem, DraftClaimFile } from "@/hooks/useClaimDraft";
import { useCreateClaim } from "@/hooks/useClaims";
import { useCreateClaimItem } from "@/hooks/useClaimItems";
import { useUploadClaimFile } from "@/hooks/useClaimFiles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Save, Send, Info, User, MapPin, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClaimDebtTable } from "@/components/agency/claims/ClaimDebtTable";
import { ClaimFileUploader } from "@/components/agency/claims/ClaimFileUploader";
import { ClaimChecklist } from "@/components/agency/claims/ClaimChecklist";

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

const generateId = () => Math.random().toString(36).substr(2, 9);

// All categories for pre-filling rows
const allCategories: Array<DraftClaimItem['category']> = [
  'aluguel', 'condominio', 'iptu', 'luz', 'agua', 'gas', 'danos', 'pintura', 'multa_contratual', 'outros'
];

const createEmptyItem = (category: DraftClaimItem['category'] = 'aluguel'): DraftClaimItem => ({
  id: generateId(),
  category,
  description: '',
  reference_period: '',
  due_date: '',
  amount: 0,
});

const createInitialItems = (): DraftClaimItem[] => 
  allCategories.map(cat => createEmptyItem(cat));

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function AgencyNewClaim() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Draft state
  const { draft, hasDraft, isSaving, saveDraft, clearDraft, getLastSavedTime } = useClaimDraft();
  
  // Form state
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState<DraftClaimItem[]>(createInitialItems());
  const [files, setFiles] = useState<DraftClaimFile[]>([]);
  
  // Validation errors for visual feedback
  const [validationErrors, setValidationErrors] = useState<{
    contract?: boolean;
    items?: boolean;
    files?: boolean;
  }>({});
  
  // Mutations
  const createClaim = useCreateClaim();
  const createClaimItem = useCreateClaimItem();
  const uploadClaimFile = useUploadClaimFile();
  
  const preselectedContractId = searchParams.get('contract');

  // Load agency data and contracts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const { data: agencyUser, error: agencyError } = await supabase
          .from('agency_users')
          .select('agency_id')
          .eq('user_id', user.id)
          .single();

        if (agencyError) throw agencyError;
        setAgencyId(agencyUser.agency_id);

        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select(`
            id,
            status,
            analysis:analyses(
              inquilino_nome,
              inquilino_cpf,
              imovel_endereco,
              imovel_cidade,
              imovel_estado,
              valor_aluguel
            )
          `)
          .eq('agency_id', agencyUser.agency_id)
          .in('status', ['ativo', 'documentacao_pendente'])
          .order('created_at', { ascending: false });

        if (contractsError) throw contractsError;
        setContracts(contractsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Restore draft or preselected contract
  useEffect(() => {
    if (loading) return;
    
    if (hasDraft && draft) {
      setSelectedContractId(draft.contractId || '');
      setObservations(draft.observations || '');
      setItems(draft.items.length > 0 ? draft.items : createInitialItems());
      // Files can't be restored from localStorage
    } else if (preselectedContractId) {
      setSelectedContractId(preselectedContractId);
    }
  }, [loading, hasDraft, draft, preselectedContractId]);

  // Auto-save draft
  const handleSaveDraft = useCallback(() => {
    saveDraft({
      contractId: selectedContractId,
      observations,
      items,
      files,
    });
  }, [selectedContractId, observations, items, files, saveDraft]);

  useEffect(() => {
    if (!loading && (selectedContractId || observations || items.length > 0)) {
      handleSaveDraft();
    }
  }, [selectedContractId, observations, items, handleSaveDraft, loading]);

  const selectedContract = contracts.find((c) => c.id === selectedContractId);
  const totalValue = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Validation with visual feedback
  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    if (!selectedContractId) {
      errors.contract = true;
    }

    const validItems = items.filter((i) => i.due_date && i.amount > 0);
    if (validItems.length === 0) {
      errors.items = true;
    }

    if (files.length === 0) {
      errors.files = true;
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      const missingFields: string[] = [];
      if (errors.contract) missingFields.push('contrato');
      if (errors.items) missingFields.push('itens de débito');
      if (errors.files) missingFields.push('arquivos');
      
      toast({
        title: 'Campos obrigatórios',
        description: `Preencha os campos destacados em vermelho: ${missingFields.join(', ')}.`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !agencyId) return;

    setIsSubmitting(true);

    try {
      // 1. Create claim
      const claim = await createClaim.mutateAsync({
        contract_id: selectedContractId,
        agency_id: agencyId,
        observations: observations || undefined,
      });

      // 2. Create items
      const validItems = items.filter((i) => i.due_date && i.amount > 0);
      for (const item of validItems) {
        await createClaimItem.mutateAsync({
          claim_id: claim.id,
          category: item.category,
          description: item.description || undefined,
          reference_period: item.reference_period,
          due_date: item.due_date,
          amount: item.amount,
        });
      }

      // 3. Upload files
      for (const draftFile of files) {
        await uploadClaimFile.mutateAsync({
          claimId: claim.id,
          file: draftFile.file,
          fileType: draftFile.file_type,
        });
      }

      // Clear draft and navigate
      clearDraft();
      
      toast({
        title: 'Sinistro enviado!',
        description: 'Sua solicitação de garantia foi enviada com sucesso.',
      });

      navigate(`/agency/claims/${claim.id}`);
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Ocorreu um erro ao enviar o sinistro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AgencyLayout title="Novo Sinistro">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AgencyLayout>
    );
  }

  if (contracts.length === 0) {
    return (
      <AgencyLayout 
        title="Novo Sinistro"
        actions={
          <Button variant="ghost" onClick={() => navigate('/agency/claims')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Você não possui contratos ativos para abrir um sinistro.
          </p>
          <Button onClick={() => navigate('/agency/contracts')}>
            Ver Meus Contratos
          </Button>
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout 
      title="Solicitar Garantia"
      description="Preencha os dados do sinistro para solicitar a garantia"
      actions={
        <div className="flex items-center gap-3">
          {isSaving ? (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Salvando...
            </span>
          ) : hasDraft && getLastSavedTime() ? (
            <span className="text-sm text-muted-foreground">
              Rascunho salvo às {getLastSavedTime()}
            </span>
          ) : null}
          <Button variant="ghost" onClick={() => navigate('/agency/claims')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contract Selection */}
          <Card className={validationErrors.contract ? 'border-destructive' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">Contrato</CardTitle>
              <CardDescription>Selecione o contrato relacionado ao sinistro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={selectedContractId} 
                onValueChange={(value) => {
                  setSelectedContractId(value);
                  setValidationErrors(prev => ({ ...prev, contract: false }));
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className={`w-full ${validationErrors.contract ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Selecione um contrato..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.analysis?.inquilino_nome} - {contract.analysis?.imovel_endereco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedContract && selectedContract.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/40 rounded-lg">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Inquilino</p>
                      <p className="text-sm font-medium">{selectedContract.analysis.inquilino_nome}</p>
                      <p className="text-xs text-muted-foreground">{selectedContract.analysis.inquilino_cpf}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Imóvel</p>
                      <p className="text-sm font-medium">{selectedContract.analysis.imovel_endereco}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedContract.analysis.imovel_cidade} - {selectedContract.analysis.imovel_estado}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Aluguel</p>
                      <p className="text-sm font-medium">
                        {formatCurrency(selectedContract.analysis.valor_aluguel)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debt Table */}
          <Card className={validationErrors.items ? 'border-destructive' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">Itens de Débito</CardTitle>
              <CardDescription>
                Adicione os valores em atraso. A data de vencimento deve ser no passado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClaimDebtTable
                items={items}
                onChange={(newItems) => {
                  setItems(newItems);
                  const hasValidItem = newItems.some(i => i.due_date && i.amount > 0);
                  if (hasValidItem) {
                    setValidationErrors(prev => ({ ...prev, items: false }));
                  }
                }}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className={validationErrors.files ? 'border-destructive' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">Documentos</CardTitle>
              <CardDescription>
                Anexe os documentos comprobatórios (boletos, contratos, vistorias, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClaimFileUploader
                files={files}
                onChange={(newFiles) => {
                  setFiles(newFiles);
                  if (newFiles.length > 0) {
                    setValidationErrors(prev => ({ ...prev, files: false }));
                  }
                }}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>

          {/* Observations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
              <CardDescription>Informações adicionais sobre o sinistro (opcional)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Descreva detalhes adicionais que possam ajudar na análise..."
                rows={4}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Checklist */}
          <ClaimChecklist />

          {/* Summary */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Itens de débito</span>
                  <span>{items.filter((i) => i.amount > 0).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Arquivos</span>
                  <span>{files.length}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Geral</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Solicitação
                  </>
                )}
              </Button>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Após o envio, vamos dar início às cobranças e retornaremos o mais breve possível. 
                  Lembrando que nosso prazo para pagamento é de até 30 dias.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </AgencyLayout>
  );
}
