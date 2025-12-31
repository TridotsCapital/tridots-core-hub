import { Clock, AlertCircle } from 'lucide-react';

interface PendingApprovalBannerProps {
  className?: string;
}

export function PendingApprovalBanner({ className }: PendingApprovalBannerProps) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20">
        <Clock className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="font-semibold text-amber-700 dark:text-amber-500">Cadastro em Análise</span>
        </div>
        <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-0.5">
          Seu cadastro está sendo analisado pela equipe Tridots. Você pode visualizar o portal, 
          mas algumas ações estarão bloqueadas até a aprovação.
        </p>
      </div>
    </div>
  );
}
