import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  MapPin, 
  Home, 
  Euro, 
  Search, 
  Clock, 
  Loader2, 
  CheckCircle,
  Building,
  Bed,
  Square,
  Globe,
  Zap,
  MessageSquare
} from "lucide-react";

const PORTUGUESE_REGIONS = [
  "Lisboa",
  "Porto",
  "Cascais",
  "Sintra",
  "Oeiras",
  "Almada",
  "Amadora",
  "Setúbal",
  "Braga",
  "Coimbra",
  "Funchal",
  "Faro",
  "Albufeira",
  "Lagos",
  "Portimão",
  "Évora",
  "Aveiro",
  "Leiria",
  "Viseu",
  "Guimarães"
];

const PROPERTY_TYPES = [
  "Apartamento",
  "Moradia",
  "Vivenda",
  "Terreno",
  "Loja",
  "Escritório",
  "Armazém",
  "Quinta",
  "Estúdio",
  "Duplex"
];

const SEARCH_SOURCES = [
  { id: "casafari", name: "Casafari", description: "Portal profissional" },
  { id: "idealista", name: "Idealista", description: "Maior portal ibérico" },
  { id: "olx", name: "OLX", description: "Particulares e agências" }
];

interface SearchConfig {
  searchEnabled: boolean;
  searchSources: string[];
  searchLocations: string[];
  searchPropertyTypes: string[];
  searchTransactionType: string;
  searchPriceMin: number;
  searchPriceMax: number;
  searchBedrooms?: number;
  searchAreaMin?: number;
  searchAreaMax?: number;
  searchSchedule: string;
  autoClassifyLeads: boolean;
  autoContactNewLeads: boolean;
}

interface AutomationSettings extends SearchConfig {
  id?: string;
  customerId: string;
  enabled: boolean;
  autoMessageNewLead: boolean;
  autoFollowup3Days: boolean;
  autoFollowup7Days: boolean;
  preferredChannel: string;
  quietHoursStart: number;
  quietHoursEnd: number;
}

