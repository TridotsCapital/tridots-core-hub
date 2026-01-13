import { useState, useEffect } from 'react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCreateTicket } from '@/hooks/useTickets';
import { TicketCategory, TicketPriority } from '@/types/tickets';
import { Check, ChevronsUpDown, Building2, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agency {
  id: string;
  nome_fantasia: string | null;
  razao_social: string;
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
  const [agencyOpen, setAgencyOpen] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

  // Collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>('');

  // Form fields
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('tecnico');
  const [priority, setPriority] = useState<TicketPriority>('media');

  // Search agencies
  useEffect(() => {
    const searchAgencies = async () => {
      if (agencySearch.length < 2) {
        setAgencies([]);
        return;
      }

      setLoadingAgencies(true);
      const { data } = await supabase
        .from('agencies')
        .select('id, nome_fantasia, razao_social')
        .eq('active', true)
        .or(`nome_fantasia.ilike.%${agencySearch}%,razao_social.ilike.%${agencySearch}%`)
        .limit(10);

      setAgencies(data || []);
      setLoadingAgencies(false);
    };

    const timeout = setTimeout(searchAgencies, 300);
    return () => clearTimeout(timeout);
  }, [agencySearch]);

  // Load collaborators when agency is selected
  useEffect(() => {
    const loadCollaborators = async () => {
      if (!selectedAgency) {
        setCollaborators([]);
        setSelectedCollaboratorId('');
        return;
      }

      setLoadingCollaborators(true);

      // Get agency_users
      const { data: agencyUsers } = await supabase
        .from('agency_users')
        .select('id, user_id')
        .eq('agency_id', selectedAgency.id);

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
  }, [selectedAgency]);

  const handleSubmit = async () => {
    if (!selectedAgency || !subject.trim()) return;

    await createTicket.mutateAsync({
      agency_id: selectedAgency.id,
      subject,
      description,
      category,
      priority,
    });

    // Reset form
    setSelectedAgency(null);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Chamado</DialogTitle>
          <DialogDescription>
            Abra um chamado para uma imobiliária parceira
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agency Search */}
          <div className="space-y-2">
            <Label>Imobiliária *</Label>
            <Popover open={agencyOpen} onOpenChange={setAgencyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={agencyOpen}
                  className="w-full justify-between"
                >
                  {selectedAgency ? (
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {getAgencyDisplayName(selectedAgency)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Buscar imobiliária...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Digite para buscar..." 
                    value={agencySearch}
                    onValueChange={setAgencySearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingAgencies ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : agencySearch.length < 2 ? (
                        'Digite ao menos 2 caracteres'
                      ) : (
                        'Nenhuma imobiliária encontrada'
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {agencies.map((agency) => (
                        <CommandItem
                          key={agency.id}
                          value={agency.id}
                          onSelect={() => {
                            setSelectedAgency(agency);
                            setAgencyOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAgency?.id === agency.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          {getAgencyDisplayName(agency)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Collaborator Select */}
          {selectedAgency && (
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedAgency || !subject.trim() || createTicket.isPending}
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
