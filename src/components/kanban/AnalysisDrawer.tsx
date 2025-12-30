import { Analysis, statusConfig } from '@/types/database';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnalysisTimeline } from './AnalysisTimeline';
import { DocumentSection } from './DocumentSection';
import { ChatSection } from './ChatSection';
import { 
  Building2, 
  User, 
  Home, 
  MessageSquare, 
  FileText, 
  Clock,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalysisDrawerProps {
  analysis: Analysis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (value: number | null) => {
  if (value === null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string | null; icon?: React.ElementType }) => (
  <div className="flex items-start gap-3 py-2">
    {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value || '-'}</p>
    </div>
  </div>
);

export function AnalysisDrawer({ analysis, open, onOpenChange }: AnalysisDrawerProps) {
  if (!analysis) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{analysis.inquilino_nome}</SheetTitle>
              <SheetDescription className="mt-1">
                Criada em {formatDate(analysis.created_at)}
              </SheetDescription>
            </div>
            <Badge 
              variant="secondary" 
              className={`status-badge ${statusConfig[analysis.status].class}`}
            >
              {statusConfig[analysis.status].label}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="resumo" className="flex flex-col h-[calc(100vh-120px)]">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12">
            <TabsTrigger value="resumo" className="gap-1.5">
              <Clock className="h-4 w-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="imobiliaria" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              Imobiliária
            </TabsTrigger>
            <TabsTrigger value="inquilino" className="gap-1.5">
              <User className="h-4 w-4" />
              Inquilino
            </TabsTrigger>
            <TabsTrigger value="imovel" className="gap-1.5">
              <Home className="h-4 w-4" />
              Imóvel
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Resumo Tab */}
            <TabsContent value="resumo" className="m-0 p-6">
              <div className="space-y-6">
                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Valor do Aluguel</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(analysis.valor_aluguel)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(analysis.valor_total)}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold mb-4">Timeline de Eventos</h3>
                  <AnalysisTimeline analysis={analysis} />
                </div>

                {/* Additional costs */}
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-semibold mb-3">Custos Adicionais</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Condomínio</span>
                      <span>{formatCurrency(analysis.valor_condominio)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IPTU</span>
                      <span>{formatCurrency(analysis.valor_iptu)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outros Encargos</span>
                      <span>{formatCurrency(analysis.valor_outros_encargos)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="font-medium">Taxa de Setup</span>
                      <span className="font-medium">{formatCurrency(analysis.setup_fee)}</span>
                    </div>
                  </div>
                </div>

                {/* Observations */}
                {analysis.observacoes && (
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-semibold mb-2">Observações</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {analysis.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Imobiliária Tab */}
            <TabsContent value="imobiliaria" className="m-0 p-6">
              {analysis.agency ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                    <h3 className="font-semibold text-lg">{analysis.agency.razao_social}</h3>
                    {analysis.agency.nome_fantasia && (
                      <p className="text-sm text-muted-foreground">{analysis.agency.nome_fantasia}</p>
                    )}
                  </div>

                  <div className="grid gap-1">
                    <InfoRow label="CNPJ" value={analysis.agency.cnpj} icon={Briefcase} />
                    <InfoRow label="E-mail" value={analysis.agency.email} icon={Mail} />
                    <InfoRow label="Telefone" value={analysis.agency.telefone} icon={Phone} />
                    <InfoRow 
                      label="Endereço" 
                      value={analysis.agency.endereco ? `${analysis.agency.endereco}, ${analysis.agency.cidade} - ${analysis.agency.estado}` : null} 
                      icon={MapPin} 
                    />
                  </div>

                  <div className="rounded-lg border p-4 mt-4">
                    <h4 className="text-sm font-semibold mb-3">Responsável</h4>
                    <div className="grid gap-1">
                      <InfoRow label="Nome" value={analysis.agency.responsavel_nome} icon={User} />
                      <InfoRow label="E-mail" value={analysis.agency.responsavel_email} icon={Mail} />
                      <InfoRow label="Telefone" value={analysis.agency.responsavel_telefone} icon={Phone} />
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Comissão Recorrente</span>
                      <span className="font-bold text-lg">{analysis.agency.percentual_comissao_recorrente}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Nenhuma imobiliária vinculada
                </div>
              )}
            </TabsContent>

            {/* Inquilino Tab */}
            <TabsContent value="inquilino" className="m-0 p-6">
              <div className="space-y-6">
                {/* Main tenant */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Dados do Inquilino</h3>
                  <div className="grid gap-1">
                    <InfoRow label="Nome Completo" value={analysis.inquilino_nome} icon={User} />
                    <InfoRow label="CPF" value={analysis.inquilino_cpf} icon={Briefcase} />
                    <InfoRow label="RG" value={analysis.inquilino_rg} />
                    <InfoRow label="Data de Nascimento" value={formatDate(analysis.inquilino_data_nascimento)} />
                    <InfoRow label="E-mail" value={analysis.inquilino_email} icon={Mail} />
                    <InfoRow label="Telefone" value={analysis.inquilino_telefone} icon={Phone} />
                    <InfoRow label="Profissão" value={analysis.inquilino_profissao} icon={Briefcase} />
                    <InfoRow label="Empresa" value={analysis.inquilino_empresa} icon={Building2} />
                    <InfoRow label="Renda Mensal" value={formatCurrency(analysis.inquilino_renda_mensal)} icon={DollarSign} />
                  </div>
                </div>

                {/* Spouse */}
                {analysis.conjuge_nome && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Dados do Cônjuge</h3>
                    <div className="grid gap-1">
                      <InfoRow label="Nome Completo" value={analysis.conjuge_nome} icon={User} />
                      <InfoRow label="CPF" value={analysis.conjuge_cpf} icon={Briefcase} />
                      <InfoRow label="RG" value={analysis.conjuge_rg} />
                      <InfoRow label="Data de Nascimento" value={formatDate(analysis.conjuge_data_nascimento)} />
                      <InfoRow label="Profissão" value={analysis.conjuge_profissao} icon={Briefcase} />
                      <InfoRow label="Empresa" value={analysis.conjuge_empresa} icon={Building2} />
                      <InfoRow label="Renda Mensal" value={formatCurrency(analysis.conjuge_renda_mensal)} icon={DollarSign} />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Imóvel Tab */}
            <TabsContent value="imovel" className="m-0 p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Dados do Imóvel</h3>
                  <div className="grid gap-1">
                    <InfoRow label="Tipo" value={analysis.imovel_tipo} icon={Home} />
                    <InfoRow 
                      label="Endereço" 
                      value={`${analysis.imovel_endereco}${analysis.imovel_numero ? `, ${analysis.imovel_numero}` : ''}${analysis.imovel_complemento ? ` - ${analysis.imovel_complemento}` : ''}`}
                      icon={MapPin}
                    />
                    <InfoRow label="Bairro" value={analysis.imovel_bairro} />
                    <InfoRow label="Cidade/Estado" value={`${analysis.imovel_cidade} - ${analysis.imovel_estado}`} />
                    <InfoRow label="CEP" value={analysis.imovel_cep} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Proprietário</h3>
                  <div className="grid gap-1">
                    <InfoRow label="Nome" value={analysis.imovel_proprietario_nome} icon={User} />
                    <InfoRow label="CPF/CNPJ" value={analysis.imovel_proprietario_cpf_cnpj} icon={Briefcase} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Documentos Tab */}
            <TabsContent value="documentos" className="m-0 p-6">
              <DocumentSection analysisId={analysis.id} />
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="m-0 h-full">
              <ChatSection analysisId={analysis.id} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
