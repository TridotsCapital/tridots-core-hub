import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Loader2, Briefcase, Building2, MapPin, FileText, Camera, FolderOpen } from "lucide-react";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { UserAvatarUpload } from "@/components/users/UserAvatarUpload";
import { AgencyLogoUpload } from "@/components/agency/AgencyLogoUpload";
import { AgencyDocumentsTab } from "@/components/agency/AgencyDocumentsTab";
import { 
  useUserProfile, 
  useUpdateUserProfile, 
  type AgencyPosition 
} from "@/hooks/useUserProfile";
import { useAgencyProfile, useUpdateAgencyProfile } from "@/hooks/useAgencyProfile";
import { useAgencyOnboardingStatus } from "@/hooks/useAgencyDocuments";

const positionLabels: Record<AgencyPosition, string> = {
  dono: "Dono da Imobiliária",
  gerente: "Gerente",
  auxiliar: "Auxiliar",
};

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

function UserProfileTab() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState<AgencyPosition>("auxiliar");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone || "");
      setPosition(profile.position || "auxiliar");
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      full_name: fullName,
      phone: phone || null,
      position,
      agency_user_id: profile?.agency_user_id || null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 pb-6 border-b">
        <UserAvatarUpload
          currentAvatarUrl={profile?.avatar_url}
          userName={profile?.full_name || "Usuário"}
          size="xl"
        />
        <p className="text-sm text-muted-foreground text-center">
          Clique na foto para alterar
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome Completo
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            required
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
            <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <Input
            id="email"
            value={profile?.email || ""}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            O email não pode ser alterado por questões de segurança.
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label htmlFor="position" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Função na Imobiliária
          </Label>
          <Select value={position} onValueChange={(v) => setPosition(v as AgencyPosition)}>
            <SelectTrigger id="position">
              <SelectValue placeholder="Selecione sua função" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(positionLabels) as [AgencyPosition, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full"
        disabled={updateProfile.isPending}
      >
        {updateProfile.isPending && (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        )}
        Salvar Alterações
      </Button>
    </form>
  );
}

function AgencyProfileTab() {
  const { data: agency, isLoading } = useAgencyProfile();
  const updateAgency = useUpdateAgencyProfile();

  const [nomeFantasia, setNomeFantasia] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelEmail, setResponsavelEmail] = useState("");
  const [responsavelTelefone, setResponsavelTelefone] = useState("");

  useEffect(() => {
    if (agency) {
      setNomeFantasia(agency.nome_fantasia || "");
      setEmail(agency.email || "");
      setTelefone(agency.telefone || "");
      setEndereco(agency.endereco || "");
      setCidade(agency.cidade || "");
      setEstado(agency.estado || "");
      setCep(agency.cep || "");
      setResponsavelNome(agency.responsavel_nome || "");
      setResponsavelEmail(agency.responsavel_email || "");
      setResponsavelTelefone(agency.responsavel_telefone || "");
    }
  }, [agency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency?.id) return;
    
    updateAgency.mutate({
      agencyId: agency.id,
      data: {
        nome_fantasia: nomeFantasia || null,
        email,
        telefone: telefone || null,
        endereco: endereco || null,
        cidade: cidade || null,
        estado: estado || null,
        cep: cep || null,
        responsavel_nome: responsavelNome,
        responsavel_email: responsavelEmail || null,
        responsavel_telefone: responsavelTelefone || null,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-24 w-24 rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Não foi possível carregar os dados da imobiliária.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Section */}
      <div className="flex flex-col items-center gap-4 pb-6 border-b">
        <AgencyLogoUpload
          agencyId={agency.id}
          currentLogoUrl={agency.logo_url}
          agencyName={agency.nome_fantasia || agency.razao_social}
          size="lg"
        />
        <p className="text-sm text-muted-foreground text-center">
          Clique no logo para alterar
        </p>
      </div>

      {/* Identification Section */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Identificação
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cnpj" className="flex items-center gap-2">
              CNPJ
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="cnpj"
              value={formatCnpj(agency.cnpj)}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="razaoSocial" className="flex items-center gap-2">
              Razão Social
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="razaoSocial"
              value={agency.razao_social}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
          <Input
            id="nomeFantasia"
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            placeholder="Nome fantasia da imobiliária"
          />
        </div>
      </div>

      <Separator />

      {/* Contact Section */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Dados de Contato
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agencyEmail">Email</Label>
            <Input
              id="agencyEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@imobiliaria.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agencyTelefone">Telefone</Label>
            <Input
              id="agencyTelefone"
              value={telefone}
              onChange={(e) => setTelefone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Billing Configuration - Read Only */}
      {agency.billing_due_day && (
        <>
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Configuração de Faturamento
            </h3>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Dia de Vencimento do Boleto Unificado
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input
                value={`Dia ${String(agency.billing_due_day).padStart(2, '0')}`}
                disabled
                className="bg-muted cursor-not-allowed max-w-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Dia de vencimento definido pela GarantFácil para faturas do Boleto Unificado.
              </p>
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Endereço
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua, número, complemento"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="São Paulo"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger id="estado">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BR.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={cep}
              onChange={(e) => setCep(formatCep(e.target.value))}
              placeholder="00000-000"
              maxLength={9}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Responsible Section */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Dados do Responsável
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="responsavelNome">Nome do Responsável</Label>
          <Input
            id="responsavelNome"
            value={responsavelNome}
            onChange={(e) => setResponsavelNome(e.target.value)}
            placeholder="Nome completo"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="responsavelEmail">Email do Responsável</Label>
            <Input
              id="responsavelEmail"
              type="email"
              value={responsavelEmail}
              onChange={(e) => setResponsavelEmail(e.target.value)}
              placeholder="responsavel@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="responsavelTelefone">Telefone do Responsável</Label>
            <Input
              id="responsavelTelefone"
              value={responsavelTelefone}
              onChange={(e) => setResponsavelTelefone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full"
        disabled={updateAgency.isPending}
      >
        {updateAgency.isPending && (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        )}
        Salvar Alterações
      </Button>
    </form>
  );
}

function AgencyProfileContent() {
  const { data: agency } = useAgencyProfile();
  const onboardingStatus = useAgencyOnboardingStatus(agency?.id);
  
  // Show documents tab first if agency is not active
  const showDocsPriority = agency && !agency.active;
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Configurações
          </CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais e os dados da imobiliária.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={showDocsPriority ? "documents" : "profile"} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Meu Perfil</span>
                <span className="sm:hidden">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="agency" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Imobiliária</span>
                <span className="sm:hidden">Dados</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2 relative">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Documentos</span>
                <span className="sm:hidden">Docs</span>
                {/* Badge for pending docs */}
                {showDocsPriority && (onboardingStatus.pendingDocuments.length > 0 || onboardingStatus.rejectedDocuments.length > 0) && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
              <UserProfileTab />
            </TabsContent>
            
            <TabsContent value="agency" className="mt-6">
              <AgencyProfileTab />
            </TabsContent>
            
            <TabsContent value="documents" className="mt-6">
              <AgencyDocumentsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AgencyProfile() {
  return (
    <AgencyLayout title="Meu Perfil" description="Gerencie suas informações pessoais e da imobiliária">
      <AgencyProfileContent />
    </AgencyLayout>
  );
}
