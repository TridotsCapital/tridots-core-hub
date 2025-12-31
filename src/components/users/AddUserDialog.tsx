import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateUser } from "@/hooks/useCreateUser";
import { generateSecurePassword } from "@/lib/password-generator";

const teamUserSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["master", "analyst"]),
});

const collaboratorSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type TeamUserFormData = z.infer<typeof teamUserSchema>;
type CollaboratorFormData = z.infer<typeof collaboratorSchema>;

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'team' | 'agency_collaborator';
  agencyId?: string;
}

export function AddUserDialog({ open, onOpenChange, type, agencyId }: AddUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const createUser = useCreateUser();

  const isTeam = type === 'team';
  const schema = isTeam ? teamUserSchema : collaboratorSchema;

  const form = useForm<TeamUserFormData | CollaboratorFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      ...(isTeam && { role: "analyst" as const }),
    },
  });

  const handleGeneratePassword = () => {
    const password = generateSecurePassword(12);
    form.setValue("password", password);
  };

  const onSubmit = async (data: TeamUserFormData | CollaboratorFormData) => {
    try {
      if (isTeam) {
        const teamData = data as TeamUserFormData;
        await createUser.mutateAsync({
          email: teamData.email,
          password: teamData.password,
          full_name: teamData.full_name,
          type: 'team',
          role: teamData.role,
        });
      } else {
        await createUser.mutateAsync({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          type: 'agency_collaborator',
          agency_id: agencyId,
        });
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isTeam ? "Adicionar Novo Membro" : "Adicionar Colaborador"}
          </DialogTitle>
          <DialogDescription>
            {isTeam
              ? "Adicione um novo membro à equipe Tridots."
              : "Adicione um novo colaborador à sua imobiliária."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="joao@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Inicial</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGeneratePassword}
                        title="Gerar senha"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    O usuário poderá alterar a senha após o login.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isTeam && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissão</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a permissão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="analyst">
                          <div className="flex flex-col items-start">
                            <span>Analista</span>
                            <span className="text-xs text-muted-foreground">
                              Operacional - visualiza e edita análises
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="master">
                          <div className="flex flex-col items-start">
                            <span>Administrador</span>
                            <span className="text-xs text-muted-foreground">
                              Acesso total ao sistema
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
