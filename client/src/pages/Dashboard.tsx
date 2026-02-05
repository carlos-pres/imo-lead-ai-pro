import { useState, useEffect } from "react";
import { useRoute, useSearch, useLocation } from "wouter";
import { useAuth, TrialBanner } from "@/lib/auth";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardHome } from "@/components/DashboardHome";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { ImportLeadsDialog } from "@/components/ImportLeadsDialog";
import { CasafariSearch } from "@/components/CasafariSearch";
import { OnboardingTour } from "@/components/OnboardingTour";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  Search, 
  BarChart3, 
  Settings, 
  Calendar,
  MessageSquare,
  LogOut,
  User,
  Bell,
  CreditCard,
  Loader2,
  Plug,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Key,
  Bot,
  ShieldCheck,
  Zap
} from "lucide-react";
import { AIAssistant } from "@/components/AIAssistant";
import { CRMModule } from "@/components/CRMModule";
import { AutomationSettings } from "@/components/AutomationSettings";
import { SearchConfiguration } from "@/components/SearchConfiguration";
import { AgendaModule } from "@/components/AgendaModule";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

type DashboardPage = "overview" | "leads" | "casafari" | "calendar" | "messages" | "reports" | "ai" | "settings";

const menuItems = [
  { id: "overview" as const, title: "Visao Geral", icon: LayoutDashboard },
  { id: "leads" as const, title: "Leads", icon: Users },
  { id: "casafari" as const, title: "Pesquisa Casafari", icon: Search },
  { id: "ai" as const, title: "Assistente IA", icon: Bot },
  { id: "calendar" as const, title: "Agenda", icon: Calendar },
  { id: "messages" as const, title: "CRM Pro", icon: MessageSquare },
  { id: "reports" as const, title: "Relatorios", icon: BarChart3 },
];

