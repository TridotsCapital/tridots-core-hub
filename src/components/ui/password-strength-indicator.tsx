import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  getPasswordStrength, 
  getPasswordRequirementStatus,
  type PasswordStrength 
} from "@/lib/password-validator";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; progress: number }> = {
  weak: { label: 'Fraca', color: 'bg-red-500', progress: 33 },
  medium: { label: 'Média', color: 'bg-amber-500', progress: 66 },
  strong: { label: 'Forte', color: 'bg-green-500', progress: 100 },
};

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);
  const requirements = getPasswordRequirementStatus(password);
  const config = strengthConfig[strength];

  if (!password) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Força da senha:</span>
          <span className={cn(
            "font-medium",
            strength === 'weak' && "text-red-600",
            strength === 'medium' && "text-amber-600",
            strength === 'strong' && "text-green-600"
          )}>
            {config.label}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", config.color)}
            style={{ width: `${config.progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1.5">
        {requirements.map((req) => (
          <li 
            key={req.id}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              req.passed ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {req.passed ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <X className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
