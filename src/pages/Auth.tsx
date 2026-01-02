import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, getDefaultRouteForRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LoginForm } from '@/components/auth/LoginForm';
import { TeamSignupForm } from '@/components/auth/TeamSignupForm';
import { AgencySignupForm, AgencySignupData } from '@/components/auth/AgencySignupForm';
import { supabase } from '@/integrations/supabase/client';
import logoBlack from "@/assets/logo-tridots-black.webp";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const isTeamSignup = searchParams.get('team') === 'tridots';

  // Redirect if already logged in
  useEffect(() => {
    if (user && role !== null) {
      navigate(getDefaultRouteForRole(role));
    }
  }, [user, role, navigate]);

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
    
    // First create the auth user
    const { error, data: authData } = await signUp(formData.email, formData.password, formData.responsavel_nome);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error('Erro ao criar conta: ' + error.message);
      }
      setLoading(false);
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
          endereco: formData.endereco || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
          cep: formData.cep?.replace(/\D/g, '') || null,
        }
      });

      if (agencyError) {
        console.error('Error creating agency:', agencyError);
        toast.error('Conta criada, mas houve um erro ao cadastrar a imobiliária. Entre em contato com o suporte.');
      } else {
        toast.success('Cadastro realizado! Seu perfil está em análise.');
      }
    }
    
    setLoading(false);
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
      
      <Card className={`w-full relative animate-scale-in glass-strong shadow-2xl ${isTeamSignup ? 'max-w-md' : 'max-w-lg'}`}>
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto flex items-center justify-center">
            <img src={logoBlack} alt="Tridots Capital" className="h-16 w-auto object-contain" />
          </div>
          <CardDescription className="text-muted-foreground">
            {isTeamSignup 
              ? 'Cadastro de Membro da Equipe' 
              : 'Sistema de Gestão de Análises de Crédito'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          {isTeamSignup ? (
            // Team signup - simplified form
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="font-semibold">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="font-semibold">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm onSubmit={handleLogin} loading={loading} />
              </TabsContent>
              
              <TabsContent value="signup">
                <TeamSignupForm onSubmit={handleTeamSignup} loading={loading} />
              </TabsContent>
            </Tabs>
          ) : (
            // Regular flow - agency signup
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="font-semibold">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="font-semibold">Cadastrar Imobiliária</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm onSubmit={handleLogin} loading={loading} />
              </TabsContent>
              
              <TabsContent value="signup">
                <AgencySignupForm onSubmit={handleAgencySignup} loading={loading} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}