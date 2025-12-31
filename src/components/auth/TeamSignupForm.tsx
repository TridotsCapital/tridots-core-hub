import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface TeamSignupFormProps {
  onSubmit: (data: { email: string; password: string; fullName: string }) => Promise<void>;
  loading: boolean;
}

export function TeamSignupForm({ onSubmit, loading }: TeamSignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    await onSubmit({ email, password, fullName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-primary">Cadastro Equipe Interna</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-name" className="font-medium">Nome Completo</Label>
        <Input
          id="team-name"
          type="text"
          placeholder="João Silva"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="h-11"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-email" className="font-medium">Email</Label>
        <Input
          id="team-email"
          type="email"
          placeholder="seu@tridots.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-password" className="font-medium">Senha</Label>
        <div className="relative">
          <Input
            id="team-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-11 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-confirm-password" className="font-medium">Confirmar Senha</Label>
        <Input
          id="team-confirm-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="h-11"
        />
      </div>
      
      <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
        {loading ? 'Criando conta...' : 'Criar Conta de Analista'}
      </Button>
    </form>
  );
}
