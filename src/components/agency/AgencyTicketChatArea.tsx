import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Loader2, Clock, CheckCircle, AlertCircle, MessageSquare, FileText, XCircle, Shield, Paperclip, X, FileIcon, Download, Eye, MailOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTicket,
  useTicketMessages,
  useSendTicketMessage,
  useUpdateTicket,
} from "@/hooks/useTickets";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useNps } from "@/contexts/NpsContext";
import { TicketStatus, TicketCategory } from "@/types/tickets";
import { CloseTicketDialog } from "./CloseTicketDialog";
import { cn, getFileNameFromUrl, viewFileViaBlob, downloadFileViaBlob, buildStoragePath, formatDateBR } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMarkItemAsUnread } from "@/hooks/useUnreadItemIds";

function getDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

interface AgencyTicketChatAreaProps {
  ticketId: string | null;
}

interface PendingFile {
  file: File;
  preview?: string;
}

const statusConfig: Record<TicketStatus, { label: string; className: string; icon: React.ElementType }> = {
  aberto: {
    label: "Aberto",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  em_atendimento: {
    label: "Em Atendimento",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: AlertCircle,
  },
  aguardando_cliente: {
    label: "Aguardando Resposta",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    icon: Clock,
  },
  resolvido: {
    label: "Resolvido",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
};

const categoryConfig: Record<TicketCategory, { label: string; className: string }> = {
  financeiro: {
    label: "Financeiro",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  tecnico: {
    label: "Técnico",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  comercial: {
    label: "Comercial",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  urgente: {
    label: "Urgente",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  solicitacao_link: {
    label: "Solicitação de Link",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

const handleViewFile = async (url: string) => {
  try {
    await viewFileViaBlob(url);
  } catch {
    toast.error("Erro ao visualizar arquivo");
  }
};

const handleDownloadFile = async (url: string) => {
  try {
    await downloadFileViaBlob(url);
  } catch {
    toast.error("Erro ao baixar arquivo");
  }
};

export function AgencyTicketChatArea({ ticketId }: AgencyTicketChatAreaProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { playSound } = useNotificationSound();
  const { openModalAfterClose } = useNps();
  const markAsUnread = useMarkItemAsUnread();

  const handleNewMessage = useCallback((senderId: string) => {
    if (senderId !== user?.id) {
      playSound();
    }
  }, [user?.id, playSound]);

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId || undefined);
  const { data: messages = [], isLoading: messagesLoading } = useTicketMessages(ticketId || undefined, {
    onNewMessage: handleNewMessage,
  });
  const sendMessage = useSendTicketMessage();
  const updateTicket = useUpdateTicket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Paste handler for images
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
      const path = buildStoragePath(file.name);
      
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

  const handleCloseTicket = async () => {
    if (!ticketId || !user) return;
    
    setIsClosing(true);
    try {
      await updateTicket.mutateAsync({
        ticketId,
        updates: {
          status: "resolvido" as TicketStatus,
          resolved_at: new Date().toISOString(),
          closed_by: user.id,
          closed_by_type: "agency",
        },
      });
      setShowCloseDialog(false);
      await openModalAfterClose();
    } finally {
      setIsClosing(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && pendingFiles.length === 0) || !ticketId || !user) return;

    try {
      setIsUploading(true);
      const attachmentUrls = await uploadFiles();

      await sendMessage.mutateAsync({
        ticketId,
        message: message.trim() || (attachmentUrls.length > 0 ? "📎 Anexo" : ""),
        attachmentsUrl: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      });

      // If awaiting client response, update to em_atendimento
      if (ticket?.status === "aguardando_cliente") {
        await updateTicket.mutateAsync({
          ticketId,
          updates: { status: "em_atendimento" },
        });
      }

      setMessage("");
      pendingFiles.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
      setPendingFiles([]);
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
      handleSendMessage();
    }
  };

  // Empty state
  if (!ticketId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
        <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
        <h3 className="text-lg font-medium">Selecione um chamado</h3>
        <p className="text-sm mt-1">Escolha um chamado na lista para visualizar a conversa</p>
      </div>
    );
  }

  // Loading state
  if (ticketLoading) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Chamado não encontrado
      </div>
    );
  }

  const isResolved = ticket.status === "resolvido";
  const closedByAgency = (ticket as any).closed_by_type === "agency";

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            #{ticket.id.slice(0, 8).toUpperCase()}
          </span>
          <Badge
            variant="outline"
            className={cn("text-xs shrink-0", categoryConfig[ticket.category as TicketCategory].className)}
          >
            {categoryConfig[ticket.category as TicketCategory].label}
          </Badge>
          {(ticket as any).claim_id && (
            <Badge
              variant="secondary"
              className="text-xs shrink-0 cursor-pointer hover:bg-amber-200 bg-amber-100 text-amber-700"
              onClick={() => navigate(`/agency/claims/${(ticket as any).claim_id}`)}
            >
              <Shield className="h-3 w-3 mr-1" />
              Garantia
            </Badge>
          )}
          {(ticket as any).contract_id && !(ticket as any).claim_id && (
            <Badge
              variant="secondary"
              className="text-xs shrink-0 cursor-pointer hover:bg-secondary/80"
              onClick={() => navigate(`/agency/contracts/${(ticket as any).contract_id}`)}
            >
              <FileText className="h-3 w-3 mr-1" />
              Contrato
            </Badge>
          )}
          {ticket.analysis_id && !(ticket as any).contract_id && !(ticket as any).claim_id && (
            <Badge
              variant="secondary"
              className="text-xs shrink-0 cursor-pointer hover:bg-secondary/80 bg-blue-100 text-blue-700"
              onClick={() => navigate(`/agency/analyses`)}
            >
              <FileText className="h-3 w-3 mr-1" />
              Análise
            </Badge>
          )}
          <h2 className="font-semibold text-sm truncate">
            {ticket.subject}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Marcar como não lido"
            onClick={async () => {
              await markAsUnread(ticketId, 'chamados');
              toast.info("Chamado marcado como não lido");
            }}
          >
            <MailOpen className="h-3.5 w-3.5" />
          </Button>
          {!isResolved && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloseDialog(true)}
              className="text-xs"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Encerrar
            </Button>
          )}
          <Badge
            variant="outline"
            className={cn("shrink-0", statusConfig[ticket.status as TicketStatus].className)}
          >
            {statusConfig[ticket.status as TicketStatus].label}
          </Badge>
          {isResolved && closedByAgency && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
              Encerrado por você
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-2 space-y-3">
          {/* Description as first message */}
          {ticket.description && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-muted">?</AvatarFallback>
              </Avatar>
              <div className="max-w-[80%]">
                <div className="bg-muted p-3 rounded-tr-2xl rounded-tl-sm rounded-b-2xl">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descrição do chamado:</p>
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>
            </div>
          )}
          
          {messagesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 && !ticket.description ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Aguarde a resposta da equipe Tridots.</p>
            </div>
          ) : (
            messages.map((msg: any, index: number) => {
              const isOwnMessage = msg.sender_id === user?.id;
              const senderName = msg.sender?.full_name || "Usuário";
              const initials = senderName
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              const currentDate = getDateLabel(msg.created_at);
              const prevDate = index > 0 ? getDateLabel(messages[index - 1].created_at) : null;
              const showDateSeparator = index === 0 || currentDate !== prevDate;

              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] font-medium text-muted-foreground bg-background px-2">
                        {currentDate}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                <div
                  className={cn(
                    "flex gap-3",
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-xs",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn("max-w-[80%]", isOwnMessage && "text-right")}>
                    <div className={cn("flex items-center gap-2 mb-1", isOwnMessage && "flex-row-reverse")}>
                      <span className="text-xs font-medium">
                        {isOwnMessage ? "Você" : senderName}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "inline-block px-4 py-2 text-sm",
                        isOwnMessage
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
                          {msg.attachments_url.map((url: string, idx: number) => (
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
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg border",
                                  isOwnMessage 
                                    ? "bg-primary-foreground/10 text-primary-foreground" 
                                    : "bg-background"
                                )}
                              >
                                <FileIcon className="h-4 w-4 shrink-0" />
                                <span className="text-xs truncate max-w-[120px]">{getFileNameFromUrl(url)}</span>
                                <div className="flex items-center gap-1 ml-auto shrink-0">
                                  <button
                                    onClick={() => handleViewFile(url)}
                                    className="p-1 rounded hover:bg-foreground/10 transition-colors"
                                    title="Visualizar"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadFile(url)}
                                    className="p-1 rounded hover:bg-foreground/10 transition-colors"
                                    title="Baixar"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={cn("flex items-center gap-1 mt-1", isOwnMessage && "justify-end")}>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Compact Input */}
      <div className="px-4 py-2 border-t bg-background">
        {isResolved ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Este chamado foi resolvido
          </div>
        ) : (
          <>
            {/* Pending files preview */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
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
              <Button 
                variant="outline" 
                size="icon" 
                className="h-[44px] w-11 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendMessage.isPending || isUploading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <Textarea
                ref={textareaRef}
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className="min-h-[44px] max-h-[120px] resize-none"
                disabled={sendMessage.isPending || isUploading}
              />
              <Button
                size="icon"
                className="h-[44px] w-11 shrink-0"
                onClick={handleSendMessage}
                disabled={(!message.trim() && pendingFiles.length === 0) || sendMessage.isPending || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Close Ticket Dialog */}
      <CloseTicketDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        onConfirm={handleCloseTicket}
        isLoading={isClosing}
        ticketSubject={ticket.subject}
      />
    </div>
  );
}