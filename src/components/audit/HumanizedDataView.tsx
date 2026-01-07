import { 
  User, Mail, Phone, MapPin, Building2, Map, Hash, 
  DollarSign, Percent, Activity, Eye, Lock, CheckCircle, 
  FileText, File, Folder, Calendar, CalendarCheck, CalendarX, 
  Cake, MessageSquare, MessageCircle, Tag, Type, AlertTriangle, 
  Shield, Briefcase, Star, UserCheck, Users, Circle
} from "lucide-react";
import { getFieldLabel, getFieldIcon, formatFieldValue } from "@/lib/field-labels";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User, Mail, Phone, MapPin, Building2, Map, Hash,
  DollarSign, Percent, Activity, Eye, Lock, CheckCircle,
  FileText, File, Folder, Calendar, CalendarCheck, CalendarX,
  Cake, MessageSquare, MessageCircle, Tag, Type, AlertTriangle,
  Shield, Briefcase, Star, UserCheck, Users, Circle
};

// Fields to hide (sensitive or internal)
const HIDDEN_FIELDS = [
  "acceptance_token",
  "stripe_customer_id",
  "stripe_checkout_session_id",
  "stripe_subscription_id",
  "document_hash",
  "ip_address",
  "user_agent",
];

interface HumanizedDataViewProps {
  data: Record<string, unknown> | null;
  compareData?: Record<string, unknown> | null;
  mode?: "old" | "new" | "default";
  showChangesOnly?: boolean;
}

export function HumanizedDataView({ 
  data, 
  compareData, 
  mode = "default",
  showChangesOnly = false 
}: HumanizedDataViewProps) {
  if (!data) {
    return <span className="text-muted-foreground">Sem dados</span>;
  }

  const isChanged = (key: string): boolean => {
    if (!compareData) return false;
    return JSON.stringify(data[key]) !== JSON.stringify(compareData[key]);
  };

  const entries = Object.entries(data).filter(([key]) => {
    // Hide sensitive fields
    if (HIDDEN_FIELDS.includes(key)) return false;
    // If showChangesOnly, only show changed fields
    if (showChangesOnly && !isChanged(key)) return false;
    return true;
  });

  if (entries.length === 0) {
    return <span className="text-muted-foreground">Sem alterações visíveis</span>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => {
        const iconName = getFieldIcon(key);
        const IconComponent = iconMap[iconName] || Circle;
        const label = getFieldLabel(key);
        const formattedValue = formatFieldValue(key, value);
        const changed = isChanged(key);
        
        return (
          <div 
            key={key} 
            className={`flex items-start gap-3 p-2 rounded-md text-sm ${
              changed 
                ? mode === "old" 
                  ? "bg-red-100 dark:bg-red-900/30" 
                  : mode === "new"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : ""
                : "hover:bg-muted/50"
            }`}
          >
            <IconComponent className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
              changed
                ? mode === "old"
                  ? "text-red-600 dark:text-red-400"
                  : mode === "new"
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground"
                : "text-muted-foreground"
            }`} />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground text-xs">
                {label}
              </span>
              <p className={`break-words ${changed ? "font-medium" : ""}`}>
                {formattedValue}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
