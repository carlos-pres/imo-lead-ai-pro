import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  Plus, 
  User, 
  Clock, 
  CheckCircle2,
  ExternalLink,
  FileText,
  History,
  Loader2,
  Search,
  Filter,
  Calendar,
  Star,
  Lock
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Lead, InteractionHistory } from "@shared/schema";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
}

const defaultTemplates: MessageTemplate[] = [
  {
    id: "initial",
    name: "Contacto Inicial",
    content: `Ola {name}!

Sou consultor imobiliario e vi o seu interesse no imovel em {location}.

Gostaria de saber se posso ajuda-lo com mais informacoes sobre esta propriedade ou outras opcoes semelhantes na zona.

Quando teria disponibilidade para conversarmos?`,
    category: "inicial",
    variables: ["name", "location"]
  },
  {
    id: "followup",
    name: "Follow-up",
    content: `Ola {name}!

Volto a contactar sobre o imovel em {location}.

Temos algumas novidades interessantes que podem ser do seu interesse.

Podemos agendar uma visita esta semana?`,
    category: "followup",
    variables: ["name", "location"]
  },
  {
    id: "visit",
    name: "Confirmacao de Visita",
    content: `Ola {name}!

Confirmo a visita ao imovel {property} em {location}.

Fico a aguardar a sua confirmacao. Qualquer duvida, estou disponivel.

Cumprimentos!`,
    category: "agendamento",
    variables: ["name", "property", "location"]
  },
  {
    id: "proposal",
    name: "Proposta Comercial",
    content: `Estimado/a {name},

Apos a nossa conversa sobre o imovel em {location}, envio-lhe os detalhes da proposta comercial.

Valor: {price}
Condicoes: Negociaveis

Aguardo o seu feedback.

Com os melhores cumprimentos`,
    category: "outro",
    variables: ["name", "location", "price"]
  }
];

const interactionTypeLabels: Record<string, { label: string; icon: typeof MessageSquare; color: string }> = {
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "text-green-500" },
  email: { label: "Email", icon: Mail, color: "text-blue-500" },
  call: { label: "Chamada", icon: Phone, color: "text-amber-500" },
  note: { label: "Nota", icon: FileText, color: "text-gray-500" },
  message_sent: { label: "Mensagem Enviada", icon: Send, color: "text-primary" },
  status_change: { label: "Alteracao de Estado", icon: CheckCircle2, color: "text-purple-500" },
};

