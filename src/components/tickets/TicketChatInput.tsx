import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QuickReply, TicketStatus } from "@/types/tickets";
import { Send, Zap, Paperclip, ChevronDown } from "lucide-react";

interface TicketChatInputProps {
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  isSending: boolean;
  quickReplies?: QuickReply[];
  isDisabled?: boolean;
  ticketStatus?: TicketStatus;
}

export function TicketChatInput({
  onSendMessage,
  onTyping,
  isSending,
  quickReplies = [],
  isDisabled = false,
  ticketStatus,
}: TicketChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || isSending) return;
    onSendMessage(message.trim());
    setMessage("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (content: string) => {
    setMessage(content);
    textareaRef.current?.focus();
  };

  const isResolved = ticketStatus === 'resolvido';

  if (isResolved) {
    return (
      <div className="p-4 border-t bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          Este chamado foi resolvido. Altere o status para enviar novas mensagens.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 h-8"
              disabled={quickReplies.length === 0}
            >
              <Zap className="h-3.5 w-3.5" />
              Respostas Rápidas
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="space-y-1 max-h-64 overflow-auto">
              {quickReplies.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">
                  Nenhuma resposta rápida disponível
                </p>
              ) : (
                quickReplies.map((reply) => (
                  <button
                    key={reply.id}
                    onClick={() => handleQuickReply(reply.content)}
                    className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium">{reply.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {reply.content}
                    </p>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" className="h-8" disabled>
          <Paperclip className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="min-h-[44px] max-h-32 resize-none"
          disabled={isDisabled || isSending}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending || isDisabled}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
