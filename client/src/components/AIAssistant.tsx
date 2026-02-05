import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { Bot, Send, User, Users, Loader2, Sparkles, MessageSquare, Lightbulb, TrendingUp, Search, Zap, RefreshCw, FileText, Clock, Calendar, Globe, ExternalLink, Star } from "lucide-react";
import type { Lead } from "@shared/schema";

// Function to convert URLs in text to clickable links
function renderMessageWithLinks(content: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
          data-testid={`link-source-${index}`}
        >
          {part.length > 40 ? part.substring(0, 40) + "..." : part}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AutomationStatus {
  enabled: boolean;
  casafariEnabled: boolean;
  schedule: string;
  totalLeads: number;
  leadsThisMonth: number;
  nextScheduledRun: string;
}

const suggestionCommands = [
  { icon: Search, text: "Pesquisar leads agora", command: "SEARCH_LEADS", isAction: true, description: "Casafari, Idealista, OLX" },
  { icon: TrendingUp, text: "Analisar meus leads", command: "Analisa os meus leads e diz-me quais devo contactar hoje" },
  { icon: MessageSquare, text: "Criar mensagem", command: "Ajuda-me a criar uma mensagem profissional para um lead" },
  { icon: FileText, text: "Gerar relatorio", command: "GENERATE_REPORT", isAction: true, proOnly: true },
  { icon: Lightbulb, text: "Dicas do dia", command: "Que dicas tens para mim hoje baseado nos meus leads?" },
  { icon: Calendar, text: "Planear semana", command: "Ajuda-me a planear os contactos desta semana" },
];

export function AIAssistant() {
  const { toast } = useToast();
  const { customer } = useAuth();
  
  // Get customer's first name for personalized messages
  const customerFirstName = customer?.name?.split(" ")[0] || "";
  
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 19 ? "Boa tarde" : "Boa noite";
    
    if (customerFirstName) {
      return `${greeting}, ${customerFirstName}! Sou o teu assistente IA do ImoLead.

Estou aqui para te ajudar a:
- Pesquisar leads em Casafari, Idealista e OLX
- Analisar e priorizar os teus leads
- Gerar mensagens personalizadas
- Dar sugestoes estrategicas

Usa os botoes abaixo ou escreve o que precisas!`;
    }
    return `${greeting}! Sou o assistente IA do ImoLead.

Posso pesquisar leads, analisar o teu pipeline, gerar mensagens e dar sugestoes estrategicas. Como posso ajudar?`;
  };
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPro = customer?.plan === "pro";

  // Load chat history from database
  const { data: chatHistory } = useQuery<Array<{ id: string; role: string; content: string; createdAt: string }>>({
    queryKey: ["/api/chat/history"],
    enabled: !!customer?.id,
  });

  // Save message to database
  const saveMessageMutation = useMutation({
    mutationFn: async (message: { role: "user" | "assistant"; content: string }) => {
      const response = await apiRequest("POST", "/api/chat/message", message);
      return response.json();
    },
  });

  // Initialize messages from history or welcome message
  useEffect(() => {
    if (historyLoaded) return;
    
    if (chatHistory && chatHistory.length > 0) {
      // Load messages from database history
      const loadedMessages: Message[] = chatHistory.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(loadedMessages);
      setHistoryLoaded(true);
    } else if (chatHistory !== undefined && chatHistory.length === 0) {
      // No history, show welcome message
      const welcomeMessage = getWelcomeMessage();
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
      setHistoryLoaded(true);
    }
  }, [chatHistory, historyLoaded]);

  // Update welcome message when customer name becomes available
  useEffect(() => {
    if (!historyLoaded || messages.length === 0) return;
    
    if (customerFirstName && messages[0]?.id === "welcome" && !messages[0].content.includes(customerFirstName)) {
      const welcomeMessage = getWelcomeMessage();
      setMessages(prev => [{
        ...prev[0],
        content: welcomeMessage,
      }, ...prev.slice(1)]);
    }
  }, [customerFirstName, historyLoaded]);

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: automationStatus } = useQuery<AutomationStatus>({
    queryKey: [`/api/automation/status/${customer?.id}`],
    enabled: !!customer?.id,
    refetchInterval: 60000,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Prepare conversation history (exclude welcome message, limit to last 10)
      const history = messages
        .filter(m => m.id !== "welcome")
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));
      
      // Prepare top leads summary for AI context
      const topLeads = [...(leads || [])]
        .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
        .slice(0, 5)
        .map(l => `- ${l.name} | ${l.property} | ${l.location} | ${l.price} | Score: ${l.aiScore} | Status: ${l.status}`)
        .join("\n");
      
      const response = await apiRequest("POST", "/api/ai/chat", { 
        message,
        context: {
          customerName: customerFirstName,
          customerPlan: customer?.plan || "basic",
          totalLeads: leads?.length || 0,
          hotLeads: leads?.filter(l => l.status === "quente").length || 0,
          warmLeads: leads?.filter(l => l.status === "morno").length || 0,
          coldLeads: leads?.filter(l => l.status === "frio").length || 0,
          leadsDetails: topLeads || undefined,
        },
        conversationHistory: history,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      // Save assistant response to database
      saveMessageMutation.mutate({ role: "assistant", content: data.response });
    },
    onError: (error: Error) => {
      const isAuthError = error.message?.includes("401") || error.message?.includes("Token") || error.message?.includes("autenticação");
      
      toast({
        title: isAuthError ? "Sessão expirada" : "Erro",
        description: isAuthError 
          ? "Por favor, faça login novamente." 
          : (error.message || "Não foi possível processar o comando."),
        variant: "destructive",
      });
      
      const errorContent = isAuthError
        ? "A sua sessão expirou. Por favor, faça logout e login novamente para continuar a usar o assistente."
        : "Desculpe, ocorreu um erro ao processar o seu pedido. Por favor, tente novamente.";
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      // Persist error message to database
      saveMessageMutation.mutate({ role: "assistant", content: errorContent });
    },
  });

  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const startStreamingSearch = async () => {
    setIsSearching(true);
    const messageId = Date.now().toString();
    setStreamingMessageId(messageId);

    // Add initial streaming message
    const streamingMessage: Message = {
      id: messageId,
      role: "assistant",
      content: "A iniciar pesquisa em tempo real...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, streamingMessage]);

    const token = localStorage.getItem("authToken");
    
    try {
      const response = await fetch("/api/search/stream", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "text/event-stream",
        },
      });

      if (!response.ok) {
        throw new Error("Falha na autenticacao");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming nao suportado");
      }

      const decoder = new TextDecoder();
      let currentContent = "";
      const createdLeads: any[] = [];
      let buffer = "";
      
      // SSE parser state (persisted across chunks)
      let pendingEvent = "";
      let pendingDataLines: string[] = [];

      const processEvent = (eventType: string, data: any) => {
        if (eventType === "status") {
          currentContent = data.message;
        } else if (eventType === "source_complete") {
          currentContent += `\n[OK] ${data.source}: ${data.found} imoveis encontrados`;
        } else if (eventType === "lead_created") {
          createdLeads.push(data.lead);
          currentContent = currentContent.split("\n--- LEADS CRIADOS ---")[0];
          currentContent += `\n\n--- LEADS CRIADOS (${createdLeads.length}) ---`;
          createdLeads.slice(-3).forEach((lead) => {
            currentContent += `\n+ ${lead.name}`;
            if (lead.contact) currentContent += ` | Tel: ${lead.contact}`;
            if (lead.email) currentContent += ` | ${lead.email}`;
          });
          if (createdLeads.length > 3) {
            currentContent += `\n... e mais ${createdLeads.length - 3} leads`;
          }
        } else if (eventType === "complete") {
          let finalContent = `Pesquisa concluida!\n\nResultados por fonte:\n`;
          data.searchResults.forEach((r: any) => {
            finalContent += `- ${r.source}: ${r.found} encontrados, ${r.added} adicionados\n`;
          });
          finalContent += `\nTotal de novos leads criados: ${data.leadsCreated}`;

          if (data.leads && data.leads.length > 0) {
            finalContent += `\n\n--- NOVOS LEADS ---\n`;
            data.leads.forEach((lead: any) => {
              finalContent += `\n${lead.name}`;
              finalContent += `\n  Imovel: ${lead.property}`;
              finalContent += `\n  Localizacao: ${lead.location}`;
              finalContent += `\n  Preco: ${lead.price}`;
              if (lead.contact) finalContent += `\n  Contacto: ${lead.contact}`;
              if (lead.email) finalContent += `\n  Email: ${lead.email}`;
              finalContent += `\n  Fonte: ${lead.source} | Score: ${lead.aiScore} (${lead.status})`;
              if (lead.sourceUrl) finalContent += `\n  Ver anuncio: ${lead.sourceUrl}`;
              finalContent += `\n`;
            });
          }
          currentContent = finalContent;

          queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
          queryClient.invalidateQueries({ queryKey: [`/api/automation/status/${customer?.id}`] });
          
          toast({
            title: "Pesquisa concluida",
            description: `${data.leadsCreated} novos leads encontrados!`,
          });
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: currentContent } : m))
        );
      };

      const dispatchPendingEvent = () => {
        if (pendingDataLines.length > 0) {
          const dataStr = pendingDataLines.join("\n");
          try {
            const parsedData = JSON.parse(dataStr);
            processEvent(pendingEvent || "message", parsedData);
          } catch (e) {
            console.error("Failed to parse SSE data:", e);
          }
        }
        pendingEvent = "";
        pendingDataLines = [];
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line === "") {
            // Blank line = end of event, dispatch it
            dispatchPendingEvent();
          } else if (line.startsWith("event: ")) {
            pendingEvent = line.substring(7);
          } else if (line.startsWith("data: ")) {
            pendingDataLines.push(line.substring(6));
          }
          // Ignore other lines (comments starting with :, etc.)
        }
      }
      
      // Dispatch any remaining event
      dispatchPendingEvent();

      // Save final search result to database
      if (currentContent) {
        saveMessageMutation.mutate({ role: "assistant", content: currentContent });
      }

      setIsSearching(false);
      setStreamingMessageId(null);
    } catch (error: any) {
      console.error("Streaming search error:", error);
      const errorContent = "Erro na pesquisa. Tente novamente.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: errorContent }
            : m
        )
      );
      // Persist error message to database
      saveMessageMutation.mutate({ role: "assistant", content: errorContent });
      setIsSearching(false);
      setStreamingMessageId(null);
    }
  };

  const reportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/report", {
        period: new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.report,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      // Save report to database
      saveMessageMutation.mutate({ role: "assistant", content: data.report });
      setIsGeneratingReport(false);
      
      toast({
        title: "Relatório gerado",
        description: `Relatório de ${data.period} criado com sucesso!`,
      });
    },
    onError: (error: Error) => {
      const errorContent = error.message?.includes("403") 
        ? "A geração de relatórios está disponível apenas para utilizadores Pro. Faça upgrade para aceder a esta funcionalidade."
        : `Erro ao gerar relatório: ${error.message || "Tente novamente."}`;
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      // Persist error message to database
      saveMessageMutation.mutate({ role: "assistant", content: errorContent });
      setIsGeneratingReport(false);
      
      toast({
        title: "Erro no relatório",
        description: error.message || "Não foi possível gerar o relatório.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const messageContent = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    // Save user message to database
    saveMessageMutation.mutate({ role: "user", content: messageContent });
    chatMutation.mutate(messageContent);
    setInput("");
  };

  const handleSuggestionClick = (command: string, isAction?: boolean, proOnly?: boolean) => {
    if (chatMutation.isPending || isSearching || isGeneratingReport) return;

    if (command === "SEARCH_LEADS") {
      const msgContent = "Procurar novos leads em sites imobiliários";
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: msgContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      saveMessageMutation.mutate({ role: "user", content: msgContent });
      
      startStreamingSearch();
      return;
    }

    if (command === "GENERATE_REPORT") {
      if (!isPro) {
        const upgradeContent = "A geração de relatórios está disponível apenas para utilizadores Pro. Faça upgrade para aceder a esta funcionalidade avançada.";
        const upgradeMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: upgradeContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, upgradeMessage]);
        saveMessageMutation.mutate({ role: "assistant", content: upgradeContent });
        return;
      }
      
      setIsGeneratingReport(true);
      const msgContent = "Gerar relatório de leads";
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: msgContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      saveMessageMutation.mutate({ role: "user", content: msgContent });
      
      const generatingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "A gerar relatório executivo dos seus leads... Isto pode demorar alguns segundos.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, generatingMessage]);
      
      reportMutation.mutate();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: command,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    saveMessageMutation.mutate({ role: "user", content: command });
    chatMutation.mutate(command);
  };

  return (
    <Card className="h-full min-h-[700px] flex flex-col">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Assistente IA ImoLead</CardTitle>
              <CardDescription className="text-sm">O teu aliado digital para gestao de leads imobiliarios</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {automationStatus?.enabled && (
              <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/30" data-testid="badge-automation-enabled">
                <Zap className="h-3 w-3" />
                Automacao Ativa
              </Badge>
            )}
            <Badge variant="outline" className="gap-1" data-testid="badge-ai-status">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Online
            </Badge>
          </div>
        </div>
        
        {/* Stats Panel - More prominent */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold text-primary" data-testid="text-total-leads">{automationStatus?.totalLeads || leads?.length || 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Leads Quentes</span>
            </div>
            <p className="text-2xl font-bold text-red-500" data-testid="text-hot-leads">{leads?.filter(l => l.status === "quente").length || 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Este Mes</span>
            </div>
            <p className="text-2xl font-bold text-green-500" data-testid="text-leads-this-month">{automationStatus?.leadsThisMonth || 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Proxima Pesquisa</span>
            </div>
            <p className="text-xl font-bold text-blue-500" data-testid="text-next-scheduled-run">{automationStatus?.nextScheduledRun || "09:00"}</p>
          </div>
        </div>

        {/* Sources indicator */}
        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>Fontes: Casafari, Idealista, OLX</span>
          <span className="text-xs">|</span>
          <span className="text-xs">Pesquisa automatica diaria as 09:00</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="px-4 py-3 border-b bg-muted/30">
          {(!leads || leads.length === 0) ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20" data-testid="alert-no-leads">
              <Sparkles className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400" data-testid="text-no-leads-message">
                  Comece por pesquisar leads!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-no-leads-action">
                  Clica em "Pesquisar leads agora" para encontrar oportunidades.
                </p>
              </div>
            </div>
          ) : leads.filter(l => l.status === "quente").length > 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20" data-testid="alert-hot-leads">
              <Star className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400" data-testid="text-hot-leads-count">
                  {leads.filter(l => l.status === "quente").length} lead{leads.filter(l => l.status === "quente").length > 1 ? "s" : ""} quente{leads.filter(l => l.status === "quente").length > 1 ? "s" : ""} a aguardar contacto!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-hot-leads-action">
                  Contacta-os hoje para nao perder a oportunidade.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Tens {leads.length} leads no pipeline
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Usa o assistente para analisar e priorizar os contactos.
                </p>
              </div>
            </div>
          )}
        </div>
        {messages.length === 1 && (
          <div className="px-4 py-4 border-b">
            <p className="text-sm font-medium mb-3">Acoes rapidas:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {suggestionCommands.map((suggestion, index) => (
                <Button
                  key={index}
                  variant={(suggestion as any).isAction ? "default" : "outline"}
                  className="h-auto py-3 px-4 justify-start gap-3 text-left whitespace-normal flex-col items-start"
                  onClick={() => handleSuggestionClick(suggestion.command, (suggestion as any).isAction, (suggestion as any).proOnly)}
                  disabled={chatMutation.isPending || isSearching || isGeneratingReport}
                  data-testid={`button-ai-suggestion-${index}`}
                >
                  <div className="flex items-center gap-2 w-full">
                    {(isSearching && suggestion.command === "SEARCH_LEADS") || (isGeneratingReport && suggestion.command === "GENERATE_REPORT") ? (
                      <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />
                    ) : (
                      <suggestion.icon className="h-5 w-5 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{suggestion.text}</span>
                    {(suggestion as any).proOnly && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-auto">Pro</Badge>
                    )}
                  </div>
                  {(suggestion as any).description && (
                    <span className="text-xs text-muted-foreground">{(suggestion as any).description}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea ref={scrollRef} className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.role === "assistant" 
                      ? renderMessageWithLinks(sanitizeText(message.content))
                      : sanitizeText(message.content)
                    }
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {(chatMutation.isPending || isSearching || isGeneratingReport) && (
              <div className="flex gap-3 justify-start" data-testid="container-ai-loading">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isSearching ? (
                      <>
                        <Search className="h-4 w-4 animate-pulse" />
                        <span className="text-sm text-muted-foreground" data-testid="text-searching-status">A pesquisar leads...</span>
                      </>
                    ) : isGeneratingReport ? (
                      <>
                        <FileText className="h-4 w-4 animate-pulse" />
                        <span className="text-sm text-muted-foreground" data-testid="text-report-status">A gerar relatório...</span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground" data-testid="text-processing-status">A processar...</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva um comando ou pergunta..."
              disabled={chatMutation.isPending || isSearching || isGeneratingReport}
              data-testid="input-ai-chat"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={chatMutation.isPending || isSearching || isGeneratingReport || !input.trim()}
              data-testid="button-ai-send"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
