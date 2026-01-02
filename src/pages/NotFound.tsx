import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubdomain } from "@/contexts/SubdomainContext";
import { Loader2 } from "lucide-react";
import { isCorrectPortalForRole, getPortalUrlForRole } from "@/lib/subdomain";

const NotFound = () => {
  const location = useLocation();
  const { user, loading, role } = useAuth();
  const { portal, isProduction, isInternalPortal, isAgencyPortal } = useSubdomain();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Check if user is on wrong portal and redirect
  useEffect(() => {
    if (!loading && user && role && isProduction) {
      if (!isCorrectPortalForRole(portal, role)) {
        const correctUrl = getPortalUrlForRole(role);
        if (correctUrl) {
          window.location.href = correctUrl;
        }
      }
    }
  }, [loading, user, role, portal, isProduction]);

  // Determine the correct home target based on context
  const getHomeTarget = () => {
    if (!user) {
      return "/auth";
    }
    
    // In production subdomain environment
    if (isProduction) {
      // If on wrong portal, show message (redirect will happen via useEffect)
      if (!isCorrectPortalForRole(portal, role)) {
        return null; // Will show redirect message
      }
      return "/"; // Both portals use root
    }
    
    // Development/Preview environment - use role-based routing
    if (role === "agency_user") {
      return "/agency";
    }
    
    if (role === "master" || role === "analyst") {
      return "/";
    }
    
    return "/auth";
  };

  // Show loading while auth is being resolved
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const homeTarget = getHomeTarget();
  
  // User is on wrong portal - show redirect message
  if (homeTarget === null && user && role) {
    const correctUrl = getPortalUrlForRole(role);
    const portalName = role === 'agency_user' ? 'Portal de Imobiliárias' : 'Portal Interno';
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center max-w-md p-6">
          <h1 className="mb-4 text-2xl font-bold">Portal Incorreto</h1>
          <p className="mb-4 text-muted-foreground">
            Você está tentando acessar um portal diferente do seu perfil.
          </p>
          {correctUrl && (
            <a 
              href={correctUrl}
              className="text-primary underline hover:text-primary/90"
            >
              Ir para {portalName}
            </a>
          )}
        </div>
      </div>
    );
  }

  // Get button label
  const getHomeLabel = () => {
    if (!user) return "Fazer Login";
    if (isAgencyPortal) return "Voltar ao Portal";
    if (isInternalPortal) return "Voltar ao Início";
    // Dev environment
    if (role === "agency_user") return "Voltar ao Portal";
    return "Voltar ao Início";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
        <Link to={homeTarget || "/auth"} className="text-primary underline hover:text-primary/90">
          {getHomeLabel()}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