function DashboardSidebar({ 
  activePage, 
  onPageChange 
}: { 
  activePage: DashboardPage; 
  onPageChange: (page: DashboardPage) => void;
}) {
  const { customer, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">IL</span>
          </div>
          <span className="font-bold text-lg">ImoLead AI Pro</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activePage === item.id}
                    onClick={() => onPageChange(item.id)}
                    data-testid={`sidebar-${item.id}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activePage === "settings"}
                  onClick={() => onPageChange("settings")}
                  data-testid="sidebar-settings"
                >
                  <Settings className="h-4 w-4" />
                  <span>Definições</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="sidebar-admin">
                  <Link href="/admin">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Painel Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{customer?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{customer?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2" 
          onClick={logout}
          data-testid="button-sidebar-logout"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function OverviewPage({ onPageChange }: { onPageChange?: (page: DashboardPage) => void }) {
  return (
    <div className="space-y-6">
      <OnboardingTour onPageChange={onPageChange as ((page: string) => void) | undefined} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <p className="text-muted-foreground">Acompanhe o desempenho da sua prospeção imobiliária</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2" 
            data-testid="button-overview-leads"
            onClick={() => onPageChange?.("leads")}
          >
            <Users className="h-4 w-4" />
            Ver Leads
          </Button>
          <Button 
            className="gap-2" 
            data-testid="button-overview-search"
            onClick={() => onPageChange?.("casafari")}
          >
            <Search className="h-4 w-4" />
            Pesquisar
          </Button>
        </div>
      </div>
      <DashboardHome onNavigate={onPageChange as ((page: string) => void) | undefined} />
    </div>
  );
}

function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Leads</h2>
          <p className="text-muted-foreground">Visualize e gerencie todos os seus leads</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportLeadsDialog />
          <CreateLeadDialog />
        </div>
      </div>
      <DashboardHome />
    </div>
  );
}

function CasafariPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pesquisa Casafari</h2>
        <p className="text-muted-foreground">Pesquise imóveis e capte leads automaticamente</p>
      </div>
      <CasafariSearch />
    </div>
  );
}

function CalendarPage() {
  return <AgendaModule />;
}

function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">CRM - Mensagens</h2>
        <p className="text-muted-foreground">Gerencie comunicacoes com leads, templates e historico</p>
      </div>
      <CRMModule />
    </div>
  );
}

function ReportsPage() {
  const { customer } = useAuth();
  const planId = customer?.plan || "basic";
  const { getReportsPerWeek, getReportFrequencyLabel, getPlanConfig } = require("@shared/plans");
  const reportsPerWeek = getReportsPerWeek(planId);
  const frequencyLabel = getReportFrequencyLabel(planId);
  const planConfig = getPlanConfig(planId);

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  const hotLeads = leads.filter((l: any) => l.aiScore >= 80).length;
  const warmLeads = leads.filter((l: any) => l.aiScore >= 50 && l.aiScore < 80).length;
  const coldLeads = leads.filter((l: any) => l.aiScore < 50).length;
  const totalLeads = leads.length;
  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((acc: number, l: any) => acc + (l.aiScore || 0), 0) / totalLeads) : 0;

  const leadsBySource = leads.reduce((acc: Record<string, number>, lead: any) => {
    const source = lead.source || "Desconhecido";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const topLocations = leads.reduce((acc: Record<string, number>, lead: any) => {
    const location = lead.location || "Desconhecido";
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});

  const sortedLocations = Object.entries(topLocations)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5) as [string, number][];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">Análises e métricas do seu desempenho</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <BarChart3 className="h-3 w-3" />
            {frequencyLabel}
          </Badge>
          <Badge variant="secondary">{planConfig?.name || "Basic"}</Badge>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Frequência de Relatórios</p>
                <p className="text-sm text-muted-foreground">
                  {reportsPerWeek === 1 && "1 relatório por semana (semanal)"}
                  {reportsPerWeek === 3 && "3 relatórios por semana"}
                  {reportsPerWeek >= 7 && "Relatórios diários"}
                </p>
              </div>
            </div>
            {reportsPerWeek < 7 && (
              <Link href="/loja">
                <Button variant="outline" size="sm" className="gap-1" data-testid="button-upgrade-reports">
                  <Zap className="h-3 w-3" />
                  Fazer Upgrade
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">leads capturados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Quentes</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{hotLeads}</div>
            <p className="text-xs text-muted-foreground">score 80+</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Mornos</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warmLeads}</div>
            <p className="text-xs text-muted-foreground">score 50-79</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}</div>
            <p className="text-xs text-muted-foreground">pontuação média IA</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads por Origem</CardTitle>
            <CardDescription>Distribuição das fontes de leads</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(leadsBySource).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(leadsBySource).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm">{source}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${((count as number) / totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count as number}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sem dados de origem</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Localizações</CardTitle>
            <CardDescription>Zonas com mais leads</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedLocations.length > 0 ? (
              <div className="space-y-3">
                {sortedLocations.map(([location, count], index) => (
                  <div key={location} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                      <span className="text-sm">{location}</span>
                    </div>
                    <Badge variant="secondary">{count} leads</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sem dados de localização</p>
            )}
          </CardContent>
        </Card>
      </div>

      {reportsPerWeek >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Análise Avançada
              <Badge variant="default">Pro</Badge>
            </CardTitle>
            <CardDescription>Métricas avançadas disponíveis no seu plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0}%</p>
                <p className="text-xs text-muted-foreground">leads quentes</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Leads Frios</p>
                <p className="text-2xl font-bold text-blue-600">{coldLeads}</p>
                <p className="text-xs text-muted-foreground">score abaixo de 50</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Potencial Estimado</p>
                <p className="text-2xl font-bold text-green-600">{hotLeads + warmLeads}</p>
                <p className="text-xs text-muted-foreground">leads com potencial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportsPerWeek < 3 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Desbloqueie Análises Avançadas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Faça upgrade para o plano Pro ou Custom para aceder a métricas avançadas e relatórios mais frequentes.
            </p>
            <Link href="/loja">
              <Button className="gap-2" data-testid="button-unlock-advanced">
                <Zap className="h-4 w-4" />
                Ver Planos
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AIPage({ onPageChange }: { onPageChange?: (page: DashboardPage) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Assistente IA</h2>
          <p className="text-muted-foreground">Peça análises, gere mensagens e receba sugestões inteligentes</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2" 
            data-testid="button-view-leads"
            onClick={() => onPageChange?.("leads")}
          >
            <Users className="h-4 w-4" />
            Ver Leads
          </Button>
          <Button 
            className="gap-2" 
            data-testid="button-search-leads"
            onClick={() => onPageChange?.("casafari")}
          >
            <Search className="h-4 w-4" />
            Pesquisar
          </Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AIAssistant />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-5 w-5 text-primary" />
                Capacidades da IA
              </CardTitle>
              <CardDescription>O que o assistente pode fazer por si</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-3 p-2 rounded-lg hover-elevate cursor-pointer" data-testid="capability-analyze-leads">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Análise de Leads</h4>
                  <p className="text-xs text-muted-foreground">Analisa e prioriza leads baseado no potencial de conversão</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover-elevate cursor-pointer" data-testid="capability-generate-messages">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Geração de Mensagens</h4>
                  <p className="text-xs text-muted-foreground">Cria mensagens personalizadas para WhatsApp e email</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover-elevate cursor-pointer" data-testid="capability-followup">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Sugestões de Follow-up</h4>
                  <p className="text-xs text-muted-foreground">Recomenda melhores momentos e estratégias de contacto</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover-elevate cursor-pointer" data-testid="capability-insights">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Insights do Mercado</h4>
                  <p className="text-xs text-muted-foreground">Dicas sobre o mercado imobiliário português</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Dica do Dia</h4>
                  <p className="text-xs text-muted-foreground">Maximize a sua produtividade</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Contacte os leads quentes nas primeiras 24 horas - a taxa de conversão é 7x maior!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type IntegrationType = "casafari" | "whatsapp" | "idealista" | "olx" | "google" | null;

const integrationConfig: Record<string, { title: string; description: string; fields: { key: string; label: string; placeholder: string; type?: string }[] }> = {
  casafari: {
    title: "Configurar Casafari API",
    description: "Introduza as credenciais da sua conta Casafari para aceder à base de dados imobiliária.",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "Introduza a sua API Key" },
      { key: "apiSecret", label: "API Secret", placeholder: "Introduza o seu API Secret", type: "password" },
    ]
  },
  whatsapp: {
    title: "Configurar WhatsApp Business",
    description: "Configure a integração com o WhatsApp Business API para enviar mensagens automáticas.",
    fields: [
      { key: "phoneNumberId", label: "Phone Number ID", placeholder: "ID do número de telefone" },
      { key: "accessToken", label: "Access Token", placeholder: "Token de acesso da Meta", type: "password" },
    ]
  },
  idealista: {
    title: "Configurar Idealista",
    description: "Configure as credenciais para importar leads do portal Idealista.",
    fields: [
      { key: "username", label: "Email/Utilizador", placeholder: "O seu email no Idealista" },
      { key: "password", label: "Password", placeholder: "A sua password", type: "password" },
    ]
  },
  olx: {
    title: "Configurar OLX Portugal",
    description: "Configure as credenciais para captar leads dos classificados OLX.",
    fields: [
      { key: "username", label: "Email/Utilizador", placeholder: "O seu email no OLX" },
      { key: "password", label: "Password", placeholder: "A sua password", type: "password" },
    ]
  },
  google: {
    title: "Conectar Google Calendar",
    description: "Conecte a sua conta Google para sincronizar eventos e visitas.",
    fields: []
  }
};

function SettingsPage() {
  const { customer, updateCustomer } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    company: customer?.company || "",
  });
  const [integrationDialog, setIntegrationDialog] = useState<IntegrationType>(null);
  const [integrationFormData, setIntegrationFormData] = useState<Record<string, string>>({});

  const searchString = useSearch();
  const [, setLocation] = useLocation();
  
  const { data: googleCalendarStatus, refetch: refetchGoogleStatus } = useQuery<{ connected: boolean; configured: boolean }>({
    queryKey: ["/api/google-calendar/status"],
    refetchInterval: 30000,
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const googleConnected = params.get("google_connected");
    const googleError = params.get("google_error");
    
    if (googleConnected === "true") {
      refetchGoogleStatus();
      toast({
        title: "Google Calendar Conectado",
        description: "A sua conta Google foi conectada com sucesso. Pode agora sincronizar eventos.",
      });
      setLocation("/dashboard", { replace: true });
    } else if (googleError) {
      const errorMessages: Record<string, string> = {
        missing_params: "Parâmetros em falta na resposta do Google.",
        invalid_state: "A sessão de autorização expirou. Por favor tente novamente.",
        customer_not_found: "Utilizador não encontrado.",
        auth_failed: "Falha na autorização. Por favor tente novamente.",
        callback_failed: "Erro no processo de callback. Por favor tente novamente.",
      };
      toast({
        title: "Erro na Conexão",
        description: errorMessages[googleError] || "Ocorreu um erro ao conectar o Google Calendar.",
        variant: "destructive",
      });
      setLocation("/dashboard", { replace: true });
    }
  }, [searchString, toast, refetchGoogleStatus, setLocation]);

  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/google-calendar/auth-url");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível iniciar a conexão com o Google Calendar.",
        variant: "destructive",
      });
    },
  });

  const disconnectGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/google-calendar/disconnect");
      return response.json();
    },
    onSuccess: () => {
      refetchGoogleStatus();
      toast({
        title: "Desconectado",
        description: "O Google Calendar foi desconectado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível desconectar o Google Calendar.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PATCH", `/api/customers/${customer?.id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.customer) {
        updateCustomer(data.customer);
      }
      toast({
        title: "Perfil atualizado!",
        description: "As suas informações foram guardadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o perfil.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const openIntegrationDialog = (type: IntegrationType) => {
    console.log("Opening integration dialog for:", type);
    setIntegrationFormData({});
    setIntegrationDialog(type);
  };

  const handleIntegrationSave = () => {
    const config = integrationDialog ? integrationConfig[integrationDialog] : null;
    if (!config) return;
    
    toast({
      title: "Configuração guardada!",
      description: `A integração ${config.title.replace("Configurar ", "").replace("Conectar ", "")} foi configurada com sucesso.`,
    });
    setIntegrationDialog(null);
    setIntegrationFormData({});
  };

  const handleGoogleConnect = () => {
    setIntegrationDialog(null);
    if (googleCalendarStatus?.connected) {
      toast({
        title: "Já conectado!",
        description: "O Google Calendar já está conectado à sua conta.",
      });
    } else if (!googleCalendarStatus?.configured) {
      toast({
        title: "Não configurado",
        description: "O Google OAuth ainda não está configurado. Contacte o administrador.",
        variant: "destructive",
      });
    } else {
      connectGoogleMutation.mutate();
    }
  };

  const handleGoogleDisconnect = () => {
    disconnectGoogleMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Definições</h2>
        <p className="text-muted-foreground">Gerencie o seu perfil e preferências</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
            <CardDescription>Informações da sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-settings-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-settings-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-settings-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  data-testid="input-settings-company"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full gap-2"
                disabled={updateMutation.isPending}
                data-testid="button-settings-save"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A guardar...
                  </>
                ) : (
                  "Guardar Alterações"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscrição
            </CardTitle>
            <CardDescription>Detalhes do seu plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plano Atual</span>
              <Badge>Teste Grátis</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Leads Usados</span>
              <span className="text-sm font-medium">0 / 50</span>
            </div>
            <Link href="/loja">
              <Button variant="outline" className="w-full mt-4" data-testid="button-upgrade-plan">
                Fazer Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Preferências de notificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Novos leads</p>
                <p className="text-xs text-muted-foreground">Receber notificação quando um lead é captado</p>
              </div>
              <Badge variant="secondary">Em breve</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Relatórios por Email</p>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const planId = customer?.plan || "basic";
                    if (planId === "custom") return "Relatório diário às 08:00";
                    if (planId === "pro") return "Relatórios 3x/semana (Seg, Qua, Sex)";
                    return "Relatório semanal (Segunda)";
                  })()}
                </p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Lembretes de Eventos</p>
                <p className="text-xs text-muted-foreground">Alertas de visitas e reuniões agendadas</p>
              </div>
              <Badge variant="secondary">Em breve</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrações - Full Width */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Integrações
          </CardTitle>
          <CardDescription>Configure as suas integrações para automação de leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Casafari */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Casafari API</h4>
                    <p className="text-xs text-muted-foreground">Base de dados imobiliária</p>
                  </div>
                </div>
                <Badge variant="outline">Basic + Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Aceda à base de dados da Casafari para captar leads automaticamente.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Não configurado</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2" 
                data-testid="button-configure-casafari"
                onClick={() => openIntegrationDialog("casafari")}
              >
                <Key className="h-4 w-4" />
                Configurar API Key
              </Button>
            </div>

            {/* WhatsApp Business */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">WhatsApp Business</h4>
                    <p className="text-xs text-muted-foreground">Mensagens automáticas com IA</p>
                  </div>
                </div>
                <Badge variant="outline">Basic + Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Envie mensagens automáticas aos seus leads via WhatsApp com IA.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Não configurado</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2" 
                data-testid="button-configure-whatsapp"
                onClick={() => openIntegrationDialog("whatsapp")}
              >
                <Key className="h-4 w-4" />
                Configurar API
              </Button>
            </div>

            {/* Idealista */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <Search className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Idealista</h4>
                    <p className="text-xs text-muted-foreground">Portal imobiliário</p>
                  </div>
                </div>
                <Badge variant="outline">Basic + Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Importe leads diretamente do portal Idealista automaticamente.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Não configurado</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2" 
                data-testid="button-configure-idealista"
                onClick={() => openIntegrationDialog("idealista")}
              >
                <Key className="h-4 w-4" />
                Configurar Acesso
              </Button>
            </div>

            {/* OLX */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">OLX Portugal</h4>
                    <p className="text-xs text-muted-foreground">Classificados</p>
                  </div>
                </div>
                <Badge variant="outline">Basic + Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Capte leads de anúncios do OLX Portugal automaticamente.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Não configurado</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2" 
                data-testid="button-configure-olx"
                onClick={() => openIntegrationDialog("olx")}
              >
                <Key className="h-4 w-4" />
                Configurar Acesso
              </Button>
            </div>

            {/* Google Calendar */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Google Calendar</h4>
                    <p className="text-xs text-muted-foreground">Agenda de visitas</p>
                  </div>
                </div>
                <Badge variant="secondary">Plano Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Sincronize visitas e reuniões com o Google Calendar.
              </p>
              {googleCalendarStatus?.connected ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Conectado</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2" 
                      data-testid="button-google-connected"
                      disabled
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Ativo
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="gap-2" 
                      data-testid="button-disconnect-google"
                      onClick={handleGoogleDisconnect}
                      disabled={disconnectGoogleMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" />
                      Desconectar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Não conectado</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2" 
                    data-testid="button-connect-google"
                    onClick={handleGoogleConnect}
                    disabled={connectGoogleMutation.isPending}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {connectGoogleMutation.isPending ? "A conectar..." : "Conectar Conta Google"}
                  </Button>
                </>
              )}
            </div>

            {/* AI Analysis */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Análise IA</h4>
                    <p className="text-xs text-muted-foreground">Classificação automática</p>
                  </div>
                </div>
                <Badge variant="outline">Basic + Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Classificação e pontuação automática de leads com IA.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Ativo</span>
              </div>
              <Button variant="secondary" size="sm" className="w-full" disabled data-testid="button-ai-active">
                Configurado
              </Button>
            </div>

            {/* Templates */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Templates de Mensagens</h4>
                    <p className="text-xs text-muted-foreground">Mensagens personalizadas</p>
                  </div>
                </div>
                <Badge variant="outline">Basic + Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Crie templates personalizados para contactar leads. Pro: ilimitados.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Disponível</span>
              </div>
              <Button variant="secondary" size="sm" className="w-full" disabled data-testid="button-templates-active">
                Configurado
              </Button>
            </div>

            {/* Reports */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Relatórios</h4>
                    <p className="text-xs text-muted-foreground">Análises e métricas</p>
                  </div>
                </div>
                <Badge variant="outline">Basic + Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Basic: semanais. Pro: diários + exportação PDF.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Disponível</span>
              </div>
              <Button variant="secondary" size="sm" className="w-full" disabled data-testid="button-reports-active">
                Configurado
              </Button>
            </div>

            {/* MBWay */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Pagamento MBWay</h4>
                    <p className="text-xs text-muted-foreground">Pagamentos Portugal</p>
                  </div>
                </div>
                <Badge variant="outline">Basic + Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Pague a sua subscrição com MBWay, Multibanco ou Cartão.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Disponível</span>
              </div>
              <Button variant="secondary" size="sm" className="w-full" disabled data-testid="button-mbway-active">
                Via Stripe
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Configuration - All Plans */}
      <SearchConfiguration />

      {/* Automation Settings - Pro Only */}
      <AutomationSettings />

      {/* Integration Configuration Dialog */}
      <Dialog open={integrationDialog !== null} onOpenChange={(open) => !open && setIntegrationDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {integrationDialog && integrationConfig[integrationDialog]?.title}
            </DialogTitle>
            <DialogDescription>
              {integrationDialog && integrationConfig[integrationDialog]?.description}
            </DialogDescription>
          </DialogHeader>
          
          {integrationDialog && integrationConfig[integrationDialog]?.fields.length > 0 ? (
            <div className="space-y-4 py-4">
              {integrationConfig[integrationDialog].fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={integrationFormData[field.key] || ""}
                    onChange={(e) => setIntegrationFormData({
                      ...integrationFormData,
                      [field.key]: e.target.value
                    })}
                    data-testid={`input-integration-${field.key}`}
                  />
                </div>
              ))}
            </div>
          ) : integrationDialog === "google" ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Clique no botão abaixo para conectar a sua conta Google.
              </p>
            </div>
          ) : null}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIntegrationDialog(null)}
              data-testid="button-integration-cancel"
            >
              Cancelar
            </Button>
            {integrationDialog === "google" ? (
              <Button 
                onClick={handleGoogleConnect}
                data-testid="button-integration-google-connect"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Conectar Google
              </Button>
            ) : (
              <Button 
                onClick={handleIntegrationSave}
                data-testid="button-integration-save"
              >
                Guardar Configuração
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Dashboard() {
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const { customer, isAdminDemo, disableAdminDemo } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return <OverviewPage onPageChange={setActivePage} />;
      case "leads":
        return <LeadsPage />;
      case "casafari":
        return <CasafariPage />;
      case "calendar":
        return <CalendarPage />;
      case "messages":
        return <MessagesPage />;
      case "reports":
        return <ReportsPage />;
      case "ai":
        return <AIPage onPageChange={setActivePage} />;
      case "settings":
        return <SettingsPage />;
      default:
        return <OverviewPage onPageChange={setActivePage} />;
    }
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar activePage={activePage} onPageChange={setActivePage} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            {isAdminDemo && (
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-600 text-white">
                  Modo Apresentação
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={disableAdminDemo}
                  data-testid="button-exit-demo"
                >
                  Sair do Demo
                </Button>
              </div>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground hidden sm:block">
                Olá, {isAdminDemo ? "Admin" : customer?.name?.split(' ')[0]}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <EmailVerificationBanner />
            <TrialBanner />
            {renderPage()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
