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
  Star,
  KeyRound,
  UserCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import logoBlack from "@/assets/logo-tridots-black.webp";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { useAnalysisDraft } from "@/hooks/useAnalysisDraft";
import { useClaimDraft } from "@/hooks/useClaimDraft";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import { useRejectedDocumentsCount } from "@/hooks/useRejectedDocumentsCount";
import { useAgencyOnboardingStatus } from "@/hooks/useAgencyDocuments";
import { useNps } from "@/contexts/NpsContext";
import { useAgencyPath } from "@/hooks/useAgencyPath";
import { NotificationCenter } from "@/components/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { AgencyLogoUpload } from "@/components/agency/AgencyLogoUpload";

// Map path keys to notification sources - use relative paths without /agency prefix
const pathToSourceKey: Record<string, "chamados" | "analises" | "contratos" | "garantias"> = {
  "support": "chamados",
  "analyses": "analises",
  "contracts": "contratos",
  "claims": "garantias",
};

// Menu items with relative paths (prefix will be added dynamically)
const menuItemsConfig = [
  { title: "Dashboard", icon: LayoutDashboard, pathKey: "" },
  { title: "Chamados", icon: HelpCircle, pathKey: "support" },
  { title: "Minhas Análises", icon: FileSearch, pathKey: "analyses" },
  { title: "Meus Contratos", icon: FileCheck, pathKey: "contracts" },
  { title: "Garantias", icon: AlertTriangle, pathKey: "claims" },
  { title: "Minhas Comissões", icon: DollarSign, pathKey: "commissions" },
  { title: "Drive Documentos", icon: FolderOpen, pathKey: "documents" },
  { title: "Colaboradores", icon: Users, pathKey: "collaborators" },
  { title: "Ajuda", icon: BookOpen, pathKey: "help" },
];

export function AgencySidebar() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { agencyPath } = useAgencyPath();
  const { data: agencyUser } = useAgencyUser();
  const { hasDraft: hasAnalysisDraft, getLastSavedTime } = useAnalysisDraft();
  const { hasDraft: hasClaimDraft } = useClaimDraft();
  const { pendingSurveys, hasPendingNps, showNpsModal } = useNps();
  const { data: rejectedDocsCount } = useRejectedDocumentsCount();
  const onboardingStatus = useAgencyOnboardingStatus(agencyUser?.agency?.id);

  const agencyName = agencyUser?.agency?.nome_fantasia || agencyUser?.agency?.razao_social || "Imobiliária";
  const { data: notificationCounts } = useNotificationCounts();
  
  // Check if there are pending onboarding docs
  const hasPendingOnboardingDocs = !agencyUser?.agency?.active && (
    onboardingStatus.pendingDocuments.length > 0 || 
    onboardingStatus.rejectedDocuments.length > 0
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getNotificationCount = (pathKey: string) => {
    const source = pathToSourceKey[pathKey];
    if (!source || !notificationCounts) return 0;
    return notificationCounts[source];
  };

  // Build menu items with dynamic paths
  const menuItems = menuItemsConfig.map(item => ({
    ...item,
    path: item.pathKey === "" ? agencyPath("/") : agencyPath(`/${item.pathKey}`),
  }));

  return (
    <Sidebar className="border-r border-border/30 bg-white">
      <SidebarHeader className="border-b border-border/30 p-4 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <img src={logoBlack} alt="Tridots Capital" className="h-10 w-auto object-contain flex-shrink-0" />
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
                const count = getNotificationCount(menuItemsConfig.find(c => c.title === item.title)?.pathKey || '');
                const isClaimsItem = item.title === "Garantias";
                const isContractsItem = item.title === "Meus Contratos";
                const showDraftBadge = isClaimsItem && hasClaimDraft;
                const showRejectedBadge = isContractsItem && (rejectedDocsCount ?? 0) > 0;
                const isDashboard = item.title === "Dashboard";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.path}
                        end={isDashboard}
                        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
                        activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {showDraftBadge && (
                            <Badge className="h-5 min-w-5 text-xs flex items-center justify-center p-0 px-1.5 bg-orange-500">
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
                              {count > 99 ? "99+" : count}
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
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                    onClick={() => navigate(agencyPath("/analyses/new"))}
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
            {agencyUser?.agency?.active ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 mt-2"
                onClick={() => navigate(agencyPath("/claims/new"))}
              >
                <Shield className="h-4 w-4" />
                Solicitar Garantia
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-full">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 border-muted text-muted-foreground mt-2"
                      disabled
                    >
                      <Shield className="h-4 w-4" />
                      Solicitar Garantia
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Disponível após aprovação do cadastro</p>
                </TooltipContent>
              </Tooltip>
            )}

            {hasPendingNps && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 mt-2"
                onClick={showNpsModal}
              >
                <Star className="h-4 w-4" />
                Avaliar Chamados
                <Badge className="ml-auto bg-amber-500 text-white hover:bg-amber-500">{pendingSurveys.length}</Badge>
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
          ) : null}
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(agencyPath("/profile"))}
              className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted relative"
              title="Meu Perfil"
            >
              <UserCircle className="h-4 w-4" />
              {hasPendingOnboardingDocs && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse border-2 border-background" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(agencyPath("/settings/password"))}
              className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Alterar senha"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
