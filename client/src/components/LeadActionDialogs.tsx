import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Home, 
  Euro, 
  Star, 
  MessageSquare, 
  Send, 
  Calendar,
  Clock,
  Loader2,
  ExternalLink
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

const statusConfig = {
  quente: { label: "Quente", className: "bg-red-500 text-white" },
  morno: { label: "Morno", className: "bg-orange-500 text-white" },
  frio: { label: "Frio", className: "bg-blue-500 text-white" }
} as const;

interface LeadDetailsDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  if (!lead) return null;

  const status = statusConfig[lead.status as keyof typeof statusConfig];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {lead.name}
            <Badge className={status.className}>{status.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Imóvel</p>
                  <p className="font-medium">{lead.property}</p>
                  <p className="text-xs text-muted-foreground">{lead.propertyType}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Localização</p>
                  <p className="font-medium">{lead.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Preço</p>
                  <p className="font-mono font-semibold text-lg">{lead.price}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{lead.contact || "Não informado"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{lead.email || "Não informado"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Score IA</p>
                  <p className="font-mono font-semibold text-lg">{lead.aiScore || 0}/100</p>
                </div>
              </div>
            </div>
          </div>

          {lead.aiReasoning && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-sm font-medium mb-2">Análise da IA</p>
              <p className="text-sm text-muted-foreground">{lead.aiReasoning}</p>
            </div>
          )}

          {lead.notes && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Notas</p>
              <p className="text-sm text-muted-foreground">{lead.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span>Origem: <strong>{lead.source}</strong></span>
            <span>Criado: <strong>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-PT') : 'N/A'}</strong></span>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {lead.sourceUrl && (
            <Button variant="outline" asChild className="gap-2" data-testid="button-view-ad">
              <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Ver Anúncio Original
              </a>
            </Button>
          )}
          {lead.contact && (
            <Button variant="outline" asChild className="gap-2" data-testid="button-whatsapp">
              <a 
                href={`https://wa.me/${lead.contact.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                WhatsApp
              </a>
            </Button>
          )}
          {lead.email && (
            <Button variant="outline" asChild className="gap-2" data-testid="button-email">
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Email
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SendMessageDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const messageTemplates = {
  initial: `Olá {name}!

Sou consultor imobiliário e vi o seu interesse no imóvel em {location}.

Gostaria de saber se posso ajudá-lo com mais informações sobre esta propriedade ou outras opções semelhantes na zona.

Quando teria disponibilidade para conversarmos?`,
  followup: `Olá {name}!

Volto a contactar sobre o imóvel em {location}.

Temos algumas novidades interessantes que podem ser do seu interesse. 

Podemos agendar uma visita esta semana?`,
  visit: `Olá {name}!

Confirmo a visita ao imóvel {property} em {location}.

Fico a aguardar a sua confirmação. Qualquer dúvida, estou disponível.

Cumprimentos!`
};

export function SendMessageDialog({ lead, open, onOpenChange }: SendMessageDialogProps) {
  const [messageType, setMessageType] = useState<"whatsapp" | "email">("whatsapp");
  const [template, setTemplate] = useState<keyof typeof messageTemplates>("initial");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const parseTemplate = (templateText: string) => {
    if (!lead) return templateText;
    return templateText
      .replace(/{name}/g, lead.name)
      .replace(/{location}/g, lead.location)
      .replace(/{property}/g, lead.property)
      .replace(/{price}/g, lead.price);
  };

  const handleTemplateChange = (value: keyof typeof messageTemplates) => {
    setTemplate(value);
    setMessage(parseTemplate(messageTemplates[value]));
  };

  const handleSend = async () => {
    if (!lead) return;

    setIsSending(true);

    if (messageType === "whatsapp" && lead.contact) {
      const phone = lead.contact.replace(/\s+/g, '').replace(/^\+/, '');
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
      
      toast({
        title: "WhatsApp Aberto",
        description: `Mensagem preparada para ${lead.name}`,
      });
    } else if (messageType === "email" && lead.email) {
      const subject = encodeURIComponent(`Imóvel em ${lead.location} - ImoLead AI Pro`);
      const body = encodeURIComponent(message);
      window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank');
      
      toast({
        title: "Email Aberto",
        description: `Email preparado para ${lead.name}`,
      });
    } else {
      toast({
        title: "Erro",
        description: messageType === "whatsapp" ? "Telefone não disponível" : "Email não disponível",
        variant: "destructive",
      });
    }

    setIsSending(false);
    onOpenChange(false);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar Mensagem
          </DialogTitle>
          <DialogDescription>
            Enviar mensagem para {lead.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={messageType === "whatsapp" ? "default" : "outline"}
              size="sm"
              onClick={() => setMessageType("whatsapp")}
              className="flex-1"
              disabled={!lead.contact}
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
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Template de Mensagem</Label>
            <Select value={template} onValueChange={(v) => handleTemplateChange(v as keyof typeof messageTemplates)}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial">Contacto Inicial</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
                <SelectItem value="visit">Confirmação de Visita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva a sua mensagem..."
              className="min-h-[150px]"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            {messageType === "whatsapp" && lead.contact && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.contact}
              </span>
            )}
            {messageType === "email" && lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {lead.email}
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || !message}>
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Abrir {messageType === "whatsapp" ? "WhatsApp" : "Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ScheduleEventDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleEventDialog({ lead, open, onOpenChange }: ScheduleEventDialogProps) {
  const [eventType, setEventType] = useState("visita");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!lead || !date || !time) {
      toast({
        title: "Erro",
        description: "Por favor preencha a data e hora",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const eventTitle = `${eventType === 'visita' ? 'Visita' : eventType === 'reuniao' ? 'Reunião' : 'Chamada'}: ${lead.name}`;
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
    
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatGoogleDate(startDateTime)}/${formatGoogleDate(endDateTime)}&details=${encodeURIComponent(`Lead: ${lead.name}\nImóvel: ${lead.property}\nLocalização: ${lead.location}\nPreço: ${lead.price}\n\nNotas: ${notes}`)}&location=${encodeURIComponent(lead.location)}`;

    window.open(googleCalendarUrl, '_blank');

    toast({
      title: "Evento Criado",
      description: `${eventType === 'visita' ? 'Visita' : eventType === 'reuniao' ? 'Reunião' : 'Chamada'} agendada para ${new Date(startDateTime).toLocaleString('pt-PT')}`,
    });

    setIsSaving(false);
    onOpenChange(false);
    setDate("");
    setTime("");
    setNotes("");
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Evento
          </DialogTitle>
          <DialogDescription>
            Agendar evento com {lead.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Evento</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visita">Visita ao Imóvel</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="chamada">Chamada Telefónica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais sobre o evento..."
              className="min-h-[80px]"
            />
          </div>

          <div className="border rounded-lg p-3 bg-muted/30 space-y-1">
            <p className="text-sm font-medium">{lead.property}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {lead.location}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duração: 1 hora
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSchedule} disabled={isSaving || !date || !time}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Abrir Google Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
