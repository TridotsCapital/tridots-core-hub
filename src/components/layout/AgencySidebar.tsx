import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileSearch, 
  FileCheck, 
  HelpCircle,
  LogOut,
  Plus,
  Users,
  Play,
  Building2,
  AlertTriangle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalysisDraft } from "@/hooks/useAnalysisDraft";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import { NotificationCenter } from "@/components/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Map paths to notification sources
const pathToSource: Record<string, 'chamados' | 'analises' | 'contratos' | 'sinistros'> = {
  '/agency/support': 'chamados',
  '/agency/analyses': 'analises',
  '/agency/contracts': 'contratos',
  '/agency/claims': 'sinistros',
};

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/agency" },
  { title: "Minhas Análises", icon: FileSearch, path: "/agency/analyses" },
  { title: "Meus Contratos", icon: FileCheck, path: "/agency/contracts" },
  { title: "Sinistros", icon: AlertTriangle, path: "/agency/claims" },
  { title: "Colaboradores", icon: Users, path: "/agency/collaborators" },
  { title: "Suporte", icon: HelpCircle, path: "/agency/support" },
];

export function AgencySidebar() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { hasDraft, getLastSavedTime } = useAnalysisDraft();
  const { data: notificationCounts } = useNotificationCounts();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotificationCount = (path: string) => {
    const source = pathToSource[path];
    if (!source || !notificationCounts) return 0;
    return notificationCounts[source];
  };

  return (
    <Sidebar className="border-r border-border/30 bg-white">
      <SidebarHeader className="border-b border-border/30 p-4 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Portal</h1>
              <p className="text-xs text-primary font-semibold">Imobiliária Parceira</p>
            </div>
          </div>
          <NotificationCenter isAgencyPortal={true} />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-2 mb-2">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const count = getNotificationCount(item.path);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end={item.path === "/agency"}
                        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
                        activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        {count > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="h-5 min-w-5 text-xs flex items-center justify-center p-0 px-1.5"
                          >
                            {count > 99 ? '99+' : count}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-2 mb-2">
            Ações Rápidas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    className={`w-full justify-start gap-2 shadow-sm ${
                      hasDraft 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                    onClick={() => navigate("/agency/analyses/new")}
                  >
                    {hasDraft ? (
                      <>
                        <Play className="h-4 w-4" />
                        Continuar Análise
                        <Badge variant="secondary" className="ml-auto bg-white/20 text-white text-[10px] px-1.5">
                          Rascunho
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Nova Análise
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {hasDraft && (
                  <TooltipContent side="right">
                    <p>Última edição: {getLastSavedTime()}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 p-4 bg-muted/20">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {profile?.full_name ? getInitials(profile.full_name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}