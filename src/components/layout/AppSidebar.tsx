import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import tridotsLogo from '@/assets/tridots-logo.png';
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
  FileText,
  Shield,
  Users,
  LogOut,
  Headphones,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    title: 'Imobiliárias',
    icon: Building2,
    path: '/agencies',
  },
  {
    title: 'Análises',
    icon: FileSearch,
    path: '/analyses',
  },
  {
    title: 'Comissões',
    icon: DollarSign,
    path: '/commissions',
  },
  {
    title: 'Painel Financeiro',
    icon: TrendingUp,
    path: '/financial',
  },
  {
    title: 'Documentos',
    icon: FileText,
    path: '/documents',
  },
  {
    title: 'Central de Atendimento',
    icon: Headphones,
    path: '/tickets',
  },
  {
    title: 'Auditoria',
    icon: Shield,
    path: '/audit',
    masterOnly: true,
  },
  {
    title: 'Usuários',
    icon: Users,
    path: '/users',
    masterOnly: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();

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

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
            <img 
              src={tridotsLogo} 
              alt="Tridots Garantia" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground tracking-tight">TRIDOTS</h1>
            <p className="text-xs text-sidebar-foreground/70 font-medium tracking-widest">GARANTIA</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Equipe Interna</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-semibold tracking-wider uppercase">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    className="transition-all duration-200 data-[active=true]:bg-sidebar-accent data-[active=true]:text-amber-400"
                  >
                    <Link to={item.path}>
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize font-medium">
              {role === 'master' ? 'Administrador' : role || 'Sem função'}
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
