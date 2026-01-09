import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CalendarSync, CheckCircle, XCircle, Clock, ArrowRight, Loader2, Home, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/validators';

interface RenewalData {
  id: string;
  contract_id: string;
  new_valor_aluguel: number;
  new_valor_condominio: number;
  new_valor_iptu: number;
  new_valor_outros_encargos: number;
  new_taxa_garantia_percentual: number;
  old_valor_aluguel: number;
  old_valor_condominio: number | null;
  old_valor_iptu: number | null;
  old_valor_outros_encargos: number | null;
  renewal_duration_months: number;
  acceptance_token_expires_at: string;
  terms_accepted_at: string | null;
  contract: {
    data_fim_contrato: string | null;
    analysis: {
      inquilino_nome: string;
      imovel_endereco: string;
      imovel_cidade: string;
      imovel_estado: string;
    };
  };
}

export default function RenewalAcceptance() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renewal, setRenewal] = useState<RenewalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Token inválido');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('contract_renewals')
        .select(`
          *,
          contract:contracts!contract_renewals_contract_id_fkey (
            data_fim_contrato,
            analysis:analyses!contracts_analysis_id_fkey (
              inquilino_nome,
              imovel_endereco,
              imovel_cidade,
              imovel_estado
            )
          )
        `)
        .eq('acceptance_token', token)
        .eq('status', 'approved')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Link inválido ou expirado');
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (new Date(data.acceptance_token_expires_at) < new Date()) {
        setError('Este link expirou. Solicite um novo link à sua imobiliária.');
        setIsLoading(false);
        return;
      }

      // Check if already accepted
      if (data.terms_accepted_at) {
        setError('Esta renovação já foi aceita anteriormente.');
        setIsLoading(false);
        return;
      }

      setRenewal(data as unknown as RenewalData);
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Erro ao validar link. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!renewal || !accepted) return;

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('contract_renewals')
        .update({
          terms_accepted_at: new Date().toISOString(),
          acceptance_token_used_at: new Date().toISOString(),
        })
        .eq('id', renewal.id);

      if (updateError) throw updateError;

      toast.success('Renovação aceita com sucesso!');
      navigate('/aceite-renovacao-sucesso');
    } catch (err) {
      console.error('Error accepting renewal:', err);
      toast.error('Erro ao aceitar renovação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-6 space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-red-700">{error}</h2>
            <p className="text-muted-foreground">
              Entre em contato com sua imobiliária para mais informações.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!renewal) return null;

  const oldTotal = (renewal.old_valor_aluguel || 0) +
                   (renewal.old_valor_condominio || 0) +
                   (renewal.old_valor_iptu || 0) +
                   (renewal.old_valor_outros_encargos || 0);

  const newTotal = renewal.new_valor_aluguel +
                   renewal.new_valor_condominio +
                   renewal.new_valor_iptu +
                   renewal.new_valor_outros_encargos;

  const newEndDate = new Date(renewal.contract.data_fim_contrato || new Date());
  newEndDate.setMonth(newEndDate.getMonth() + (renewal.renewal_duration_months || 12));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <CalendarSync className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Renovação de Contrato</h1>
          <p className="text-muted-foreground">
            Revise e aceite os novos termos do seu contrato
          </p>
        </div>

        {/* Tenant Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dados do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inquilino:</span>
              <span className="font-medium">{renewal.contract.analysis.inquilino_nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Imóvel:</span>
              <span className="font-medium text-right">
                {renewal.contract.analysis.imovel_endereco}
                <br />
                <span className="text-sm text-muted-foreground">
                  {renewal.contract.analysis.imovel_cidade} - {renewal.contract.analysis.imovel_estado}
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Duração:</span>
              <Badge variant="secondary">
                {renewal.renewal_duration_months || 12} meses
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Novo vencimento:</span>
              <span className="font-medium">
                {newEndDate.toLocaleDateString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Value Comparison */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Novos Valores
            </CardTitle>
            <CardDescription>
              Comparativo entre valores atuais e os novos valores propostos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-sm pb-2 border-b">
              <div className="font-medium text-muted-foreground">Item</div>
              <div className="font-medium text-muted-foreground text-right">Atual</div>
              <div className="font-medium text-muted-foreground text-right">Novo</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>Aluguel</div>
              <div className="text-right">{formatCurrency(renewal.old_valor_aluguel)}</div>
              <div className="text-right font-medium flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3" />
                {formatCurrency(renewal.new_valor_aluguel)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>Condomínio</div>
              <div className="text-right">{formatCurrency(renewal.old_valor_condominio || 0)}</div>
              <div className="text-right font-medium flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3" />
                {formatCurrency(renewal.new_valor_condominio)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>IPTU</div>
              <div className="text-right">{formatCurrency(renewal.old_valor_iptu || 0)}</div>
              <div className="text-right font-medium flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3" />
                {formatCurrency(renewal.new_valor_iptu)}
              </div>
            </div>

            <div className="border-t pt-3 grid grid-cols-3 gap-2 text-sm font-medium">
              <div>Total Mensal</div>
              <div className="text-right">{formatCurrency(oldTotal)}</div>
              <div className="text-right text-primary flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3" />
                {formatCurrency(newTotal)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>Taxa Garantia</div>
              <div className="text-right">{renewal.old_valor_outros_encargos || '-'}%</div>
              <div className="text-right font-medium flex items-center justify-end gap-1">
                <ArrowRight className="h-3 w-3" />
                {renewal.new_taxa_garantia_percentual}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Acceptance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accept"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
              />
              <Label htmlFor="accept" className="text-sm leading-relaxed cursor-pointer">
                Li e aceito os novos termos e condições da renovação do contrato de locação, 
                incluindo os valores atualizados acima descritos. Estou ciente que esta 
                renovação terá duração de {renewal.renewal_duration_months || 12} meses.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Token Expiration Warning */}
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          <Clock className="h-4 w-4" />
          <span>
            Este link expira em{' '}
            <strong>
              {new Date(renewal.acceptance_token_expires_at).toLocaleString('pt-BR')}
            </strong>
          </span>
        </div>

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleAccept}
          disabled={!accepted || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aceitar Renovação
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
