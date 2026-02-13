import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QuickReply, TicketStatus } from "@/types/tickets";
import { Send, Zap, Paperclip, ChevronDown, X, FileIcon, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface TicketChatInputProps {
  onSendMessage: (message: string, attachments?: string[]) => void;
  onTyping: () => void;
  isSending: boolean;
  quickReplies?: QuickReply[];
  isDisabled?: boolean;
  ticketStatus?: TicketStatus;
}

interface PendingFile {
  file: File;
  preview?: string;
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
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles: PendingFile[] = files.map(file => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));

    setPendingFiles(prev => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length === 0) return;
    
    e.preventDefault();
    
    const newFiles: PendingFile[] = [];
    for (const item of imageItems) {
      const blob = item.getAsFile();
      if (!blob) continue;
      const now = new Date();
      const name = `print-${format(now, "yyyy-MM-dd-HH'h'mm")}.png`;
      const file = new File([blob], name, { type: blob.type });
      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }
    
    if (newFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const removeFile = (index: number) => {
    setPendingFiles(prev => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (pendingFiles.length === 0) return [];
    
    const urls: string[] = [];
    
    for (const { file } of pendingFiles) {
      const ext = file.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(path);
      
      urls.push(urlData.publicUrl);
    }
    
    return urls;
  };

  const handleSend = async () => {
    if ((!message.trim() && pendingFiles.length === 0) || isSending || isUploading) return;
    
    try {
      setIsUploading(true);
      const attachmentUrls = await uploadFiles();
      
      onSendMessage(message.trim(), attachmentUrls.length > 0 ? attachmentUrls : undefined);
      setMessage("");
      pendingFiles.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
      setPendingFiles([]);
      textareaRef.current?.focus();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erro ao enviar anexos");
    } finally {
      setIsUploading(false);
    }
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

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled || isSending || isUploading}
        >
          <Paperclip className="h-3.5 w-3.5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
      </div>

      {/* Pending files preview */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {pendingFiles.map((pf, idx) => (
            <div 
              key={idx} 
              className="relative group bg-muted rounded-lg p-2 flex items-center gap-2 pr-8"
            >
              {pf.preview ? (
                <img 
                  src={pf.preview} 
                  alt={pf.file.name} 
                  className="h-10 w-10 object-cover rounded"
                />
              ) : (
                <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                  <FileIcon className="h-5 w-5 text-primary" />
                </div>
              )}
              <span className="text-xs truncate max-w-[100px]">{pf.file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Digite sua mensagem..."
          className="min-h-[44px] max-h-32 resize-none"
          disabled={isDisabled || isSending || isUploading}
        />
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && pendingFiles.length === 0) || isSending || isDisabled || isUploading}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
