import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Sparkles, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

interface Lead {
  id: string;
  name: string;
  contact: string;
  property: string;
  location: string;
  price: string;
  status: "quente" | "morno" | "frio";
}

interface WhatsAppPanelProps {
  lead: Lead;
  onMessageSent?: () => void;
}

export function WhatsAppPanel({ lead, onMessageSent }: WhatsAppPanelProps) {
  const { toast } = useToast();
  const [messageType, setMessageType] = useState<string>("first_contact");
  const [generatedMessage, setGeneratedMessage] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const { data: templates } = useQuery<WhatsAppTemplate[]>({
    queryKey: ["/api/whatsapp/templates"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/generate-message", {
        leadName: lead.name,
        propertyDescription: lead.property,
        propertyLocation: lead.location,
        propertyPrice: lead.price,
        leadStatus: lead.status,
        messageType,
        agentName: "Agente ImoLead",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedMessage(data.message);
      toast({
        title: "Mensagem Gerada",
        description: "A mensagem foi gerada pela IA com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível gerar a mensagem.",
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/leads/${lead.id}/send-whatsapp`, {
        messageType,
        agentName: "Agente ImoLead",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedMessage(data.message);
      toast({
        title: "Mensagem Enviada",
        description: "A mensagem WhatsApp foi enviada com sucesso.",
      });
      onMessageSent?.();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    },
  });

  const handleCopy = async () => {
    if (generatedMessage) {
      await navigator.clipboard.writeText(generatedMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copiado",
        description: "Mensagem copiada para a área de transferência.",
      });
    }
  };

  const messageTypes = [
    { value: "first_contact", label: "Primeiro Contacto" },
    { value: "follow_up", label: "Follow-up" },
    { value: "scheduling", label: "Agendamento" },
    { value: "offer", label: "Proposta" },
    { value: "closing", label: "Fecho" },
  ];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      first_contact: "Primeiro Contacto",
      follow_up: "Follow-up",
      scheduling: "Agendamento",
      offer: "Proposta",
      closing: "Fecho",
    };
    return labels[category] || category;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mensagem WhatsApp
        </CardTitle>
        <CardDescription>
          Envie mensagens automáticas geradas por IA para {lead.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Telefone:</span>
            <p className="font-medium">{lead.contact}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Estado:</span>
            <Badge 
              variant={lead.status === "quente" ? "default" : lead.status === "morno" ? "secondary" : "outline"}
              className="ml-2"
            >
              {lead.status === "quente" ? "Quente" : lead.status === "morno" ? "Morno" : "Frio"}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="messageType">Tipo de Mensagem</Label>
          <Select value={messageType} onValueChange={setMessageType}>
            <SelectTrigger id="messageType" data-testid="select-whatsapp-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {messageTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            data-testid="button-generate-message"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generateMutation.isPending ? "A gerar..." : "Gerar com IA"}
          </Button>
        </div>

        {generatedMessage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Mensagem Gerada</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                data-testid="button-copy-message"
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={generatedMessage}
              onChange={(e) => setGeneratedMessage(e.target.value)}
              rows={8}
              className="resize-none"
              data-testid="textarea-message"
            />
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => sendMutation.mutate()}
          disabled={sendMutation.isPending}
          data-testid="button-send-whatsapp"
        >
          <Send className="h-4 w-4 mr-2" />
          {sendMutation.isPending ? "A enviar..." : "Enviar via WhatsApp"}
        </Button>

        {templates && templates.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Templates Disponíveis</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-2 border rounded-md hover-elevate cursor-pointer"
                    onClick={() => setGeneratedMessage(template.content)}
                    data-testid={`template-${template.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{template.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(template.category)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
