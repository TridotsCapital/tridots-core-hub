import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageCircle, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RenewalNotification } from '@/hooks/useRenewalNotifications';

interface RenewalNotificationHistoryProps {
  notifications: RenewalNotification[];
}

const CHANNEL_CONFIG = {
  email: { label: 'E-mail', icon: Mail, color: 'text-blue-600' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
  both: { label: 'E-mail + WhatsApp', icon: Bell, color: 'text-purple-600' }
};

const STATUS_CONFIG = {
  sent: { label: 'Enviado', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  delivered: { label: 'Entregue', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  failed: { label: 'Falhou', icon: XCircle, color: 'bg-red-100 text-red-700' },
  clicked: { label: 'Clicado', icon: ExternalLink, color: 'bg-blue-100 text-blue-700' }
};

export function RenewalNotificationHistory({ notifications }: RenewalNotificationHistoryProps) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações Enviadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação de renovação enviada ainda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notificações Enviadas ({notifications.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map((notification) => {
            const channelConfig = CHANNEL_CONFIG[notification.channel];
            const statusConfig = STATUS_CONFIG[notification.status];
            const ChannelIcon = channelConfig.icon;
            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={notification.id} 
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className={`p-2 rounded-full bg-muted ${channelConfig.color}`}>
                  <ChannelIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {channelConfig.label}
                    </span>
                    <Badge variant="outline" className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Para: {notification.recipient_name}
                    {notification.recipient_email && ` (${notification.recipient_email})`}
                    {notification.recipient_phone && ` - ${notification.recipient_phone}`}
                  </p>
                  {notification.message_preview && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      "{notification.message_preview}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