function ProPlanGate({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth();
  const isPro = customer?.plan === "pro";

  if (!isPro) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Funcionalidade Pro</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            O CRM completo com historico de mensagens e templates personalizados 
            esta disponivel apenas no plano Pro.
          </p>
          <Button asChild data-testid="button-upgrade-pro">
            <a href="/loja">Fazer Upgrade para Pro</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

function LeadSelector({ 
  leads, 
  selectedLead, 
  onSelectLead 
}: { 
  leads: Lead[]; 
  selectedLead: Lead | null; 
  onSelectLead: (lead: Lead) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    quente: "bg-red-500",
    morno: "bg-orange-500",
    frio: "bg-blue-500"
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          Selecionar Lead
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar lead..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-crm-search"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {filteredLeads.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhum lead encontrado
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`w-full text-left p-3 rounded-lg transition-colors hover-elevate ${
                    selectedLead?.id === lead.id 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted"
                  }`}
                  data-testid={`card-lead-${lead.id}`}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => onSelectLead(lead)}
                    data-testid={`button-select-lead-${lead.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`h-3 w-3 rounded-full ${statusColors[lead.status as keyof typeof statusColors]}`} />
                        <span className="text-[10px] text-muted-foreground capitalize">{lead.status}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.location}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.source}</p>
                      </div>
                      {lead.aiScore && (
                        <Badge variant="secondary" className="text-xs">
                          {lead.aiScore}
                        </Badge>
                      )}
                    </div>
                  </button>
                  {lead.sourceUrl && (
                    <a
                      href={lead.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`link-lead-source-${lead.id}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver anúncio original
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function MessageComposer({ 
  lead, 
  templates,
  onSend 
}: { 
  lead: Lead | null; 
  templates: MessageTemplate[];
  onSend: (type: "whatsapp" | "email", message: string) => void;
}) {
  const [messageType, setMessageType] = useState<"whatsapp" | "email">("whatsapp");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const parseTemplate = (templateContent: string) => {
    if (!lead) return templateContent;
    return templateContent
      .replace(/{name}/g, lead.name)
      .replace(/{location}/g, lead.location)
      .replace(/{property}/g, lead.property)
      .replace(/{price}/g, lead.price);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(parseTemplate(template.content));
    }
  };

  const handleSend = async () => {
    if (!lead || !message.trim()) return;

    setIsSending(true);

    if (messageType === "whatsapp" && lead.contact) {
      const phone = lead.contact.replace(/\s+/g, '').replace(/^\+/, '');
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    } else if (messageType === "email" && lead.email) {
      const subject = encodeURIComponent(`Imovel em ${lead.location} - ImoLead AI Pro`);
      const body = encodeURIComponent(message);
      window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank');
    }

    onSend(messageType, message);
    
    toast({
      title: messageType === "whatsapp" ? "WhatsApp Aberto" : "Email Aberto",
      description: `Mensagem preparada para ${lead.name}`,
    });

    setIsSending(false);
  };

  if (!lead) {
    return (
      <Card className="h-full">
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">Selecione um Lead</h3>
          <p className="text-sm text-muted-foreground">
            Escolha um lead para iniciar uma conversa
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            Enviar Mensagem
          </CardTitle>
          <Badge variant="outline">{lead.name}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex gap-2">
          <Button
            variant={messageType === "whatsapp" ? "default" : "outline"}
            size="sm"
            onClick={() => setMessageType("whatsapp")}
            className="flex-1"
            disabled={!lead.contact}
            data-testid="button-crm-whatsapp"
          >
            <SiWhatsapp className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            variant={messageType === "email" ? "default" : "outline"}
            size="sm"
            onClick={() => setMessageType("email")}
            className="flex-1"
            disabled={!lead.email}
            data-testid="button-crm-email"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger data-testid="select-crm-template">
              <SelectValue placeholder="Escolha um template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label>Mensagem</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva a sua mensagem..."
            className="min-h-[150px] resize-none"
            data-testid="textarea-crm-message"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {messageType === "whatsapp" ? (
              <><Phone className="h-3 w-3" /> {lead.contact || "Sem telefone"}</>
            ) : (
              <><Mail className="h-3 w-3" /> {lead.email || "Sem email"}</>
            )}
          </span>
          <span>{message.length} caracteres</span>
        </div>

        <Button 
          onClick={handleSend} 
          disabled={isSending || !message.trim()} 
          className="w-full"
          data-testid="button-crm-send"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Abrir {messageType === "whatsapp" ? "WhatsApp" : "Cliente de Email"}
        </Button>
      </CardContent>
    </Card>
  );
}

function InteractionTimeline({ 
  leadId,
  interactions 
}: { 
  leadId: string | null;
  interactions: InteractionHistory[];
}) {
  const filteredInteractions = leadId 
    ? interactions.filter(i => i.leadId === leadId)
    : interactions;

  if (filteredInteractions.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Historico de Interacoes
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <History className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {leadId ? "Nenhuma interacao com este lead" : "Selecione um lead para ver o historico"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Historico de Interacoes
          <Badge variant="secondary" className="ml-auto">{filteredInteractions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-4">
            {filteredInteractions.map((interaction, index) => {
              const config = interactionTypeLabels[interaction.type] || interactionTypeLabels.note;
              const Icon = config.icon;
              
              return (
                <div key={interaction.id} className="relative pl-6">
                  {index < filteredInteractions.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                  )}
                  <div className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-background border flex items-center justify-center`}>
                    <Icon className={`h-3 w-3 ${config.color}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {interaction.createdAt && format(new Date(interaction.createdAt), "d MMM yyyy, HH:mm", { locale: pt })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {interaction.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function TemplateManager({ 
  templates, 
  onAddTemplate 
}: { 
  templates: MessageTemplate[];
  onAddTemplate: (template: Omit<MessageTemplate, "id">) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    category: "outro" as const,
  });

  const handleSave = () => {
    if (!newTemplate.name || !newTemplate.content) return;
    
    onAddTemplate({
      name: newTemplate.name,
      content: newTemplate.content,
      category: newTemplate.category,
      variables: [],
    });
    
    setNewTemplate({ name: "", content: "", category: "outro" });
    setIsOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates de Mensagem
            </CardTitle>
            <CardDescription>Modelos de mensagem reutilizaveis</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-template">
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Template</DialogTitle>
                <DialogDescription>
                  Crie um novo template de mensagem. Use {"{"}name{"}"}, {"{"}location{"}"}, {"{"}property{"}"}, {"{"}price{"}"} como variaveis.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Template</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Ex: Proposta de Venda"
                    data-testid="input-template-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select 
                    value={newTemplate.category} 
                    onValueChange={(v) => setNewTemplate({ ...newTemplate, category: v as typeof newTemplate.category })}
                  >
                    <SelectTrigger data-testid="select-template-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inicial">Contacto Inicial</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="agendamento">Agendamento</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conteudo</Label>
                  <Textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="Escreva o conteudo do template..."
                    className="min-h-[150px]"
                    data-testid="textarea-template-content"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} data-testid="button-save-template">Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => (
            <div 
              key={template.id} 
              className="border rounded-lg p-3 space-y-2 hover-elevate"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{template.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {template.content}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStats({ leads, interactions }: { leads: Lead[]; interactions: InteractionHistory[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayInteractions = interactions.filter(i => {
    const date = new Date(i.createdAt!);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  });

  const hotLeads = leads.filter(l => l.status === "quente").length;
  const warmLeads = leads.filter(l => l.status === "morno").length;
  const whatsappSent = interactions.filter(i => i.type === "whatsapp").length;
  const emailsSent = interactions.filter(i => i.type === "email").length;

  const stats = [
    { label: "Leads Quentes", value: hotLeads, icon: Star, color: "text-red-500" },
    { label: "Leads Mornos", value: warmLeads, icon: User, color: "text-orange-500" },
    { label: "WhatsApp Enviados", value: whatsappSent, icon: MessageSquare, color: "text-green-500" },
    { label: "Emails Enviados", value: emailsSent, icon: Mail, color: "text-blue-500" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CRMModule() {
  const { customer } = useAuth();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates);

  const { data: leadsData, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: !!customer,
  });

  const { data: interactionsData, isLoading: interactionsLoading } = useQuery<InteractionHistory[]>({
    queryKey: ["/api/interactions"],
    enabled: !!customer,
  });

  const leads = leadsData || [];
  const interactions = interactionsData || [];

  const addInteractionMutation = useMutation({
    mutationFn: async (data: { leadId: string; type: string; content: string }) => {
      const response = await apiRequest("POST", "/api/interactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
    },
    onError: (error: Error) => {
      console.error("Failed to save interaction:", error);
    }
  });

  const handleSendMessage = (type: "whatsapp" | "email", message: string) => {
    if (!selectedLead) return;

    addInteractionMutation.mutate({
      leadId: selectedLead.id,
      type: type,
      content: message.substring(0, 200) + (message.length > 200 ? "..." : ""),
    });
  };

  const handleAddTemplate = (template: Omit<MessageTemplate, "id">) => {
    const newTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
    };
    setTemplates([...templates, newTemplate]);
    toast({
      title: "Template criado!",
      description: `O template "${template.name}" foi adicionado com sucesso.`,
    });
  };

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ProPlanGate>
      <div className="space-y-6">
        <QuickStats leads={leads} interactions={interactions} />

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="messages" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-3" data-testid="tab-crm-messages">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="hidden sm:inline">Mensagens</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5">{leads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-3" data-testid="tab-crm-templates">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="hidden sm:inline">Templates</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5">{templates.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-3" data-testid="tab-crm-history">
              <div className="flex items-center gap-1.5">
                <History className="h-4 w-4 text-orange-500" />
                <span className="hidden sm:inline">Histórico</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5">{interactions.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <div className="grid gap-4 lg:grid-cols-3">
              <LeadSelector 
                leads={leads} 
                selectedLead={selectedLead} 
                onSelectLead={setSelectedLead} 
              />
              <MessageComposer 
                lead={selectedLead} 
                templates={templates}
                onSend={handleSendMessage}
              />
              <InteractionTimeline 
                leadId={selectedLead?.id || null} 
                interactions={interactions}
              />
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManager 
              templates={templates} 
              onAddTemplate={handleAddTemplate}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Todas as Interacoes
                </CardTitle>
                <CardDescription>
                  Historico completo de todas as interacoes com leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                {interactions.length === 0 ? (
                  <div className="py-8 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma interacao registrada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interactions.slice(0, 20).map((interaction) => {
                      const config = interactionTypeLabels[interaction.type] || interactionTypeLabels.note;
                      const Icon = config.icon;
                      const lead = leads.find(l => l.id === interaction.leadId);
                      
                      return (
                        <div key={interaction.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{config.label}</span>
                              {lead && (
                                <Badge variant="outline" className="text-xs">{lead.name}</Badge>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {interaction.createdAt && format(new Date(interaction.createdAt), "d MMM, HH:mm", { locale: pt })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {interaction.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProPlanGate>
  );
}
