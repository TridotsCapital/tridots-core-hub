import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Users, UserCheck, UserX, Phone } from "lucide-react";
import { AgencyLayout, useAgencyStatus } from "@/components/layout/AgencyLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { useAgencyCollaborators, useToggleCollaboratorActive, type AgencyPosition } from "@/hooks/useAgencyCollaborators";

const positionLabels: Record<AgencyPosition, string> = {
  dono: "Dono",
  gerente: "Gerente",
  auxiliar: "Auxiliar",
};

const positionColors: Record<AgencyPosition, string> = {
  dono: "bg-primary text-primary-foreground",
  gerente: "bg-blue-500 text-white",
  auxiliar: "bg-muted text-muted-foreground",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AgencyCollaboratorsContent() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { isAgencyActive } = useAgencyStatus();
  const { data: agencyUserData } = useAgencyUser();
  const agencyId = agencyUserData?.agency_id || null;
  const { data: collaborators, isLoading } = useAgencyCollaborators(agencyId);
  const toggleActive = useToggleCollaboratorActive();

  const activeCount = collaborators?.filter((c) => c.profile?.active).length || 0;
  const totalCount = collaborators?.length || 0;

  const handleToggleActive = (userId: string, currentActive: boolean) => {
    toggleActive.mutate({ userId, active: !currentActive });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Colaboradores</h1>
            <p className="text-muted-foreground">
              Gerencie os colaboradores da sua imobiliária
            </p>
          </div>
          
          {isAgencyActive ? (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Colaborador
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Colaborador
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Disponível após aprovação do cadastro</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">colaboradores cadastrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">com acesso ao portal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount - activeCount}</div>
              <p className="text-xs text-muted-foreground">sem acesso ao portal</p>
            </CardContent>
          </Card>
        </div>

        {/* Collaborators List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Colaboradores</CardTitle>
            <CardDescription>
              Todos os colaboradores vinculados à sua imobiliária
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : collaborators?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum colaborador</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adicione colaboradores para que eles possam acessar o portal.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {collaborators?.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={collaborator.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(collaborator.profile?.full_name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {collaborator.profile?.full_name}
                          </span>
                          {collaborator.is_primary_contact && (
                            <Badge variant="secondary" className="text-xs">
                              Responsável
                            </Badge>
                          )}
                          {collaborator.position && (
                            <Badge className={`text-xs ${positionColors[collaborator.position]}`}>
                              {positionLabels[collaborator.position]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {collaborator.profile?.email}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Desde{" "}
                            {format(new Date(collaborator.created_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                          {collaborator.profile?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {collaborator.profile.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={collaborator.profile?.active ? "default" : "secondary"}
                      >
                        {collaborator.profile?.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Switch
                        checked={collaborator.profile?.active}
                        onCheckedChange={() =>
                          handleToggleActive(
                            collaborator.user_id,
                            collaborator.profile?.active || false
                          )
                        }
                        disabled={collaborator.is_primary_contact}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        type="agency_collaborator"
        agencyId={agencyId || undefined}
      />
    </>
  );
}

export default function AgencyCollaborators() {
  return (
    <AgencyLayout title="Colaboradores" description="Gerencie os colaboradores da sua imobiliária">
      <AgencyCollaboratorsContent />
    </AgencyLayout>
  );
}
