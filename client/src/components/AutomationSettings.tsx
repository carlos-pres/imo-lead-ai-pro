import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Zap, 
  Mail, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  Save,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Settings,
  Search,
  RefreshCw,
  Calendar
} from "lucide-react";

interface BackendAutomationSettings {
  id?: string;
  customerId: string;
  enabled: boolean;
  casafariEnabled: boolean;
  casafariSearchParams?: {
    locations?: string[];
    propertyTypes?: string[];
    priceMin?: number;
    priceMax?: number;
  };
  casafariSchedule: string;
  preferredChannel: string;
  autoMessageNewLead: boolean;
  autoFollowup3Days: boolean;
  autoFollowup7Days: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  newLeadTemplateId?: string;
  followupTemplateId?: string;
}

interface FrontendSettingsState {
  customerId: string;
  enabled: boolean;
  casafariEnabled: boolean;
  casafariSearchParams?: {
    locations?: string[];
    propertyTypes?: string[];
    priceMin?: number;
    priceMax?: number;
  };
  casafariSchedule: string;
  preferredChannel: string;
  autoMessageNewLead: boolean;
  autoFollowup3Days: boolean;
  autoFollowup7Days: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
}

interface UsageSummary {
  [key: string]: {
    count: number;
    totalUnits: number;
    totalCost: number;
  };
}

interface AutomationStatusData {
  enabled: boolean;
  casafariEnabled: boolean;
  schedule: string;
  totalLeads: number;
  leadsThisMonth: number;
  nextScheduledRun: string;
}

