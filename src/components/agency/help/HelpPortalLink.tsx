import { useNavigate } from "react-router-dom";
import { useAgencyPath } from "@/hooks/useAgencyPath";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpPortalLinkProps {
  label: string;
  path: string;
  icon?: string;
}

export function HelpPortalLink({ label, path, icon }: HelpPortalLinkProps) {
  const navigate = useNavigate();
  const { agencyPath } = useAgencyPath();

  const Icon = icon 
    ? (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[icon] 
    : Icons.ExternalLink;

  const handleClick = () => {
    // Remove /agency prefix from path if present, since agencyPath will add it when needed
    const cleanPath = path.replace(/^\/agency/, '');
    navigate(agencyPath(cleanPath));
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-primary/5 text-primary text-sm font-medium",
        "hover:bg-primary/10 transition-colors"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </button>
  );
}
