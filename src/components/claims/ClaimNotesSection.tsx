import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, StickyNote, Trash2, Phone, Mail, FileText, MapPin, Handshake, Receipt, MoreHorizontal } from 'lucide-react';
import { useClaimNotes, useCreateClaimNote, useDeleteClaimNote, noteTypeLabels } from '@/hooks/useClaimNotes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ClaimNotesSectionProps {
  claimId: string;
}

const noteTypeIcons: Record<string, typeof StickyNote> = {
  observacao: StickyNote,
  ligacao: Phone,
  email: Mail,
  carta: FileText,
  visita: MapPin,
  acordo: Handshake,
  cobranca: Receipt,
  outro: MoreHorizontal,
};

const noteTypeColors: Record<string, string> = {
  observacao: 'bg-blue-100 text-blue-700',
  ligacao: 'bg-green-100 text-green-700',
  email: 'bg-purple-100 text-purple-700',
  carta: 'bg-orange-100 text-orange-700',
  visita: 'bg-teal-100 text-teal-700',
  acordo: 'bg-emerald-100 text-emerald-700',
  cobranca: 'bg-amber-100 text-amber-700',
  outro: 'bg-gray-100 text-gray-700',
};

export function ClaimNotesSection({ claimId }: ClaimNotesSectionProps) {
  const { role } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [noteType, setNoteType] = useState('observacao');
  const [content, setContent] = useState('');

  const { data: notes, isLoading } = useClaimNotes(claimId);
  const createNote = useCreateClaimNote();
  const deleteNote = useDeleteClaimNote();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    await createNote.mutateAsync({
      claim_id: claimId,
      note_type: noteType,
      content: content.trim(),
    });
    
    setContent('');
    setNoteType('observacao');
    setIsAdding(false);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote.mutateAsync({ noteId, claimId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notas de Cobrança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notas de Cobrança
            {notes && notes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {notes.length}
              </Badge>
            )}
          </CardTitle>
          {!isAdding && (
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {isAdding && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo de nota" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(noteTypeLabels).map(([key, label]) => {
                  const Icon = noteTypeIcons[key] || StickyNote;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Descreva a ação realizada ou observação..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsAdding(false);
                  setContent('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubmit}
                disabled={!content.trim() || createNote.isPending}
              >
                {createNote.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <ScrollArea className="max-h-[400px]">
          {!notes || notes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma nota registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => {
                const Icon = noteTypeIcons[note.note_type] || StickyNote;
                const colorClass = noteTypeColors[note.note_type] || noteTypeColors.outro;
                
                return (
                  <div 
                    key={note.id} 
                    className="p-3 border rounded-lg bg-card hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs', colorClass)}>
                          <Icon className="h-3 w-3 mr-1" />
                          {noteTypeLabels[note.note_type] || 'Nota'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {role === 'master' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(note.id)}
                          disabled={deleteNote.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      por {note.creator?.full_name || 'Usuário'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
