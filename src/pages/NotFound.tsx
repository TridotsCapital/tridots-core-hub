import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { user, loading, role } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Determine the correct home target based on context
  const getHomeTarget = () => {
    // If the 404 occurred in agency context, prefer agency portal
    const isAgencyContext = location.pathname.startsWith("/agency");
    
    if (!user) {
      return "/auth";
    }
    
    if (role === "agency_user" || isAgencyContext) {
      return "/agency";
    }
    
    if (role === "master" || role === "analyst") {
      return "/";
    }
    
    // Default to auth if role is unclear
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
  const homeLabel = homeTarget === "/agency" ? "Voltar ao Portal" : homeTarget === "/" ? "Voltar ao Início" : "Fazer Login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
        <Link to={homeTarget} className="text-primary underline hover:text-primary/90">
          {homeLabel}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
