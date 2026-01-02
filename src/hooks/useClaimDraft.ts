import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ClaimItemCategory, ClaimFileType } from '@/types/claims';

export interface DraftClaimItem {
  id: string; // ID temporário para UI
  category: ClaimItemCategory;
  description: string;
  reference_period: string;
  due_date: string;
  amount: number;
}

export interface DraftClaimFile {
  id: string; // ID temporário para UI
  file: File;
  file_type: ClaimFileType;
  preview?: string;
}

export interface ClaimDraftData {
  contractId?: string;
  observations?: string;
  items: DraftClaimItem[];
  files: DraftClaimFile[];
  lastSavedAt?: string;
}

const DRAFT_KEY_PREFIX = 'tridots_draft_claim_';
const DEBOUNCE_DELAY = 1000;

export function useClaimDraft() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<ClaimDraftData | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const storageKey = user ? `${DRAFT_KEY_PREFIX}${user.id}` : null;
  
  // Load draft on mount (only metadata, not files)
  useEffect(() => {
    if (!storageKey) {
      setIsLoading(false);
      return;
    }
    
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as Omit<ClaimDraftData, 'files'> & { files: never[] };
        // Files cannot be restored from localStorage, so we start with empty
        setDraft({ ...parsed, files: [] });
        setHasDraft(true);
      }
    } catch (error) {
      console.error('Error loading claim draft:', error);
    }
    
    setIsLoading(false);
  }, [storageKey]);
  
  // Save draft with debounce
  const saveDraft = useCallback((data: Partial<ClaimDraftData>) => {
    if (!storageKey) return;
    
    setIsSaving(true);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      try {
        const updatedDraft: ClaimDraftData = {
          contractId: data.contractId ?? draft?.contractId,
          observations: data.observations ?? draft?.observations ?? '',
          items: data.items ?? draft?.items ?? [],
          files: data.files ?? draft?.files ?? [],
          lastSavedAt: new Date().toISOString(),
        };
        
        // Save to localStorage (without file objects, only metadata)
        const toSave = {
          ...updatedDraft,
          files: [], // Files can't be saved to localStorage
        };
        
        localStorage.setItem(storageKey, JSON.stringify(toSave));
        setDraft(updatedDraft);
        setHasDraft(true);
      } catch (error) {
        console.error('Error saving claim draft:', error);
      } finally {
        setIsSaving(false);
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
      console.error('Error clearing claim draft:', error);
    }
  }, [storageKey]);
  
  // Get formatted last saved time
  const getLastSavedTime = useCallback(() => {
    if (!draft?.lastSavedAt) return null;
    const date = new Date(draft.lastSavedAt);
    return date.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [draft?.lastSavedAt]);
  
  // Calculate total from items
  const getTotalValue = useCallback(() => {
    if (!draft?.items) return 0;
    return draft.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [draft?.items]);
  
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
    isSaving,
    saveDraft,
    clearDraft,
    getLastSavedTime,
    getTotalValue,
  };
}
