import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const roleLabels: Record<AppRole, string> = {
  master: 'Administrador',
  analyst: 'Analista',
  agency_user: 'Colaborador',
};

export function getRoleLabel(role: AppRole | null | undefined): string {
  if (!role) return 'Sem função';
  return roleLabels[role] || role;
}
