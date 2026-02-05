import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2, Flame, Thermometer, Snowflake } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, MessageSquare, Calendar, Search, Loader2, Lock, ExternalLink, Phone, Mail, CheckCircle, AlertCircle, Clock, Home } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { LeadDetailsDialog, SendMessageDialog, ScheduleEventDialog } from "./LeadActionDialogs";
import { EmptyState } from "./EmptyState";

// Qualification tabs configuration
const qualificationConfig = {
  todos: { label: "Todos", icon: null },
  visitado: { label: "Visitados", icon: CheckCircle },
  pendente_visita: { label: "Pendente Visita", icon: AlertCircle },
  sem_resposta: { label: "Sem Resposta", icon: Clock },
  meu_imovel: { label: "Meus Imóveis", icon: Home },
} as const;

// Demo leads data for presentation mode
const DEMO_LEADS: Lead[] = [
  {
    id: "demo-1",
    name: "Maria Silva",
    property: "T3 Duplex",
    propertyType: "Apartamento",
    location: "Cascais, Lisboa",
    price: "€485.000",
    status: "quente",
    qualification: "visitado",
    ownerType: "particular",
    source: "Casafari",
    sourceUrl: "https://www.casafari.com/property/demo-1",
    contact: "+351 912 345 678",
    email: "maria.silva@email.pt",
    aiScore: 92,
    aiReasoning: "Lead com alto potencial - interessada em propriedade premium em zona valorizada.",
    notes: "Pretende comprar para residência própria.",
    optOut: false,
    customerId: null,
    lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "demo-2",
    name: "João Ferreira",
    property: "Moradia V4",
    propertyType: "Moradia",
    location: "Oeiras, Lisboa",
    price: "€750.000",
    status: "quente",
    qualification: "pendente_visita",
    ownerType: "profissional",
    source: "Idealista",
    sourceUrl: "https://www.idealista.pt/imovel/demo-2",
    contact: "+351 923 456 789",
    email: "joao.ferreira@empresa.pt",
    aiScore: 88,
    aiReasoning: "Investidor experiente. Alto poder de compra confirmado.",
    notes: "Quer propriedade para arrendamento.",
    optOut: false,
    customerId: null,
    lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "demo-3",
    name: "Ana Costa",
    property: "Apartamento T2",
    propertyType: "Apartamento",
    location: "Porto, Centro",
    price: "€320.000",
    status: "morno",
    qualification: "sem_resposta",
    ownerType: "particular",
    source: "OLX",
    sourceUrl: "https://www.olx.pt/anuncio/demo-3",
    contact: "+351 934 567 890",
    email: "ana.costa@gmail.com",
    aiScore: 65,
    aiReasoning: "Primeira compra de imóvel. Ainda a comparar opções.",
    notes: "Jovem profissional.",
    optOut: false,
    customerId: null,
    lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "demo-4",
    name: "Pedro Santos",
    property: "T4 Vista Mar",
    propertyType: "Apartamento",
    location: "Estoril, Cascais",
    price: "€890.000",
    status: "quente",
    qualification: "visitado",
    ownerType: "particular",
    source: "Casafari",
    sourceUrl: "https://www.casafari.com/property/demo-4",
    contact: "+351 945 678 901",
    email: "pedro.santos@business.com",
    aiScore: 95,
    aiReasoning: "CEO de empresa tech. Pronto para fechar negócio.",
    notes: "Visita agendada para sábado.",
    optOut: false,
    customerId: null,
    lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "demo-5",
    name: "Carla Rodrigues",
    property: "Loft Industrial",
    propertyType: "Apartamento",
    location: "Marvila, Lisboa",
    price: "€280.000",
    status: "morno",
    qualification: "visitado",
    ownerType: "particular",
    source: "Idealista",
    sourceUrl: "https://www.idealista.pt/imovel/demo-5",
    contact: "+351 956 789 012",
    email: "carla.r@design.pt",
    aiScore: 72,
    aiReasoning: "Designer de interiores. Interessada em espaços únicos.",
    notes: "Segunda visita realizada.",
    optOut: false,
    customerId: null,
    lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "demo-6",
    name: "Rui Martins",
    property: "Quinta com Vinha",
    propertyType: "Terreno",
    location: "Sintra",
    price: "€1.200.000",
    status: "frio",
    qualification: "sem_resposta",
    ownerType: "particular",
    source: "Casafari",
    sourceUrl: "https://www.casafari.com/property/demo-6",
    contact: "+351 967 890 123",
    email: "rui.martins@wine.pt",
    aiScore: 45,
    aiReasoning: "Projeto a longo prazo. Precisa de vender propriedade atual.",
    notes: "Timeline de 6-12 meses.",
    optOut: false,
    customerId: null,
    lastContact: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: "demo-7",
    name: "Sofia Almeida",
    property: "Penthouse T3",
    propertyType: "Apartamento",
    location: "Parque das Nações",
    price: "€650.000",
    status: "quente",
    qualification: "pendente_visita",
    ownerType: "profissional",
    source: "Idealista",
    sourceUrl: "https://www.idealista.pt/imovel/demo-7",
    contact: "+351 978 901 234",
    email: "sofia.almeida@corp.pt",
    aiScore: 90,
    aiReasoning: "Executiva multinacional. Relocação confirmada. Urgência alta.",
    notes: "Precisa de fechar em 30 dias.",
    optOut: false,
    customerId: null,
    lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "demo-8",
    name: "Miguel Oliveira",
    property: "Estúdio Renovado",
    propertyType: "Apartamento",
    location: "Alfama, Lisboa",
    price: "€195.000",
    status: "frio",
    qualification: "meu_imovel",
    ownerType: "particular",
    source: "OLX",
    sourceUrl: "https://www.olx.pt/anuncio/demo-8",
    contact: "+351 989 012 345",
    email: "miguel.o@student.pt",
    aiScore: 35,
    aiReasoning: "Estudante universitário. Budget limitado.",
    notes: "Precisa de estudar opções de crédito jovem.",
    optOut: false,
    customerId: null,
    lastContact: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
];

const statusConfig = {
  quente: { label: "Quente", className: "bg-red-500 text-white" },
  morno: { label: "Morno", className: "bg-orange-500 text-white" },
  frio: { label: "Frio", className: "bg-blue-500 text-white" }
} as const;

export function LeadsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [qualificationFilter, setQualificationFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>("todos");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  
  const { isAdminDemo, isProPlan } = useAuth();
  const { toast } = useToast();

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailsDialog(true);
  };

  const handleMessageLead = (lead: Lead) => {
    if (!isProPlan) {
      toast({
        title: "Funcionalidade Pro",
        description: "Faça upgrade para o plano Pro para enviar mensagens automáticas.",
        variant: "default",
      });
      return;
    }
    setSelectedLead(lead);
    setShowMessageDialog(true);
  };

  const handleScheduleLead = (lead: Lead) => {
    if (!isProPlan) {
      toast({
        title: "Funcionalidade Pro",
        description: "Faça upgrade para o plano Pro para agendar eventos.",
        variant: "default",
      });
      return;
    }
    setSelectedLead(lead);
    setShowScheduleDialog(true);
  };

  const { data: apiLeads = [], isLoading, error } = useQuery<Lead[]>({
    queryKey: ["/api/leads", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/leads?${params}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    enabled: !isAdminDemo, // Don't fetch when in demo mode
  });

  // Use demo leads when in admin demo mode, with search and qualification filtering
  const leads = useMemo(() => {
    const sourceLeads = isAdminDemo ? DEMO_LEADS : apiLeads;
    
    // Normalize leads - add default qualification and ownerType if missing
    const normalizedLeads = sourceLeads.map(lead => ({
      ...lead,
      qualification: lead.qualification || "pendente_visita",
      ownerType: lead.ownerType || "particular"
    }));
    
    let filtered = normalizedLeads;
    
    // Filter by qualification
    if (qualificationFilter !== "todos") {
      filtered = filtered.filter(lead => lead.qualification === qualificationFilter);
    }
    
    // Filter by status (quente/morno/frio)
    if (statusFilter !== "todos") {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    
    // Filter by owner type (particular/profissional)
    if (ownerTypeFilter !== "todos") {
      filtered = filtered.filter(lead => lead.ownerType === ownerTypeFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(term) ||
        lead.property.toLowerCase().includes(term) ||
        lead.location.toLowerCase().includes(term) ||
        lead.source.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [isAdminDemo, apiLeads, searchTerm, qualificationFilter, statusFilter, ownerTypeFilter]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0">
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle>Leads Recentes</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <SelectValue placeholder="Temperatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  <span className="flex items-center gap-2">Todas</span>
                </SelectItem>
                <SelectItem value="quente">
                  <span className="flex items-center gap-2"><Flame className="h-4 w-4 text-red-500" />Quente</span>
                </SelectItem>
                <SelectItem value="morno">
                  <span className="flex items-center gap-2"><Thermometer className="h-4 w-4 text-orange-500" />Morno</span>
                </SelectItem>
                <SelectItem value="frio">
                  <span className="flex items-center gap-2"><Snowflake className="h-4 w-4 text-blue-500" />Frio</span>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-owner-filter">
                <SelectValue placeholder="Proprietário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  <span className="flex items-center gap-2">Todos</span>
                </SelectItem>
                <SelectItem value="particular">
                  <span className="flex items-center gap-2"><User className="h-4 w-4" />Particular</span>
                </SelectItem>
                <SelectItem value="profissional">
                  <span className="flex items-center gap-2"><Building2 className="h-4 w-4" />Profissional</span>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-leads"
              />
            </div>
          </div>
        </div>
        <Tabs value={qualificationFilter} onValueChange={setQualificationFilter} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {Object.entries(qualificationConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="gap-1.5 data-[state=active]:bg-background"
                  data-testid={`tab-${key}`}
                >
                  {Icon && <Icon className={`h-4 w-4 ${key === 'pendente_visita' ? 'text-amber-500' : ''}`} />}
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Erro ao carregar leads. Tente novamente.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 && !isAdminDemo ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState type="noLeads" />
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      Nenhum lead encontrado para a pesquisa atual.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className="hover-elevate cursor-pointer" 
                      data-testid={`row-lead-${lead.id}`}
                      onClick={() => handleViewLead(lead)}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.property}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.location}</TableCell>
                      <TableCell className="font-mono font-semibold">{lead.price}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`font-mono ${
                            (lead.aiScore || 0) >= 80 ? "border-green-500 text-green-600 dark:border-green-400 dark:text-green-400" :
                            (lead.aiScore || 0) >= 50 ? "border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400" :
                            "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                          }`}
                        >
                          {lead.aiScore || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[lead.status as keyof typeof statusConfig].className}>
                          {statusConfig[lead.status as keyof typeof statusConfig].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.sourceUrl ? (
                          <a 
                            href={lead.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                            data-testid={`link-source-${lead.id}`}
                          >
                            {lead.source}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          lead.source
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {lead.sourceUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  asChild
                                  data-testid={`button-ad-${lead.id}`}
                                >
                                  <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 text-primary" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver Anúncio Original</TooltipContent>
                            </Tooltip>
                          )}
                          
                          {lead.contact && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  asChild
                                  data-testid={`button-whatsapp-${lead.id}`}
                                >
                                  <a 
                                    href={`https://wa.me/${lead.contact.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <Phone className="h-4 w-4 text-green-600" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>WhatsApp: {lead.contact}</TooltipContent>
                            </Tooltip>
                          )}
                          
                          {lead.email && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  asChild
                                  data-testid={`button-email-${lead.id}`}
                                >
                                  <a href={`mailto:${lead.email}`}>
                                    <Mail className="h-4 w-4 text-blue-600" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Email: {lead.email}</TooltipContent>
                            </Tooltip>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleViewLead(lead)}
                                data-testid={`button-view-${lead.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver Detalhes</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleMessageLead(lead)}
                                className={!isProPlan ? "opacity-60" : ""}
                                data-testid={`button-message-${lead.id}`}
                              >
                                {isProPlan ? (
                                  <MessageSquare className="h-4 w-4" />
                                ) : (
                                  <div className="relative">
                                    <MessageSquare className="h-4 w-4" />
                                    <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-muted-foreground" />
                                  </div>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isProPlan ? "Enviar Mensagem IA" : "Mensagem (Pro)"}
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleScheduleLead(lead)}
                                className={!isProPlan ? "opacity-60" : ""}
                                data-testid={`button-schedule-${lead.id}`}
                              >
                                {isProPlan ? (
                                  <Calendar className="h-4 w-4" />
                                ) : (
                                  <div className="relative">
                                    <Calendar className="h-4 w-4" />
                                    <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-muted-foreground" />
                                  </div>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isProPlan ? "Agendar Evento" : "Agendar (Pro)"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <LeadDetailsDialog
        lead={selectedLead}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
      
      <SendMessageDialog
        lead={selectedLead}
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
      />
      
      <ScheduleEventDialog
        lead={selectedLead}
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
      />
    </Card>
  );
}
