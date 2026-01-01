import { useRef, useEffect } from "react";
import { TicketMessage, TypingIndicator } from "@/types/tickets";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CheckCheck, FileIcon, Download, Image as ImageIcon } from "lucide-react";

interface TicketChatMessagesProps {
  messages: TicketMessage[];
  description?: string;
  currentUserId?: string;
  isLoading: boolean;
  typingUsers?: TypingIndicator[];
}

export function TicketChatMessages({
  messages,
  description,
  currentUserId,
  isLoading,
  typingUsers = [],
}: TicketChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "" : "flex-row-reverse")}>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className={cn("h-16 w-64", i % 2 === 0 ? "rounded-tl-sm" : "rounded-tr-sm")} />
          </div>
        ))}
      </div>
    );
  }

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'arquivo';
  };

  const otherTypingUsers = typingUsers.filter(t => t.user_id !== currentUserId);

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-2 space-y-3">
        {/* Initial description as first message */}
        {description && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-muted">?</AvatarFallback>
            </Avatar>
            <div className="max-w-[75%]">
              <div className="bg-muted p-3 rounded-tr-2xl rounded-tl-sm rounded-b-2xl">
                <p className="text-sm font-medium text-muted-foreground mb-1">Descrição do chamado:</p>
                <p className="text-sm whitespace-pre-wrap">{description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          const senderName = msg.sender?.full_name || 'Usuário';
          const initials = senderName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

          return (
            <div
              key={msg.id}
              className={cn("flex gap-3", isOwn && "flex-row-reverse")}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={msg.sender?.avatar_url || undefined} />
                <AvatarFallback className={cn("text-xs", isOwn ? "bg-primary/20" : "bg-muted")}>
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className={cn("max-w-[75%]", isOwn && "items-end")}>
                <div className={cn("flex items-center gap-2 mb-1", isOwn && "flex-row-reverse")}>
                  <span className="text-xs font-medium">{senderName}</span>
                </div>
                <div
                  className={cn(
                    "p-3 text-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-tl-2xl rounded-tr-sm rounded-b-2xl"
                      : "bg-muted rounded-tr-2xl rounded-tl-sm rounded-b-2xl"
                  )}
                >
                  {msg.message && (
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  )}
                  
                  {/* Attachments */}
                  {msg.attachments_url && msg.attachments_url.length > 0 && (
                    <div className={cn("mt-2 space-y-2", !msg.message && "mt-0")}>
                      {msg.attachments_url.map((url, idx) => (
                        isImageUrl(url) ? (
                          <a 
                            key={idx}
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img 
                              src={url} 
                              alt="Anexo" 
                              className="max-w-[200px] rounded-lg border hover:opacity-90 transition-opacity"
                            />
                          </a>
                        ) : (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                              isOwn 
                                ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground" 
                                : "bg-background hover:bg-muted"
                            )}
                          >
                            <FileIcon className="h-4 w-4 shrink-0" />
                            <span className="text-xs truncate max-w-[150px]">{getFileName(url)}</span>
                            <Download className="h-3 w-3 shrink-0 ml-auto" />
                          </a>
                        )
                      ))}
                    </div>
                  )}
                </div>
                <div className={cn("flex items-center gap-1 mt-1", isOwn && "justify-end")}>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </span>
                  {isOwn && msg.is_read && (
                    <CheckCheck className="h-3 w-3 text-primary" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {otherTypingUsers.length > 0 && (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-muted">
                {otherTypingUsers[0].user?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-muted-foreground">
                {otherTypingUsers.map(t => t.user?.full_name).join(", ")} está digitando...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
