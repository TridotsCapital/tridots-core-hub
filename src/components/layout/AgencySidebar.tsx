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
  AlertTriangle,
  Shield,
  DollarSign,
  FolderOpen,
  Star
} from "lucide-react";
import logoBlack from "@/assets/logo-tridots-black.webp";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { useAnalysisDraft } from "@/hooks/useAnalysisDraft";
import { useClaimDraft } from "@/hooks/useClaimDraft";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import { useRejectedDocumentsCount } from "@/hooks/useRejectedDocumentsCount";
import { useNps } from "@/contexts/NpsContext";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AgencyLogoUpload } from "@/components/agency/AgencyLogoUpload";

// Map paths to notification sources
const pathToSource: Record<string, 'chamados' | 'analises' | 'contratos' | 'sinistros'> = {
  '/agency/support': 'chamados',
  '/agency/analyses': 'analises',
  '/agency/contracts': 'contratos',
  '/agency/claims': 'sinistros',
};

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/agency" },
  { title: "Chamados", icon: HelpCircle, path: "/agency/support" },
  { title: "Minhas Análises", icon: FileSearch, path: "/agency/analyses" },
  { title: "Meus Contratos", icon: FileCheck, path: "/agency/contracts" },
  { title: "Sinistros", icon: AlertTriangle, path: "/agency/claims" },
  { title: "Minhas Comissões", icon: DollarSign, path: "/agency/commissions" },
  { title: "Drive Documentos", icon: FolderOpen, path: "/agency/documents" },
  { title: "Colaboradores", icon: Users, path: "/agency/collaborators" },
];

export function AgencySidebar() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: agencyUser } = useAgencyUser();
  const { hasDraft: hasAnalysisDraft, getLastSavedTime } = useAnalysisDraft();
  const { hasDraft: hasClaimDraft } = useClaimDraft();
  const { pendingSurveys, hasPendingNps, showNpsModal } = useNps();
  const { data: rejectedDocsCount } = useRejectedDocumentsCount();
  
  const agencyName = agencyUser?.agency?.nome_fantasia || agencyUser?.agency?.razao_social || "Imobiliária";
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
          <img src={logoBlack} alt="Tridots Capital" className="h-10 w-auto object-contain" />
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
                const showDraftBadge = item.path === '/agency/claims' && hasClaimDraft;
                const showRejectedBadge = item.path === '/agency/contracts' && (rejectedDocsCount ?? 0) > 0;
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
                        <div className="flex items-center gap-1">
                          {showDraftBadge && (
                            <Badge 
                              className="h-5 min-w-5 text-xs flex items-center justify-center p-0 px-1.5 bg-orange-500"
                            >
                              !
                            </Badge>
                          )}
                          {showRejectedBadge && (
                            <Badge 
                              variant="destructive" 
                              className="h-5 min-w-5 text-xs flex items-center justify-center p-0 px-1.5 animate-pulse"
                            >
                              !
                            </Badge>
                          )}
                          {count > 0 && !showRejectedBadge && (
                            <Badge 
                              variant="destructive" 
                              className="h-5 min-w-5 text-xs flex items-center justify-center p-0 px-1.5"
                            >
                              {count > 99 ? '99+' : count}
                            </Badge>
                          )}
                        </div>
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
                      hasAnalysisDraft 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                    onClick={() => navigate("/agency/analyses/new")}
                  >
                    {hasAnalysisDraft ? (
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
                {hasAnalysisDraft && (
                  <TooltipContent side="right">
                    <p>Última edição: {getLastSavedTime()}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button 
              variant="outline"
              className="w-full justify-start gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 mt-2"
              onClick={() => navigate("/agency/claims/new")}
            >
              <Shield className="h-4 w-4" />
              Solicitar Garantia
            </Button>
            
            {hasPendingNps && (
              <Button 
                variant="outline"
                className="w-full justify-start gap-2 border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 mt-2"
                onClick={showNpsModal}
              >
                <Star className="h-4 w-4" />
                Avaliar Chamados
                <Badge className="ml-auto bg-amber-500 text-white hover:bg-amber-500">
                  {pendingSurveys.length}
                </Badge>
              </Button>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 p-4 bg-muted/20">
        <div className="flex items-center gap-3">
          {agencyUser?.agency ? (
            <AgencyLogoUpload
              agencyId={agencyUser.agency.id}
              currentLogoUrl={agencyUser.agency.logo_url}
              agencyName={agencyName}
              size="sm"
            />
          ) : (
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {profile?.full_name ? getInitials(profile.full_name) : "U"}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-semibold text-primary uppercase tracking-wider truncate">Portal {agencyName}</span>
            </div>
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