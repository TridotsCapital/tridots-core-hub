import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat, useSendMessage } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useNps } from '@/contexts/NpsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Paperclip, Loader2, File, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatSectionProps {
  analysisId: string;
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export function ChatSection({ analysisId }: ChatSectionProps) {
  const { user } = useAuth();
  const { playSound } = useNotificationSound();
  const { hasPendingNps, showNpsModal } = useNps();
  
  // Play sound when new message arrives from someone else
  const handleNewMessage = useCallback((senderId: string) => {
    if (senderId !== user?.id) {
      playSound();
    }
  }, [user?.id, playSound]);

  const { data: messages, isLoading } = useChat(analysisId, {
    onNewMessage: handleNewMessage,
  });
  const sendMessage = useSendMessage();
  
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (hasPendingNps) {
      showNpsModal();
      return;
    }
    
    if (!message.trim() && !attachment) return;

    sendMessage.mutate({
      analysisId,
      message: message.trim(),
      attachment: attachment || undefined,
    });

    setMessage('');
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Nenhuma mensagem ainda. Inicie a conversa!
          </div>
        ) : (
          <div className="space-y-4">
            {messages?.map((msg) => {
              const isOwn = msg.sender_id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    isOwn && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={cn(
                      'text-xs',
                      isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {msg.sender?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn(
                    'flex flex-col max-w-[70%]',
                    isOwn && 'items-end'
                  )}>
                    <div className={cn(
                      'rounded-lg px-3 py-2',
                      isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      
                      {msg.attachment_url && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'flex items-center gap-2 mt-2 p-2 rounded text-xs',
                            isOwn ? 'bg-primary-foreground/10' : 'bg-background'
                          )}
                        >
                          <File className="h-4 w-4" />
                          <span className="truncate">{msg.attachment_name}</span>
                          <span className="text-muted-foreground">{formatFileSize(msg.attachment_size)}</span>
                        </a>
                      )}
                    </div>
                    
                    <span className="text-xs text-muted-foreground mt-1">
                      {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-4">
        {hasPendingNps ? (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Você possui chamados pendentes de avaliação.{" "}
              <button 
                onClick={showNpsModal} 
                className="font-medium underline hover:no-underline"
              >
                Avaliar agora
              </button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {attachment && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate flex-1">{attachment.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachment(null)}
                  className="h-6 px-2"
                >
                  Remover
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1"
              />

              <Button
                onClick={handleSend}
                disabled={sendMessage.isPending || (!message.trim() && !attachment)}
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
