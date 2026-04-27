import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, getDefaultRouteForRole } from '@/contexts/AuthContext';
import { useSubdomain } from '@/contexts/SubdomainContext';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LoginForm } from '@/components/auth/LoginForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { TeamSignupForm } from '@/components/auth/TeamSignupForm';
import { AgencySignupForm, AgencySignupData } from '@/components/auth/AgencySignupForm';
import { supabase } from '@/integrations/supabase/client';
import logoBlack from "@/assets/logo-tridots-black.webp";
import { isCorrectPortalForRole, getPortalUrlForRole } from '@/lib/subdomain';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { signIn, signUp, user, role } = useAuth();
  const { isInternalPortal, isAgencyPortal, isProduction } = useSubdomain();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Team signup is only available on internal portal or via query param in dev
  const isTeamSignup = searchParams.get('team') === 'tridots' && (isInternalPortal || !isProduction);

  // Redirect if already logged in (but not during registration)
  useEffect(() => {
    if (user && role !== null && !isRegistering) {
      // In production, check if user is on correct portal
      if (isProduction && !isCorrectPortalForRole(isInternalPortal ? 'internal' : 'agency', role)) {
        const correctUrl = getPortalUrlForRole(role);
        if (correctUrl) {
          toast.error(`Você está no portal errado. Redirecionando...`);
          window.location.href = correctUrl;
          return;
        }
      }
      navigate(getDefaultRouteForRole(role));
    }
  }, [user, role, navigate, isProduction, isInternalPortal, isRegistering]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else {
        toast.error('Erro ao fazer login: ' + error.message);
      }
    } else {
      toast.success('Login realizado com sucesso!');
    }
    
    setLoading(false);
  };

  const handleTeamSignup = async (data: { email: string; password: string; fullName: string }) => {
    setLoading(true);
    
    const { error, data: authData } = await signUp(data.email, data.password, data.fullName);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error('Erro ao criar conta: ' + error.message);
      }
      setLoading(false);
      return;
    }

    // Call edge function to set analyst role
    if (authData?.user) {
      const { error: roleError } = await supabase.functions.invoke('register-team-member', {
        body: { user_id: authData.user.id }
      });

      if (roleError) {
        console.error('Error setting role:', roleError);
        toast.error('Conta criada, mas houve um erro ao definir permissões. Entre em contato com o suporte.');
      } else {
        toast.success('Conta de analista criada com sucesso!');
      }
    }
    
    setLoading(false);
  };

  const handleAgencySignup = async (formData: AgencySignupData) => {
    setLoading(true);
    setIsRegistering(true);
    
    // First create the auth user
    const { error, data: authData } = await signUp(formData.email, formData.password, formData.responsavel_nome);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error('Erro ao criar conta: ' + error.message);
      }
      setLoading(false);
      setIsRegistering(false);
      return;
    }

    // Call edge function to create agency
    if (authData?.user) {
      const { error: agencyError } = await supabase.functions.invoke('register-agency', {
        body: {
          user_id: authData.user.id,
          cnpj: formData.cnpj.replace(/\D/g, ''),
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia || null,
          email: formData.email,
          telefone: formData.telefone || null,
          responsavel_nome: formData.responsavel_nome,
          responsavel_email: formData.responsavel_email || null,
          responsavel_telefone: formData.responsavel_telefone || null,
          cep: formData.cep?.replace(/\D/g, '') || null,
          endereco: formData.endereco || null,
          numero: formData.numero || null,
          complemento: formData.complemento || null,
          bairro: formData.bairro || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
          total_locacoes_ativas: formData.total_locacoes_ativas || null,
          garantias_utilizadas: formData.garantias_utilizadas || null,
          ticket_medio_aluguel: formData.ticket_medio_aluguel || null,
          billing_due_day: formData.billing_due_day || 10,
        }
      });

      if (agencyError) {
        console.error('Error creating agency:', agencyError);
        toast.error('Conta criada, mas houve um erro ao cadastrar a imobiliária. Entre em contato com o suporte.');
      } else {
        toast.success('Bem-vindo à GarantFácil! Seu cadastro foi realizado com sucesso.');
        // Navigate to agency dashboard (correct route is /agency, not /agency/dashboard)
        navigate('/agency');
      }
    }
    
    setLoading(false);
    setIsRegistering(false);
  };

  // Determine which signup options to show
  const showAgencySignup = isAgencyPortal || (!isProduction && !isTeamSignup);
  const showTeamSignup = isTeamSignup;
  const showOnlyLogin = isInternalPortal && !isTeamSignup;

  // Get description based on context
  const getDescription = () => {
    if (isTeamSignup) return 'Cadastro de Membro da Equipe';
    if (isAgencyPortal) return 'Portal de Imobiliárias Parceiras';
    if (isInternalPortal) return 'Portal Interno GarantFácil';
    return 'A garantia locatícia mais segura e completa do Brasil.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      
      <Card className={`w-full relative animate-scale-in glass-strong shadow-2xl ${showTeamSignup || showOnlyLogin ? 'max-w-md' : 'max-w-lg'}`}>
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto flex items-center justify-center">
            <img src={logoBlack} alt="GarantFácil" className="h-16 w-auto object-contain" />
          </div>
          <CardDescription className="text-muted-foreground">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          {showForgotPassword ? (
            <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
          ) : showOnlyLogin ? (
            // Internal portal without team param - login only
            <div className="space-y-4">
              <LoginForm onSubmit={handleLogin} loading={loading} />
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline w-full text-center"
              >
                Esqueci minha senha
              </button>
            </div>
          ) : showTeamSignup ? (
            // Team signup - simplified form
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="font-semibold">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="font-semibold">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <div className="space-y-4">
                  <LoginForm onSubmit={handleLogin} loading={loading} />
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline w-full text-center"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </TabsContent>
              
              <TabsContent value="signup">
                <TeamSignupForm onSubmit={handleTeamSignup} loading={loading} />
              </TabsContent>
            </Tabs>
          ) : showAgencySignup ? (
            // Agency portal or dev - agency signup available
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="font-semibold">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="font-semibold">Cadastrar Imobiliária</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <div className="space-y-4">
                  <LoginForm onSubmit={handleLogin} loading={loading} />
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline w-full text-center"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </TabsContent>
              
              <TabsContent value="signup">
                <AgencySignupForm onSubmit={handleAgencySignup} loading={loading} />
              </TabsContent>
            </Tabs>
          ) : (
            // Fallback to login only
            <LoginForm onSubmit={handleLogin} loading={loading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
