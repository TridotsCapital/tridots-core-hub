import { useState } from 'react';
import { useInternalNotes, useAddInternalNote, ReferenceType } from '@/hooks/useInternalNotes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { StickyNote, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InternalNotesTabProps {
  referenceType: ReferenceType;
  referenceId: string;
}

export function InternalNotesTab({ referenceType, referenceId }: InternalNotesTabProps) {
  const [newNote, setNewNote] = useState('');
  const { data: notes, isLoading } = useInternalNotes(referenceType, referenceId);
  const addNote = useAddInternalNote();

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    await addNote.mutateAsync({
      referenceType,
      referenceId,
      content: newNote.trim(),
    });

    setNewNote('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Add new note */}
      <div className="p-4 border-b space-y-3">
        <Textarea
          placeholder="Adicione uma nota interna..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <Button
          onClick={handleAddNote}
          disabled={!newNote.trim() || addNote.isPending}
          className="w-full"
        >
          {addNote.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Adicionar Nota
        </Button>
      </div>

      {/* Notes list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!notes || notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <StickyNote className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Nenhuma nota registrada</p>
              <p className="text-sm">Adicione uma nota acima para começar</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="flex gap-3 p-3 rounded-lg bg-muted/50 border"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={note.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(note.profile?.full_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {note.profile?.full_name || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
