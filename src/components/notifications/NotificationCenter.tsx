import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NotificationItem } from './NotificationItem';
import { 
  useNotifications, 
  useUnreadCount, 
  useMarkAsRead, 
  useMarkAllAsRead,
  useDeleteNotification 
} from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useAgencyPath } from '@/hooks/useAgencyPath';
import type { Notification, NotificationSource } from '@/types/notifications';

interface NotificationCenterProps {
  isAgencyPortal?: boolean;
}

export function NotificationCenter({ isAgencyPortal = false }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | NotificationSource>('all');
  const navigate = useNavigate();
  const { role } = useAuth();
  const { agencyPath } = useAgencyPath();
  const { playSound } = useNotificationSound();
  
  // Callback to play sound when new notification arrives
  const handleNewNotification = useCallback(() => {
    console.log('[NotificationCenter] New notification received, playing sound');
    playSound();
  }, [playSound]);
  
  const { data: notifications = [], isLoading } = useNotifications(
    activeTab === 'all' ? undefined : activeTab,
    { onNewNotification: handleNewNotification }
  );
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const handleNotificationClick = (notification: Notification) => {
    setOpen(false);
    
    // Mark as read when clicking
    if (!notification.read_at) {
      markAsRead.mutate(notification.id);
    }
    
    // Navigate based on notification type and portal
    if (notification.source === 'chamados') {
      if (isAgencyPortal) {
        navigate(agencyPath('/support'), { state: { ticketId: notification.reference_id } });
      } else {
        navigate('/tickets', { state: { ticketId: notification.reference_id } });
      }
    } else if (notification.source === 'analises') {
      if (isAgencyPortal) {
        navigate(agencyPath('/analyses'), { state: { analysisId: notification.reference_id } });
      } else {
        navigate('/analyses', { state: { analysisId: notification.reference_id } });
      }
    } else if (notification.source === 'contratos') {
      if (isAgencyPortal) {
        navigate(agencyPath('/contracts'), { state: { contractId: notification.reference_id } });
      } else {
        navigate('/contracts', { state: { contractId: notification.reference_id } });
      }
    } else if (notification.source === 'sinistros') {
      if (isAgencyPortal) {
        navigate(agencyPath(`/claims/${notification.reference_id}`));
      } else {
        navigate(`/claims/${notification.reference_id}`);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.source === activeTab);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold",
                "animate-pulse"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[420px] p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Notificações</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Marcar todas
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="px-4 py-2 border-b bg-muted/30">
            <TabsList className="w-full h-8">
              <TabsTrigger value="all" className="text-xs flex-1">
                Todas
              </TabsTrigger>
              <TabsTrigger value="chamados" className="text-xs flex-1">
                Chamados
              </TabsTrigger>
              <TabsTrigger value="analises" className="text-xs flex-1">
                Análises
              </TabsTrigger>
              <TabsTrigger value="contratos" className="text-xs flex-1">
                Contratos
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma notificação
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Você será notificado sobre novas mensagens e atualizações
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={(id) => markAsRead.mutate(id)}
                      onDelete={(id) => deleteNotification.mutate(id)}
                      onClick={handleNotificationClick}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
