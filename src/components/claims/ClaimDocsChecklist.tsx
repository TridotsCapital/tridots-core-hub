import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ClaimDocsChecklistProps {
  claimId: string;
  checklist: Record<string, boolean>;
}

const checklistItems = [
  { key: 'contrato', label: 'Contrato de Locação' },
  { key: 'boletos', label: 'Boletos Vencidos' },
  { key: 'notificacao', label: 'Notificação Extrajudicial' },
  { key: 'vistoria', label: 'Laudo de Vistoria' },
  { key: 'acordo', label: 'Proposta de Acordo' },
];

export function ClaimDocsChecklist({ claimId, checklist }: ClaimDocsChecklistProps) {
  const [localChecklist, setLocalChecklist] = useState<Record<string, boolean>>(checklist);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasChanges = JSON.stringify(localChecklist) !== JSON.stringify(checklist);
  const completedCount = Object.values(localChecklist).filter(Boolean).length;
  const totalCount = checklistItems.length;

  const handleToggle = (key: string) => {
    setLocalChecklist(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('claims')
        .update({ docs_checklist: localChecklist })
        .eq('id', claimId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({
        title: 'Checklist salvo',
        description: 'A documentação foi atualizada.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o checklist.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Documentação
            <Badge variant="outline" className="text-xs">
              {completedCount}/{totalCount}
            </Badge>
          </CardTitle>
          {hasChanges && (
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={localChecklist[item.key] || false}
                onCheckedChange={() => handleToggle(item.key)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className={`text-sm transition-colors ${
                localChecklist[item.key] 
                  ? 'text-muted-foreground line-through' 
                  : 'text-foreground group-hover:text-primary'
              }`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>

        {completedCount < totalCount && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              {totalCount - completedCount} documento(s) pendente(s) de verificação
            </p>
          </div>
        )}

        {completedCount === totalCount && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 flex items-center gap-1">
              <FileCheck className="h-3 w-3" />
              Documentação completa
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