export function AutomationSettings() {
  const { customer } = useAuth();
  const { toast } = useToast();
  const isPro = customer?.plan === "pro";
  
  const [settings, setSettings] = useState<FrontendSettingsState>({
    customerId: customer?.id || "",
    enabled: false,
    casafariEnabled: false,
    casafariSchedule: "daily",
    preferredChannel: "whatsapp",
    autoMessageNewLead: true,
    autoFollowup3Days: true,
    autoFollowup7Days: false,
    quietHoursStart: 22,
    quietHoursEnd: 9,
  });

  const { data: savedSettings, isLoading: loadingSettings } = useQuery<BackendAutomationSettings>({
    queryKey: [`/api/automation-settings/${customer?.id}`],
    enabled: !!customer?.id && isPro,
  });

  const { data: usageSummary, isLoading: loadingUsage } = useQuery<UsageSummary>({
    queryKey: [`/api/usage/${customer?.id}/summary`],
    enabled: !!customer?.id && isPro,
  });

  const { data: automationStatus, isLoading: loadingStatus } = useQuery<AutomationStatusData>({
    queryKey: [`/api/automation/status/${customer?.id}`],
    enabled: !!customer?.id && isPro,
    refetchInterval: 60000,
  });

  const runSearchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/automation/run-search", {
        locations: settings.casafariSearchParams?.locations || ["Lisboa", "Porto"],
        propertyTypes: settings.casafariSearchParams?.propertyTypes || ["Apartamento", "Moradia"],
        priceMin: settings.casafariSearchParams?.priceMin || 100000,
        priceMax: settings.casafariSearchParams?.priceMax || 500000,
        sources: ["casafari", "idealista", "olx"],
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: [`/api/automation/status/${customer?.id}`] });
      toast({
        title: "Pesquisa concluída",
        description: `${data.leadsCreated} novos leads encontrados!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na pesquisa",
        description: error.message || "Não foi possível executar a pesquisa.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings({
        customerId: savedSettings.customerId || customer?.id || "",
        enabled: savedSettings.enabled ?? false,
        casafariEnabled: savedSettings.casafariEnabled ?? false,
        casafariSearchParams: savedSettings.casafariSearchParams,
        casafariSchedule: savedSettings.casafariSchedule || "daily",
        preferredChannel: savedSettings.preferredChannel || "whatsapp",
        autoMessageNewLead: savedSettings.autoMessageNewLead ?? true,
        autoFollowup3Days: savedSettings.autoFollowup3Days ?? true,
        autoFollowup7Days: savedSettings.autoFollowup7Days ?? false,
        quietHoursStart: savedSettings.quietHoursStart ?? 22,
        quietHoursEnd: savedSettings.quietHoursEnd ?? 9,
      });
    }
  }, [savedSettings, customer?.id]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: FrontendSettingsState) => {
      const response = await apiRequest("POST", "/api/automation-settings", {
        customerId: customer?.id,
        enabled: data.enabled,
        casafariEnabled: data.casafariEnabled,
        casafariSearchParams: data.casafariSearchParams,
        casafariSchedule: data.casafariSchedule,
        preferredChannel: data.preferredChannel,
        autoMessageNewLead: data.autoMessageNewLead,
        autoFollowup3Days: data.autoFollowup3Days,
        autoFollowup7Days: data.autoFollowup7Days,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/automation-settings/${customer?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/usage/${customer?.id}/summary`] });
      toast({
        title: "Configurações guardadas",
        description: "As suas preferências de automação foram atualizadas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao guardar",
        description: error.message || "Não foi possível guardar as configurações.",
        variant: "destructive",
      });
    },
  });

  const testCasafariMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/automation/test-casafari", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.configured ? "Casafari Configurado" : "Casafari Não Configurado",
        description: data.message,
        variant: data.configured ? "default" : "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/automation/test-email", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.configured ? "Email Configurado" : "Email Não Configurado",
        description: data.message,
        variant: data.configured ? "default" : "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automação de Leads
          </CardTitle>
          <CardDescription>Configure automações avançadas para gestão de leads</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Funcionalidade Pro</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            A automação de leads está disponível apenas no plano Pro. 
            Faça upgrade para automatizar a captação e contacto com leads.
          </p>
          <Button variant="default" asChild>
            <a href="/loja" data-testid="button-upgrade-automation">Fazer Upgrade para Pro</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loadingSettings) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">A carregar configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automação de Leads
              </CardTitle>
              <CardDescription>Configure automações avançadas para gestão de leads</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {settings.enabled ? (
                <Badge className="bg-green-600 text-white">
                  <Play className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Pause className="h-3 w-3 mr-1" />
                  Pausado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <h4 className="font-medium">Automação Geral</h4>
              <p className="text-sm text-muted-foreground">
                Ativar todas as automações configuradas
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              data-testid="switch-automation-enabled"
            />
          </div>

          {automationStatus && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Total de Leads</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-total-leads">{automationStatus.totalLeads}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Este Mês</span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-leads-this-month">{automationStatus.leadsThisMonth}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Próxima Pesquisa</span>
                </div>
                <p className="text-sm font-medium" data-testid="text-next-run">{automationStatus.nextScheduledRun}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Pesquisa Manual
              </h4>
              <p className="text-sm text-muted-foreground">
                Executar pesquisa de leads agora
              </p>
            </div>
            <Button
              onClick={() => runSearchMutation.mutate()}
              disabled={runSearchMutation.isPending}
              data-testid="button-run-search-now"
            >
              {runSearchMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  A pesquisar...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Pesquisar Agora
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="casafari" className="space-y-4">
        <TabsList className={`grid w-full ${isPro ? 'grid-cols-3' : 'grid-cols-4'}`}>
          <TabsTrigger value="casafari" data-testid="tab-casafari">Casafari</TabsTrigger>
          <TabsTrigger value="messaging" data-testid="tab-messaging">Mensagens</TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">Agendamento</TabsTrigger>
          {!isPro && <TabsTrigger value="usage" data-testid="tab-usage">Consumo</TabsTrigger>}
        </TabsList>

        <TabsContent value="casafari">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Captação Casafari
              </CardTitle>
              <CardDescription>
                Configure a captação automática de leads via Casafari API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Ativar Casafari</h4>
                  <p className="text-sm text-muted-foreground">
                    Captar leads automaticamente da Casafari
                  </p>
                </div>
                <Switch
                  checked={settings.casafariEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, casafariEnabled: checked })}
                  disabled={!settings.enabled}
                  data-testid="switch-casafari-enabled"
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="casafari-schedule">Frequência de Captação</Label>
                  <Select
                    value={settings.casafariSchedule}
                    onValueChange={(value) => setSettings({ ...settings, casafariSchedule: value })}
                  >
                    <SelectTrigger data-testid="select-casafari-schedule">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="twice_daily">Duas vezes por dia</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Testar Conexão</Label>
                  <Button
                    variant="outline"
                    onClick={() => testCasafariMutation.mutate()}
                    disabled={testCasafariMutation.isPending}
                    className="w-full"
                    data-testid="button-test-casafari"
                  >
                    {testCasafariMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    Testar Casafari
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Filtros de Pesquisa</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price-min" className="text-xs">Preço Mínimo</Label>
                    <Input
                      id="price-min"
                      type="number"
                      placeholder="100000"
                      value={settings.casafariSearchParams?.priceMin || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        casafariSearchParams: {
                          ...settings.casafariSearchParams,
                          priceMin: Number(e.target.value),
                        }
                      })}
                      data-testid="input-price-min"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price-max" className="text-xs">Preço Máximo</Label>
                    <Input
                      id="price-max"
                      type="number"
                      placeholder="500000"
                      value={settings.casafariSearchParams?.priceMax || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        casafariSearchParams: {
                          ...settings.casafariSearchParams,
                          priceMax: Number(e.target.value),
                        }
                      })}
                      data-testid="input-price-max"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mensagens Automáticas
              </CardTitle>
              <CardDescription>
                Configure o envio automático de mensagens aos leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Canal Preferido</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha o canal principal para envio de mensagens automáticas
                </p>
                
                <Select
                  value={settings.preferredChannel}
                  onValueChange={(value) => setSettings({ ...settings, preferredChannel: value })}
                  disabled={!settings.enabled}
                >
                  <SelectTrigger data-testid="select-preferred-channel" className="w-full">
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testEmailMutation.mutate()}
                  disabled={testEmailMutation.isPending || !settings.enabled}
                  data-testid="button-test-email"
                  className="w-full"
                >
                  {testEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Testar Envio de Email
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Gatilhos de Envio</Label>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Novo Lead</p>
                    <p className="text-xs text-muted-foreground">
                      Enviar mensagem quando um novo lead é captado
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoMessageNewLead}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoMessageNewLead: checked })}
                    disabled={!settings.enabled}
                    data-testid="switch-auto-new-leads"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Follow-up 3 Dias</p>
                    <p className="text-xs text-muted-foreground">
                      Enviar mensagem de follow-up após 3 dias sem resposta
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoFollowup3Days}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoFollowup3Days: checked })}
                    disabled={!settings.enabled}
                    data-testid="switch-auto-followup-3"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Follow-up 7 Dias</p>
                    <p className="text-xs text-muted-foreground">
                      Enviar mensagem final após 7 dias sem resposta
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoFollowup7Days}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoFollowup7Days: checked })}
                    disabled={!settings.enabled}
                    data-testid="switch-auto-followup-7"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Agendamento
              </CardTitle>
              <CardDescription>
                Configure horários de envio e horas de silêncio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Horas de Silêncio</Label>
                <p className="text-sm text-muted-foreground">
                  Nenhuma mensagem automática será enviada durante este período
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start" className="text-xs">Início</Label>
                    <Select
                      value={String(settings.quietHoursStart)}
                      onValueChange={(value) => setSettings({ ...settings, quietHoursStart: parseInt(value, 10) })}
                    >
                      <SelectTrigger data-testid="select-quiet-start">
                        <SelectValue placeholder="Selecione a hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end" className="text-xs">Fim</Label>
                    <Select
                      value={String(settings.quietHoursEnd)}
                      onValueChange={(value) => setSettings({ ...settings, quietHoursEnd: parseInt(value, 10) })}
                    >
                      <SelectTrigger data-testid="select-quiet-end">
                        <SelectValue placeholder="Selecione a hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Dica de Boas Práticas</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Recomendamos configurar horas de silêncio das 22:00 às 08:00 para respeitar 
                      a privacidade dos seus leads e aumentar as taxas de resposta.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {!isPro && (
          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Consumo e Utilização
                </CardTitle>
                <CardDescription>
                  Acompanhe o consumo de recursos e custos associados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsage ? (
                  <div className="py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : usageSummary && Object.keys(usageSummary).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(usageSummary).map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {type === 'lead_capture' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                          {type === 'ai_analysis' && <Zap className="h-5 w-5 text-purple-600" />}
                          {type === 'email_sent' && <Mail className="h-5 w-5 text-green-600" />}
                          {type === 'whatsapp_sent' && <MessageSquare className="h-5 w-5 text-green-600" />}
                          <div>
                            <p className="font-medium capitalize">{type.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.count} operações | {data.totalUnits} unidades
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-base font-mono">
                          {data.totalCost.toFixed(2)} EUR
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">Sem Dados de Consumo</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Os dados de consumo aparecerão aqui quando começar a usar as automações.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          className="gap-2"
          data-testid="button-save-automation"
        >
          {saveSettingsMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              A guardar...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