export function SearchConfiguration() {
  const { customer } = useAuth();
  const { toast } = useToast();
  const isPro = customer?.plan === "pro";
  
  const [config, setConfig] = useState<SearchConfig>({
    searchEnabled: false,
    searchSources: ["casafari", "idealista", "olx"],
    searchLocations: ["Lisboa"],
    searchPropertyTypes: ["Apartamento"],
    searchTransactionType: "sale",
    searchPriceMin: 100000,
    searchPriceMax: 500000,
    searchBedrooms: undefined,
    searchAreaMin: undefined,
    searchAreaMax: undefined,
    searchSchedule: "daily",
    autoClassifyLeads: true,
    autoContactNewLeads: false
  });
  
  const [newLocation, setNewLocation] = useState("");
  const [newPropertyType, setNewPropertyType] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const { data: savedSettings, isLoading } = useQuery<AutomationSettings>({
    queryKey: [`/api/automation-settings/${customer?.id}`],
    enabled: !!customer?.id,
  });

  useEffect(() => {
    if (savedSettings) {
      setConfig({
        searchEnabled: savedSettings.searchEnabled || false,
        searchSources: savedSettings.searchSources || ["casafari", "idealista", "olx"],
        searchLocations: savedSettings.searchLocations || ["Lisboa"],
        searchPropertyTypes: savedSettings.searchPropertyTypes || ["Apartamento"],
        searchTransactionType: savedSettings.searchTransactionType || "sale",
        searchPriceMin: savedSettings.searchPriceMin || 100000,
        searchPriceMax: savedSettings.searchPriceMax || 500000,
        searchBedrooms: savedSettings.searchBedrooms,
        searchAreaMin: savedSettings.searchAreaMin,
        searchAreaMax: savedSettings.searchAreaMax,
        searchSchedule: savedSettings.searchSchedule || "daily",
        autoClassifyLeads: savedSettings.autoClassifyLeads !== false,
        autoContactNewLeads: savedSettings.autoContactNewLeads || false
      });
    }
  }, [savedSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: SearchConfig) => {
      const response = await apiRequest("POST", "/api/automation-settings", {
        customerId: customer?.id,
        ...data
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/automation-settings/${customer?.id}`] });
      toast({
        title: "Configuração guardada",
        description: "As suas preferências de pesquisa foram atualizadas."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao guardar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  const addLocation = (location: string) => {
    if (location && !config.searchLocations.includes(location)) {
      setConfig(prev => ({
        ...prev,
        searchLocations: [...prev.searchLocations, location]
      }));
    }
    setNewLocation("");
  };

  const removeLocation = (location: string) => {
    setConfig(prev => ({
      ...prev,
      searchLocations: prev.searchLocations.filter(l => l !== location)
    }));
  };

  const addPropertyType = (type: string) => {
    if (type && !config.searchPropertyTypes.includes(type)) {
      setConfig(prev => ({
        ...prev,
        searchPropertyTypes: [...prev.searchPropertyTypes, type]
      }));
    }
    setNewPropertyType("");
  };

  const removePropertyType = (type: string) => {
    setConfig(prev => ({
      ...prev,
      searchPropertyTypes: prev.searchPropertyTypes.filter(t => t !== type)
    }));
  };

  const toggleSource = (sourceId: string) => {
    setConfig(prev => ({
      ...prev,
      searchSources: prev.searchSources.includes(sourceId)
        ? prev.searchSources.filter(s => s !== sourceId)
        : [...prev.searchSources, sourceId]
    }));
  };

  const runTestSearch = async () => {
    setIsTesting(true);
    try {
      const response = await apiRequest("POST", "/api/automation/run-search", {
        locations: config.searchLocations,
        propertyTypes: config.searchPropertyTypes,
        priceMin: config.searchPriceMin,
        priceMax: config.searchPriceMax,
        sources: config.searchSources
      });
      const result = await response.json();
      
      toast({
        title: "Pesquisa concluída",
        description: `Encontrados ${result.totalFound || 0} leads de ${result.results?.length || 0} fontes.`
      });
    } catch (error: any) {
      toast({
        title: "Erro na pesquisa",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Configuração de Captação de Leads</CardTitle>
          </div>
          <CardDescription>
            Configure os filtros para captação automática de leads imobiliários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Captação Automática</Label>
              <p className="text-sm text-muted-foreground">
                Pesquisar leads automaticamente com base nas suas configurações
              </p>
            </div>
            <Switch
              checked={config.searchEnabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, searchEnabled: checked }))}
              data-testid="switch-search-enabled"
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Fontes de Pesquisa</Label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {SEARCH_SOURCES.map((source) => (
                <div
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    config.searchSources.includes(source.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid={`source-${source.id}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    config.searchSources.includes(source.id) ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}>
                    {config.searchSources.includes(source.id) && (
                      <CheckCircle className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Regiões</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.searchLocations.map((location) => (
                <Badge
                  key={location}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeLocation(location)}
                  data-testid={`location-${location}`}
                >
                  {location} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={newLocation} onValueChange={addLocation}>
                <SelectTrigger className="flex-1" data-testid="select-location">
                  <SelectValue placeholder="Adicionar região..." />
                </SelectTrigger>
                <SelectContent>
                  {PORTUGUESE_REGIONS.filter(r => !config.searchLocations.includes(r)).map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Tipologia de Imóveis</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.searchPropertyTypes.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removePropertyType(type)}
                  data-testid={`property-type-${type}`}
                >
                  {type} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={newPropertyType} onValueChange={addPropertyType}>
                <SelectTrigger className="flex-1" data-testid="select-property-type">
                  <SelectValue placeholder="Adicionar tipologia..." />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.filter(t => !config.searchPropertyTypes.includes(t)).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Tipo de Transação</Label>
            </div>
            <Select 
              value={config.searchTransactionType} 
              onValueChange={(value) => setConfig(prev => ({ ...prev, searchTransactionType: value }))}
            >
              <SelectTrigger data-testid="select-transaction-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Venda</SelectItem>
                <SelectItem value="rent">Arrendamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Intervalo de Preços</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priceMin">Preço Mínimo (€)</Label>
                <Input
                  id="priceMin"
                  type="number"
                  value={config.searchPriceMin}
                  onChange={(e) => setConfig(prev => ({ ...prev, searchPriceMin: parseInt(e.target.value) || 0 }))}
                  placeholder="100000"
                  data-testid="input-price-min"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMax">Preço Máximo (€)</Label>
                <Input
                  id="priceMax"
                  type="number"
                  value={config.searchPriceMax}
                  onChange={(e) => setConfig(prev => ({ ...prev, searchPriceMax: parseInt(e.target.value) || 0 }))}
                  placeholder="500000"
                  data-testid="input-price-max"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Quartos e Área (Opcional)</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Nº Quartos</Label>
                <Select 
                  value={config.searchBedrooms?.toString() || "any"} 
                  onValueChange={(value) => setConfig(prev => ({ 
                    ...prev, 
                    searchBedrooms: value === "any" ? undefined : parseInt(value) 
                  }))}
                >
                  <SelectTrigger data-testid="select-bedrooms">
                    <SelectValue placeholder="Qualquer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="0">T0</SelectItem>
                    <SelectItem value="1">T1</SelectItem>
                    <SelectItem value="2">T2</SelectItem>
                    <SelectItem value="3">T3</SelectItem>
                    <SelectItem value="4">T4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaMin">Área Mín. (m²)</Label>
                <Input
                  id="areaMin"
                  type="number"
                  value={config.searchAreaMin || ""}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    searchAreaMin: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="50"
                  data-testid="input-area-min"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaMax">Área Máx. (m²)</Label>
                <Input
                  id="areaMax"
                  type="number"
                  value={config.searchAreaMax || ""}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    searchAreaMax: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="200"
                  data-testid="input-area-max"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Frequência de Pesquisa</Label>
            </div>
            <Select 
              value={config.searchSchedule} 
              onValueChange={(value) => setConfig(prev => ({ ...prev, searchSchedule: value }))}
            >
              <SelectTrigger data-testid="select-schedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">A cada hora</SelectItem>
                <SelectItem value="twice_daily">Duas vezes por dia</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Automação</Label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Classificar Leads com IA</Label>
                <p className="text-xs text-muted-foreground">
                  Analisar e pontuar leads automaticamente
                </p>
              </div>
              <Switch
                checked={config.autoClassifyLeads}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoClassifyLeads: checked }))}
                data-testid="switch-auto-classify"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>Contactar Leads Automaticamente</Label>
                  {!isPro && (
                    <Badge variant="secondary" className="text-xs">Pro</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enviar mensagem inicial via WhatsApp/Email
                </p>
              </div>
              <Switch
                checked={config.autoContactNewLeads}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoContactNewLeads: checked }))}
                disabled={!isPro}
                data-testid="switch-auto-contact"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={runTestSearch}
          disabled={isTesting || config.searchSources.length === 0}
          data-testid="button-test-search"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              A pesquisar...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Testar Pesquisa
            </>
          )}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          data-testid="button-save-config"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              A guardar...
            </>
          ) : (
            "Guardar Configuração"
          )}
        </Button>
      </div>
    </div>
  );
}
