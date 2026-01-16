import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageCircle, Send, Loader2, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useCreateRenewalNotification } from '@/hooks/useRenewalNotifications';
import { supabase } from '@/integrations/supabase/client';

interface RenewalNotificationActionsProps {
  contractId: string;
  renewalId?: string;
  tenantName: string;
  tenantEmail: string | null;
  tenantPhone: string | null;
  propertyAddress: string;
  dataFimContrato: string | null;
}

export function RenewalNotificationActions({
  contractId,
  renewalId,
  tenantName,
  tenantEmail,
  tenantPhone,
  propertyAddress,
  dataFimContrato,
}: RenewalNotificationActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const createNotification = useCreateRenewalNotification();

  // Default message template
  const defaultMessage = `Olá ${tenantName}!

Seu contrato de locação do imóvel ${propertyAddress} está próximo do vencimento${dataFimContrato ? ` (${format(new Date(dataFimContrato), "dd/MM/yyyy", { locale: ptBR })})` : ''}.

Para dar continuidade à sua garantia locatícia Tridots, é necessário aceitar os novos termos de renovação.

Acesse o link abaixo para visualizar e aceitar os termos:
[Link será enviado automaticamente]

Em caso de dúvidas, entre em contato conosco.

Atenciosamente,
Equipe Tridots`;

  const [customMessage, setCustomMessage] = useState(defaultMessage);

  // Format phone for WhatsApp (remove non-digits, ensure country code)
  const formatPhoneForWhatsApp = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    // If starts with 0, remove it
    const cleaned = digits.startsWith('0') ? digits.slice(1) : digits;
    // Add Brazil country code if not present
    return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  };

  const handleWhatsAppClick = async () => {
    if (!tenantPhone) {
      toast.error('Telefone do inquilino não informado');
      return;
    }

    const formattedPhone = formatPhoneForWhatsApp(tenantPhone);
    const encodedMessage = encodeURIComponent(customMessage);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    // Log the notification
    await createNotification.mutateAsync({
      contract_id: contractId,
      renewal_id: renewalId,
      channel: 'whatsapp',
      recipient_name: tenantName,
      recipient_phone: tenantPhone,
      message_preview: customMessage.slice(0, 100)
    });

    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp aberto em nova aba');
  };

  const handleSendEmail = async () => {
    if (!tenantEmail) {
      toast.error('E-mail do inquilino não informado');
      return;
    }

    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-renewal-notification', {
        body: {
          contractId,
          renewalId,
          channel: 'email',
          recipientEmail: tenantEmail,
          recipientName: tenantName,
          message: customMessage
        }
      });

      if (error) throw error;

      // Log the notification
      await createNotification.mutateAsync({
        contract_id: contractId,
        renewal_id: renewalId,
        channel: 'email',
        recipient_name: tenantName,
        recipient_email: tenantEmail,
        message_preview: customMessage.slice(0, 100)
      });

      toast.success('E-mail enviado com sucesso!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    toast.success('Mensagem copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContactInfo = tenantEmail || tenantPhone;

  if (!hasContactInfo) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            Notificar Inquilino
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Nenhum contato do inquilino disponível.</p>
            <p className="text-xs mt-1">Adicione e-mail ou telefone na análise.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4" />
          Notificar Inquilino sobre Renovação
        </CardTitle>
        <CardDescription>
          Envie uma mensagem para o inquilino sobre a renovação do contrato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {tenantPhone && (
            <Button 
              variant="outline" 
              onClick={handleWhatsAppClick}
              disabled={createNotification.isPending}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar WhatsApp
            </Button>
          )}
          {tenantEmail && (
            <Button 
              variant="outline" 
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Enviar E-mail
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ocultar Mensagem' : 'Personalizar Mensagem'}
          </Button>
        </div>

        {/* Contact Info */}
        <div className="text-sm text-muted-foreground">
          <p><strong>Destinatário:</strong> {tenantName}</p>
          {tenantEmail && <p><strong>E-mail:</strong> {tenantEmail}</p>}
          {tenantPhone && <p><strong>Telefone:</strong> {tenantPhone}</p>}
        </div>

        {/* Expanded Message Editor */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex justify-between items-center">
              <Label>Mensagem</Label>
              <Button variant="ghost" size="sm" onClick={handleCopyMessage}>
                {copied ? (
                  <Check className="h-4 w-4 mr-1 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCustomMessage(defaultMessage)}
            >
              Restaurar Mensagem Padrão
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
