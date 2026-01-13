import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResetPasswordResult {
  success: boolean;
  password: string;
  message: string;
}

export function useAdminResetPassword() {
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const mutation = useMutation({
    mutationFn: async (targetUserId: string): Promise<ResetPasswordResult> => {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: targetUserId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data as ResetPasswordResult;
    },
    onSuccess: (data) => {
      setGeneratedPassword(data.password);
      setShowPasswordDialog(true);
      toast.success('Senha provisória gerada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao gerar senha: ' + error.message);
    }
  });

  const resetPassword = (userId: string) => {
    mutation.mutate(userId);
  };

  const closeDialog = () => {
    setShowPasswordDialog(false);
    setGeneratedPassword(null);
  };

  const copyToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast.success('Senha copiada para a área de transferência!');
    }
  };

  return {
    resetPassword,
    isLoading: mutation.isPending,
    generatedPassword,
    showPasswordDialog,
    closeDialog,
    copyToClipboard,
  };
}
