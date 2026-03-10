import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface AnalysisDraftData {
  // Simulator values
  simulatorAluguel?: number;
  simulatorCondominio?: number;
  simulatorIptu?: number;
  simulatorTaxaGarantia?: number;
  simulatorSetupFee?: number;
  
  // Step 1: Property
  imovelCep?: string;
  imovelEndereco?: string;
  imovelNumero?: string;
  imovelComplemento?: string;
  imovelBairro?: string;
  imovelCidade?: string;
  imovelEstado?: string;
  imovelTipo?: string;
  valorAluguel?: number;
  valorCondominio?: number;
  valorIptu?: number;
  
  // Step 2: Tenant
  inquilinoNome?: string;
  inquilinoCpf?: string;
  inquilinoRg?: string;
  inquilinoDataNascimento?: string;
  inquilinoEmail?: string;
  inquilinoTelefone?: string;
  inquilinoProfissao?: string;
  inquilinoEmpresa?: string;
  inquilinoRendaMensal?: number;
  
  // Step 3: Spouse
  incluirConjuge?: boolean;
  conjugeNome?: string;
  conjugeCpf?: string;
  conjugeRg?: string;
  conjugeDataNascimento?: string;
  conjugeProfissao?: string;
  conjugeEmpresa?: string;
  conjugeRendaMensal?: number;
  
  // Step 4: Financial
  taxaGarantiaPercentual?: number;
  setupFee?: number;
  observacoes?: string;
  
  // Metadata
  currentStep?: number;
  lastSavedAt?: string;
}

const DRAFT_KEY_PREFIX = 'tridots_draft_analysis_';
const DEBOUNCE_DELAY = 1000;

export function useAnalysisDraft() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<AnalysisDraftData | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const storageKey = user ? `${DRAFT_KEY_PREFIX}${user.id}` : null;
  
  // Load draft on mount
  useEffect(() => {
    if (!storageKey) {
      setIsLoading(false);
      return;
    }
    
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as AnalysisDraftData;
        setDraft(parsed);
        setHasDraft(true);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    
    setIsLoading(false);
  }, [storageKey]);
  
  // Save draft with debounce
  const saveDraft = useCallback((data: Partial<AnalysisDraftData>) => {
    if (!storageKey) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      try {
        const updatedDraft: AnalysisDraftData = {
          ...draft,
          ...data,
          lastSavedAt: new Date().toISOString(),
        };
        
        localStorage.setItem(storageKey, JSON.stringify(updatedDraft));
        setDraft(updatedDraft);
        setHasDraft(true);
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    }, DEBOUNCE_DELAY);
  }, [storageKey, draft]);
  
  // Clear draft
  const clearDraft = useCallback(() => {
    if (!storageKey) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    try {
      localStorage.removeItem(storageKey);
      setDraft(null);
      setHasDraft(false);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [storageKey]);
  
  // Get formatted last saved time
  const getLastSavedTime = useCallback(() => {
    if (!draft?.lastSavedAt) return null;
    
    const date = new Date(draft.lastSavedAt);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [draft?.lastSavedAt]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  return {
    draft,
    hasDraft,
    isLoading,
    saveDraft,
    clearDraft,
    getLastSavedTime,
  };
}
