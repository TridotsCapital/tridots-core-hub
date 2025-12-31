import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Separator } from '@/components/ui/separator';
import tridotsLogo from '@/assets/tridots-logo.png';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <img src={tridotsLogo} alt="Tridots" className="w-12 h-12 object-contain" />
          </div>
          <div className="w-10 h-10 rounded-full border-3 border-white border-t-transparent animate-spin" />
          <p className="text-white/80 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
        <div className="text-center max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <img src={tridotsLogo} alt="Tridots" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Acesso Pendente</h2>
          <p className="text-white/80 mb-6">
            Sua conta foi criada, mas você ainda não possui uma função atribuída.
            Entre em contato com o administrador para liberar seu acesso.
          </p>
          <p className="text-sm text-white/60">
            Email: {user.email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-admin">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b-2 border-foreground/10 bg-card/95 backdrop-blur-sm px-6 sticky top-0 z-10">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              {title && (
                <div>
                  <h1 className="font-semibold text-lg">{title}</h1>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
