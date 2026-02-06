import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationCenter } from '@/components/notifications';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  FileSearch,
  DollarSign,
  TrendingUp,
  FolderOpen,
  ScrollText,
  Users,
  LogOut,
  Headphones,
  FileCheck,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import logoWhite from "@/assets/logo-tridots-white.webp";

// Map paths to notification sources
const pathToSource: Record<string, 'chamados' | 'analises' | 'contratos' | 'garantias'> = {
  '/tickets': 'chamados',
  '/analyses': 'analises',
  '/contracts': 'contratos',
  '/claims': 'garantias',
};

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    title: 'Chamados',
    icon: Headphones,
    path: '/tickets',
  },
  {
    title: 'Análises',
    icon: FileSearch,
    path: '/analyses',
  },
  {
    title: 'Contratos',
    icon: FileCheck,
    path: '/contracts',
  },
  {
    title: 'Garantias Solicitadas',
    icon: AlertTriangle,
    path: '/claims',
  },
  {
    title: 'Imobiliárias',
    icon: Building2,
    path: '/agencies',
  },
  {
    title: 'Comissões',
    icon: DollarSign,
    path: '/commissions',
  },
  {
    title: 'Faturas',
    icon: Receipt,
    path: '/invoices',
  },
  {
    title: 'Financeiro',
    icon: TrendingUp,
    path: '/financial',
  },
  {
    title: 'Drive Documentos',
    icon: FolderOpen,
    path: '/documents',
  },
  {
    title: 'Usuários',
    icon: Users,
    path: '/users',
    masterOnly: true,
  },
  {
    title: 'Logs',
    icon: ScrollText,
    path: '/audit',
    masterOnly: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const { data: notificationCounts } = useNotificationCounts();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const getNotificationCount = (path: string) => {
    const source = pathToSource[path];
    if (!source || !notificationCounts) return 0;
    return notificationCounts[source];
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <img src={logoWhite} alt="Tridots Capital" className="h-10 w-auto object-contain" />
          </Link>
          <NotificationCenter isAgencyPortal={false} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-semibold tracking-wider uppercase">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const count = getNotificationCount(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.path}
                      className="transition-all duration-200 data-[active=true]:bg-sidebar-accent data-[active=true]:text-amber-400"
                    >
                      <Link to={item.path} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {count > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="h-5 min-w-5 text-xs flex items-center justify-center p-0 px-1.5 ml-2"
                          >
                            {count > 99 ? '99+' : count}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-amber-400/40">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-amber-400 text-amber-950 text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">Equipe Interna</span>
            </div>
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize font-medium">
              {role === 'master' ? 'Administrador' : role === 'analyst' ? 'Analista' : role === 'agency_user' ? 'Colaborador' : 'Sem função'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}