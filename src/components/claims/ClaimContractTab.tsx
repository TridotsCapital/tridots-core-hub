import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileCheck, 
  ExternalLink, 
  User, 
  Home, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClaimContractTabProps {
  contractId: string;
}

const contractStatusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  documentacao_pendente: { 
    label: 'Documentação Pendente', 
    icon: Clock, 
    className: 'bg-amber-100 text-amber-800' 
  },
  ativo: { 
    label: 'Ativo', 
    icon: CheckCircle, 
    className: 'bg-green-100 text-green-800' 
  },
  cancelado: { 
    label: 'Cancelado', 
    icon: XCircle, 
    className: 'bg-red-100 text-red-800' 
  },
  encerrado: { 
    label: 'Encerrado', 
    icon: CheckCircle, 
    className: 'bg-slate-100 text-slate-800' 
  },
};

const docStatusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-slate-100 text-slate-600' },
  enviado: { label: 'Enviado', className: 'bg-blue-100 text-blue-800' },
  aprovado: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
  rejeitado: { label: 'Rejeitado', className: 'bg-red-100 text-red-800' },
};

export function ClaimContractTab({ contractId }: ClaimContractTabProps) {
  const navigate = useNavigate();

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract-for-claim', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          analysis:analyses(
            inquilino_nome,
            inquilino_cpf,
            inquilino_email,
            inquilino_telefone,
            imovel_endereco,
            imovel_numero,
            imovel_complemento,
            imovel_bairro,
            imovel_cidade,
            imovel_estado,
            imovel_cep,
            valor_aluguel,
            valor_condominio,
            valor_iptu,
            valor_total,
            taxa_garantia_percentual,
            created_at
          )
        `)
        .eq('id', contractId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Contrato não encontrado</p>
      </div>
    );
  }

  const statusConfig = contractStatusConfig[contract.status] || contractStatusConfig.documentacao_pendente;
  const StatusIcon = statusConfig.icon;

  const documents = [
    { 
      name: 'Contrato de Locação', 
      status: contract.doc_contrato_locacao_status,
      uploadedAt: contract.doc_contrato_locacao_uploaded_at 
    },
    { 
      name: 'Vistoria Inicial', 
      status: contract.doc_vistoria_inicial_status,
      uploadedAt: contract.doc_vistoria_inicial_uploaded_at 
    },
    { 
      name: 'Seguro Incêndio', 
      status: contract.doc_seguro_incendio_status,
      uploadedAt: contract.doc_seguro_incendio_uploaded_at 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Contract Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={statusConfig.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Criado em {format(new Date(contract.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
        <Button onClick={() => navigate(`/contracts/${contract.id}`)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Ver Contrato Completo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tenant Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Inquilino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{contract.analysis?.inquilino_nome}</p>
            <p className="text-muted-foreground">CPF: {contract.analysis?.inquilino_cpf}</p>
            {contract.analysis?.inquilino_email && (
              <p className="text-muted-foreground">{contract.analysis.inquilino_email}</p>
            )}
            {contract.analysis?.inquilino_telefone && (
              <p className="text-muted-foreground">{contract.analysis.inquilino_telefone}</p>
            )}
          </CardContent>
        </Card>

        {/* Property Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              Imóvel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              {contract.analysis?.imovel_endereco}
              {contract.analysis?.imovel_numero && `, ${contract.analysis.imovel_numero}`}
            </p>
            {contract.analysis?.imovel_complemento && (
              <p className="text-muted-foreground">{contract.analysis.imovel_complemento}</p>
            )}
            <p className="text-muted-foreground">
              {contract.analysis?.imovel_bairro && `${contract.analysis.imovel_bairro}, `}
              {contract.analysis?.imovel_cidade}/{contract.analysis?.imovel_estado}
            </p>
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aluguel</span>
              <span className="font-medium">{formatCurrency(contract.analysis?.valor_aluguel)}</span>
            </div>
            {contract.analysis?.valor_condominio > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Condomínio</span>
                <span>{formatCurrency(contract.analysis.valor_condominio)}</span>
              </div>
            )}
            {contract.analysis?.valor_iptu > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IPTU</span>
                <span>{formatCurrency(contract.analysis.valor_iptu)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total Garantido</span>
              <span className="text-primary">{formatCurrency(contract.analysis?.valor_total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Taxa de Garantia</span>
              <span>{contract.analysis?.taxa_garantia_percentual}% a.a.</span>
            </div>
          </CardContent>
        </Card>

        {/* Documents Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((doc, index) => {
              const docStatus = docStatusConfig[doc.status || 'pendente'] || docStatusConfig.pendente;
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{doc.name}</span>
                  <Badge variant="secondary" className={docStatus.className}>
                    {docStatus.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
