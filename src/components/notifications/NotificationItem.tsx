import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, RefreshCw, FileText, CheckCircle, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notifications';
import { getNotificationConfig, getSourceLabel } from '@/types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  RefreshCw,
  FileText,
  CheckCircle,
};

export function NotificationItem({ notification, onRead, onDelete, onClick }: NotificationItemProps) {
  const config = getNotificationConfig(notification.type);
  const Icon = iconMap[config.icon] || MessageSquare;
  const isUnread = !notification.read_at;
  
  const handleClick = () => {
    if (isUnread) {
      onRead(notification.id);
    }
    onClick(notification);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
        "hover:bg-muted/50 border",
        isUnread 
          ? `${config.bgColor} ${config.borderColor}` 
          : "bg-background border-transparent hover:border-border"
      )}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2">
          <Circle className="h-2 w-2 fill-primary text-primary" />
        </div>
      )}
      
      {/* Icon */}
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        config.bgColor
      )}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                config.bgColor, config.color
              )}>
                {getSourceLabel(notification.source)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
            <p className={cn(
              "text-sm font-medium truncate",
              isUnread ? "text-foreground" : "text-muted-foreground"
            )}>
              {notification.title}
            </p>
            {notification.message && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {notification.metadata?.sender_name && (
                  <span className="font-medium">{notification.metadata.sender_name}: </span>
                )}
                {notification.message}
              </p>
            )}
            {notification.metadata?.ticket_subject && (
              <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                {notification.metadata.ticket_subject}
              </p>
            )}
            {notification.metadata?.tenant_name && (
              <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                Inquilino: {notification.metadata.tenant_name}
              </p>
            )}
          </div>
          
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}
