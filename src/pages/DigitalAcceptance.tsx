import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTermTemplates, TermTemplate } from "@/hooks/useTermTemplates";
import { useCreateDigitalAcceptance } from "@/hooks/useDigitalAcceptances";
import { Loader2, FileText, CheckCircle, Shield, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import tridotsLogo from "@/assets/tridots-logo.png";

interface AnalysisData {
  id: string;
  inquilino_nome: string;
  inquilino_cpf: string;
  inquilino_email: string | null;
}

const DigitalAcceptance = () => {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const { data: templates, isLoading: templatesLoading } = useActiveTermTemplates();
  const createAcceptance = useCreateDigitalAcceptance();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ipAddress, setIpAddress] = useState<string>("");
  const [geolocation, setGeolocation] = useState<{
    city?: string;
    state?: string;
    country?: string;
  }>({});

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!analysisId) return;

      const { data, error } = await supabase
        .from("analyses")
        .select("id, inquilino_nome, inquilino_cpf, inquilino_email")
        .eq("id", analysisId)
        .maybeSingle();

      if (error || !data) {
        console.error("Analysis not found:", error);
      } else {
        setAnalysis(data);
      }
      setLoading(false);
    };

    fetchAnalysis();
  }, [analysisId]);

  useEffect(() => {
    // Fetch IP and geolocation
    const fetchIpAndGeo = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        setIpAddress(data.ip || "");
        setGeolocation({
          city: data.city,
          state: data.region,
          country: data.country_name,
        });
      } catch (error) {
        console.error("Error fetching IP:", error);
        setIpAddress("unknown");
      }
    };

    fetchIpAndGeo();
  }, []);

  const allTermsAccepted =
    templates?.length &&
    templates.every((template) => acceptedTerms[template.id]);

  const generateDocumentHash = (template: TermTemplate) => {
    // Simple hash based on template info
    const data = `${template.id}-${template.version}-${template.file_path}-${new Date().toISOString()}`;
    return btoa(data);
  };

  const handleSubmit = async () => {
    if (!analysis || !templates || !allTermsAccepted) return;

    setSubmitting(true);

    try {
      for (const template of templates) {
        await createAcceptance.mutateAsync({
          analysis_id: analysis.id,
          term_template_id: template.id,
          accepted_by_name: analysis.inquilino_nome,
          accepted_by_cpf: analysis.inquilino_cpf,
          accepted_by_email: analysis.inquilino_email || undefined,
          ip_address: ipAddress || "0.0.0.0",
          user_agent: navigator.userAgent,
          geolocation_city: geolocation.city,
          geolocation_state: geolocation.state,
          geolocation_country: geolocation.country,
          document_hash: generateDocumentHash(template),
        });
      }

      // Log to audit
      await supabase.from("audit_logs").insert({
        table_name: "digital_acceptances",
        action: "acceptance",
        record_id: analysis.id,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        new_data: {
          accepted_by_name: analysis.inquilino_nome,
          accepted_by_cpf: analysis.inquilino_cpf,
          terms_count: templates.length,
          geolocation,
        },
      });

      setSuccess(true);
    } catch (error) {
      console.error("Error submitting acceptance:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (template: TermTemplate) => {
    try {
      const { data, error } = await supabase.storage
        .from("term-templates")
        .download(template.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading:", error);
    }
  };

  if (loading || templatesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Análise não encontrada</h3>
            <p className="text-muted-foreground text-center">
              O link de aceite digital é inválido ou expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Aceite Registrado!</h3>
            <p className="text-muted-foreground text-center mb-6">
              Seus termos foram aceitos com sucesso. Você será redirecionado para a página de pagamento.
            </p>
            <div className="text-sm text-muted-foreground text-center space-y-1">
              <p>
                <strong>Data:</strong>{" "}
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <p>
                <strong>IP:</strong> {ipAddress}
              </p>
              {geolocation.city && (
                <p>
                  <strong>Local:</strong> {geolocation.city}, {geolocation.state}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <img src={tridotsLogo} alt="Tridots" className="h-12 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold">Aceite Digital de Termos</h1>
            <p className="text-muted-foreground">
              Leia e aceite os termos abaixo para prosseguir
            </p>
          </div>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Dados do Inquilino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{analysis.inquilino_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPF:</span>
                <span className="font-medium">{analysis.inquilino_cpf}</span>
              </div>
              {analysis.inquilino_email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{analysis.inquilino_email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Termos e Condições
            </CardTitle>
            <CardDescription>
              Leia cada documento e marque para confirmar que você leu e concorda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates?.length ? (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <Checkbox
                    id={template.id}
                    checked={acceptedTerms[template.id] || false}
                    onCheckedChange={(checked) =>
                      setAcceptedTerms((prev) => ({
                        ...prev,
                        [template.id]: checked === true,
                      }))
                    }
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={template.id}
                        className="font-medium cursor-pointer"
                      >
                        {template.name}
                      </label>
                      <Badge variant="outline" className="text-xs">
                        v{template.version}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-primary"
                      onClick={() => handleDownload(template)}
                    >
                      Baixar documento para leitura
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum termo disponível no momento.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="flex items-start gap-4 pt-6">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Informações de Segurança
              </h4>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Este aceite será registrado com seu IP ({ipAddress || "carregando..."})
                {geolocation.city && `, localização (${geolocation.city}, ${geolocation.state})`} 
                , data/hora e identificador do navegador para fins de auditoria e validade jurídica.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          size="lg"
          className="w-full"
          disabled={!allTermsAccepted || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando aceite...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Aceitar Termos e Prosseguir
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DigitalAcceptance;
