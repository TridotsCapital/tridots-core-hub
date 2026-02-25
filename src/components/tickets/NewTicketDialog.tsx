import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCreateTicket } from '@/hooks/useTickets';
import { TicketCategory, TicketPriority } from '@/types/tickets';
import { Building2, User, Loader2, Search } from 'lucide-react';

interface Agency {
  id: string;
  nome_fantasia: string | null;
  razao_social: string;
  active: boolean;
}

interface Collaborator {
  user_id: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    active: boolean;
  };
}

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'urgente', label: 'Urgente' },
];

const PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'bg-green-100 text-green-800' },
  { value: 'media', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
];

export function NewTicketDialog({ open, onOpenChange, onSuccess }: NewTicketDialogProps) {
  const createTicket = useCreateTicket();
  
  // Agency search
  const [agencySearch, setAgencySearch] = useState('');
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');

  // Collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>('');

  // Form fields
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('tecnico');
  const [priority, setPriority] = useState<TicketPriority>('media');

  // Load all active agencies when dialog opens
  useEffect(() => {
    if (open) {
      const loadAgencies = async () => {
        setLoadingAgencies(true);
        const { data } = await supabase
          .from('agencies')
          .select('id, nome_fantasia, razao_social, active')
          .order('razao_social', { ascending: true });
        setAgencies(data || []);
        setLoadingAgencies(false);
      };
      loadAgencies();
    }
  }, [open]);

  // Filter agencies locally based on search
  const filteredAgencies = useMemo(() => {
    if (!agencySearch.trim()) return agencies;
    const search = agencySearch.toLowerCase();
    return agencies.filter(agency => {
      const name = (agency.nome_fantasia || agency.razao_social).toLowerCase();
      return name.includes(search);
    });
  }, [agencies, agencySearch]);

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId) || null;

  // Load collaborators when agency is selected
  useEffect(() => {
    const loadCollaborators = async () => {
      if (!selectedAgencyId) {
        setCollaborators([]);
        setSelectedCollaboratorId('');
        return;
      }

      setLoadingCollaborators(true);

      // Get agency_users
      const { data: agencyUsers } = await supabase
        .from('agency_users')
        .select('id, user_id')
        .eq('agency_id', selectedAgencyId);

      if (!agencyUsers?.length) {
        setCollaborators([]);
        setLoadingCollaborators(false);
        return;
      }

      const userIds = agencyUsers.map(au => au.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, active')
        .in('id', userIds)
        .eq('active', true);

      const collaboratorsData = agencyUsers.map(au => ({
        user_id: au.user_id,
        profile: profiles?.find(p => p.id === au.user_id) || null,
      })).filter(c => c.profile !== null);

      setCollaborators(collaboratorsData as Collaborator[]);
      setLoadingCollaborators(false);
    };

    loadCollaborators();
  }, [selectedAgencyId]);

  const handleSubmit = async () => {
    if (!selectedAgencyId || !subject.trim()) return;

    await createTicket.mutateAsync({
      agency_id: selectedAgencyId,
      subject,
      description,
      category,
      priority,
      assigned_to: selectedCollaboratorId || undefined,
    });

    // Reset form
    setSelectedAgencyId('');
    setSelectedCollaboratorId('');
    setSubject('');
    setDescription('');
    setCategory('tecnico');
    setPriority('media');
    setAgencySearch('');

    onOpenChange(false);
    onSuccess?.();
  };

  const getAgencyDisplayName = (agency: Agency) => {
    return agency.nome_fantasia || agency.razao_social;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Novo Chamado</DialogTitle>
          <DialogDescription>
            Abra um chamado para uma imobiliária parceira
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
          {/* Agency Select with Search */}
          <div className="space-y-2">
            <Label>Imobiliária *</Label>
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar imobiliária...">
                  {selectedAgency && (
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {getAgencyDisplayName(selectedAgency)}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar imobiliária..." 
                      value={agencySearch}
                      onChange={(e) => setAgencySearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                {loadingAgencies ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : filteredAgencies.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma imobiliária encontrada
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    {filteredAgencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {getAgencyDisplayName(agency)}
                          {!agency.active && (
                            <Badge variant="outline" className="ml-1 text-xs bg-amber-50 text-amber-700 border-amber-200">
                              Pendente
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Collaborator Select */}
          {selectedAgencyId && (
            <div className="space-y-2">
              <Label>Colaborador (opcional)</Label>
              {loadingCollaborators ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando colaboradores...
                </div>
              ) : collaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum colaborador ativo encontrado
                </p>
              ) : (
                <Select value={selectedCollaboratorId} onValueChange={setSelectedCollaboratorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborators.map((collab) => (
                      <SelectItem key={collab.user_id} value={collab.user_id}>
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {collab.profile.full_name}
                          <span className="text-muted-foreground text-xs">
                            ({collab.profile.email})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Resumo do chamado"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <Badge variant="secondary" className={p.color}>
                        {p.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o motivo do chamado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedAgencyId || !subject.trim() || createTicket.isPending}
          >
            {createTicket.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Chamado'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
