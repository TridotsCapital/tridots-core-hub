import { Link } from 'react-router-dom';
import { Clock, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgencyProfile } from '@/hooks/useAgencyProfile';
import { useAgencyOnboardingStatus } from '@/hooks/useAgencyDocuments';

interface PendingApprovalBannerProps {
  className?: string;
}

export function PendingApprovalBanner({ className }: PendingApprovalBannerProps) {
  const { data: agency } = useAgencyProfile();
  const onboardingStatus = useAgencyOnboardingStatus(agency?.id);

  // If agency is active, don't show banner
  if (agency?.active) return null;

  // Determine the current state and message
  let icon = Clock;
  let iconBgColor = 'bg-amber-500/20';
  let iconColor = 'text-amber-600';
  let titleColor = 'text-amber-700 dark:text-amber-500';
  let title = 'Cadastro em Análise';
  let description = '';
  let showLink = false;

  if (onboardingStatus.rejectedDocuments.length > 0) {
    // Has rejected documents
    icon = AlertCircle;
    iconBgColor = 'bg-destructive/20';
    iconColor = 'text-destructive';
    titleColor = 'text-destructive';
    title = 'Documento Rejeitado';
    description = 'Um ou mais documentos foram rejeitados. Acesse a aba Documentos no seu Perfil para verificar o motivo e reenviar.';
    showLink = true;
  } else if (onboardingStatus.pendingDocuments.length > 0) {
    // Missing required documents
    icon = FileText;
    iconBgColor = 'bg-amber-500/20';
    iconColor = 'text-amber-600';
    titleColor = 'text-amber-700 dark:text-amber-500';
    title = 'Documentação Pendente';
    description = `Complete o envio da documentação obrigatória para ativar sua imobiliária. Faltam ${onboardingStatus.pendingDocuments.length} documento(s).`;
    showLink = true;
  } else if (!onboardingStatus.allDocumentsApproved) {
    // Documents sent, awaiting approval
    icon = Clock;
    iconBgColor = 'bg-blue-500/20';
    iconColor = 'text-blue-600';
    titleColor = 'text-blue-700 dark:text-blue-500';
    title = 'Documentos em Análise';
    description = 'Seus documentos estão sendo analisados pela equipe Tridots. Você será notificado assim que a análise for concluída.';
    showLink = false;
  } else if (!onboardingStatus.hasTermoAceiteAssinado) {
    // All docs approved, need to sign term
    icon = FileText;
    iconBgColor = 'bg-green-500/20';
    iconColor = 'text-green-600';
    titleColor = 'text-green-700 dark:text-green-500';
    title = 'Assine o Termo de Aceite';
    description = 'Todos os documentos foram aprovados! Baixe o Termo de Aceite, assine via GOV.BR e faça o upload para finalizar.';
    showLink = true;
  } else if (!onboardingStatus.termApproved) {
    // Term sent, awaiting approval
    icon = Clock;
    iconBgColor = 'bg-blue-500/20';
    iconColor = 'text-blue-600';
    titleColor = 'text-blue-700 dark:text-blue-500';
    title = 'Termo de Aceite em Análise';
    description = 'O Termo de Aceite assinado está sendo analisado. Aguarde a aprovação final da Tridots.';
    showLink = false;
  } else {
    // Everything approved, awaiting manual activation
    icon = CheckCircle;
    iconBgColor = 'bg-green-500/20';
    iconColor = 'text-green-600';
    titleColor = 'text-green-700 dark:text-green-500';
    title = 'Aguardando Ativação';
    description = 'Toda a documentação foi aprovada. A equipe Tridots está finalizando a ativação da sua imobiliária.';
    showLink = false;
  }

  const Icon = icon;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 ${className}`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${iconBgColor} shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <AlertCircle className={`h-4 w-4 ${iconColor}`} />
          <span className={`font-semibold ${titleColor}`}>{title}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {description}
        </p>
        {showLink && (
          <Button 
            variant="link" 
            className="p-0 h-auto mt-1 text-primary"
            asChild
          >
            <Link to="/agency/profile?tab=documents">
              Ir para Documentos →
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
