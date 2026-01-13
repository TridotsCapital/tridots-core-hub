import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Digite seu email');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      toast.error('Erro ao enviar email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Verifique seu email</h3>
        <p className="text-sm text-muted-foreground">
          Enviamos um link de recuperação para <strong>{email}</strong>. 
          Verifique sua caixa de entrada e spam.
        </p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Esqueci minha senha</h3>
        <p className="text-sm text-muted-foreground">
          Digite seu email para receber o link de recuperação
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recovery-email">Email</Label>
        <Input
          id="recovery-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11"
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar link de recuperação'
        )}
      </Button>

      <Button 
        type="button" 
        variant="ghost" 
        onClick={onBack} 
        className="w-full"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para login
      </Button>
    </form>
  );
}
