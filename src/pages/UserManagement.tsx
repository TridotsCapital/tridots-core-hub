import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  useUsersWithRoles,
  useAssignRole,
  useRemoveRole,
  useToggleUserActive,
  UserWithRole,
} from "@/hooks/useUserManagement";
import { useAdminResetPassword } from "@/hooks/useAdminResetPassword";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Users, Shield, Crown, UserCheck, Trash2, Plus, Key } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { GeneratePasswordDialog } from "@/components/users/GeneratePasswordDialog";

type AppRole = Database["public"]["Enums"]["app_role"];

const UserManagement = () => {
  const { isMaster, loading, user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsersWithRoles();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const toggleActive = useToggleUserActive();
  const { resetPassword, generatedPassword, isLoading: isGeneratingPassword, showPasswordDialog, closeDialog, copyToClipboard } = useAdminResetPassword();

  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [targetUserName, setTargetUserName] = useState('');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isMaster) {
    return <Navigate to="/" replace />;
  }

  const getRoleBadge = (role: AppRole | null) => {
    switch (role) {
      case "master":
        return (
          <Badge className="bg-amber-500 gap-1">
            <Crown className="h-3 w-3" />
            Administrador
          </Badge>
        );
      case "analyst":
        return (
          <Badge className="bg-blue-500 gap-1">
            <UserCheck className="h-3 w-3" />
            Analista
          </Badge>
        );
      default:
        return <Badge variant="secondary">Sem permissão</Badge>;
    }
  };

  const handleRoleChange = async (user: UserWithRole, newRole: string) => {
    if (newRole === "none") {
      if (user.role_id) {
        setSelectedUser(user);
        setIsRemoveOpen(true);
      }
    } else {
      await assignRole.mutateAsync({
        userId: user.id,
        role: newRole as AppRole,
        existingRoleId: user.role_id,
      });
    }
  };

  const handleRemoveRole = async () => {
    if (selectedUser?.role_id) {
      await removeRole.mutateAsync(selectedUser.role_id);
      setIsRemoveOpen(false);
      setSelectedUser(null);
    }
  };

  const handleToggleActive = async (user: UserWithRole) => {
    await toggleActive.mutateAsync({
      userId: user.id,
      active: !user.active,
    });
  };

  const handleGeneratePassword = async (user: UserWithRole) => {
    setTargetUserName(user.full_name);
    resetPassword(user.id);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Gestão de Usuários
            </h1>
            <p className="text-muted-foreground">
              Gerencie os usuários internos e suas permissões
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Membro
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Usuários</CardDescription>
              <CardTitle className="text-3xl">{users?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Administradores</CardDescription>
              <CardTitle className="text-3xl">
                {users?.filter((u) => u.role === "master").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Analistas</CardDescription>
              <CardTitle className="text-3xl">
                {users?.filter((u) => u.role === "analyst").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              Lista de todos os usuários cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !users?.length ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Permissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.active}
                              onCheckedChange={() => handleToggleActive(user)}
                              disabled={user.id === currentUser?.id}
                            />
                            <span
                              className={
                                user.active ? "text-green-600" : "text-muted-foreground"
                              }
                            >
                              {user.active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleGeneratePassword(user)}
                                    disabled={user.id === currentUser?.id || isGeneratingPassword}
                                  >
                                    {isGeneratingPassword ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Key className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Gerar Senha Provisória</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <Select
                              value={user.role || "none"}
                              onValueChange={(value) => handleRoleChange(user, value)}
                              disabled={user.id === currentUser?.id}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="master">Administrador</SelectItem>
                                <SelectItem value="analyst">Analista</SelectItem>
                                <SelectItem value="none">Remover</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Descrição das Permissões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <Badge className="bg-amber-500 gap-1 mt-1">
                <Crown className="h-3 w-3" />
                Administrador
              </Badge>
              <div>
                <p className="font-medium">Administrador Total</p>
                <p className="text-sm text-muted-foreground">
                  Acesso completo a todas as funcionalidades, incluindo gestão de usuários,
                  auditoria, documentos e confirmação de pagamentos.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Badge className="bg-blue-500 gap-1 mt-1">
                <UserCheck className="h-3 w-3" />
                Analista
              </Badge>
              <div>
                <p className="font-medium">Analista Operacional</p>
                <p className="text-sm text-muted-foreground">
                  Pode visualizar e gerenciar análises, chat interno e documentos.
                  Não tem acesso a gestão de usuários ou logs de auditoria.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Permissão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover a permissão de "{selectedUser?.full_name}"?
                O usuário não terá mais acesso ao sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveRole}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AddUserDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          type="team"
        />

        <GeneratePasswordDialog
          open={showPasswordDialog}
          onOpenChange={closeDialog}
          password={generatedPassword}
          userName={targetUserName}
          onCopy={copyToClipboard}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
