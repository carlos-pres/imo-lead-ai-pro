import { StatsCard } from "./StatsCard";
import { LeadsTable } from "./LeadsTable";
import { Users, Flame, MessageSquare, Calendar, Loader2, RefreshCw, Search, Globe, ExternalLink, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import type { Lead } from "@shared/schema";

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
    ownerType: "particular",
    qualification: "pendente_visita",
    sourceUrl: null,
    source: "Casafari",
    contact: "+351 912 345 678",
    email: "maria.silva@email.pt",
    aiScore: 92,
    aiReasoning: "Lead com alto potencial - interessada em propriedade premium em zona valorizada. Responde rapidamente a mensagens.",
    notes: "Pretende comprar para residência própria. Disponível para visitas aos fins de semana.",
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
    ownerType: "particular",
    qualification: "pendente_visita",
    sourceUrl: null,
    source: "Idealista",
    contact: "+351 923 456 789",
    email: "joao.ferreira@empresa.pt",
    aiScore: 88,
    aiReasoning: "Investidor experiente. Já comprou 2 propriedades no último ano. Alto poder de compra confirmado.",
    notes: "Quer propriedade para arrendamento. Financiamento pré-aprovado.",
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
    ownerType: "particular",
    qualification: "pendente_visita",
    sourceUrl: null,
    source: "OLX",
    contact: "+351 934 567 890",
    email: "ana.costa@gmail.com",
    aiScore: 65,
    aiReasoning: "Primeira compra de imóvel. Ainda a comparar opções no mercado.",
    notes: "Jovem profissional. Precisa de mais informações sobre financiamento.",
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
    ownerType: "particular",
    qualification: "pendente_visita",
    sourceUrl: null,
    source: "Casafari",
    contact: "+351 945 678 901",
    email: "pedro.santos@business.com",
    aiScore: 95,
    aiReasoning: "CEO de empresa tech. Budget confirmado acima de 1M. Pronto para fechar negócio.",
    notes: "Quer propriedade de luxo com vista mar. Visita agendada para sábado.",
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
    ownerType: "particular",
    qualification: "pendente_visita",
    sourceUrl: null,
    source: "Idealista",
    contact: "+351 956 789 012",
    email: "carla.r@design.pt",
    aiScore: 72,
    aiReasoning: "Designer de interiores. Interessada em espaços únicos. Ainda a analisar localização.",
    notes: "Gosta de conceito open space. Segunda visita realizada.",
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
    ownerType: "profissional",
    qualification: "pendente_visita",
    sourceUrl: null,
    source: "Casafari",
    contact: "+351 967 890 123",
    email: "rui.martins@wine.pt",
    aiScore: 45,
    aiReasoning: "Projeto a longo prazo. Precisa de vender propriedade atual primeiro.",
    notes: "Interessado em turismo rural. Timeline de 6-12 meses.",
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
    ownerType: "particular",
    qualification: "pendente_visita",
    sourceUrl: null,
    source: "Idealista",
    contact: "+351 978 901 234",
    email: "sofia.almeida@corp.pt",
    aiScore: 90,
    aiReasoning: "Executiva multinacional. Relocação confirmada para Lisboa. Urgência alta.",
    notes: "Precisa de fechar em 30 dias. Empresa paga relocation.",
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
    ownerType: "profissional",
    qualification: "pendente_visita",
    sourceUrl: null,
    source: "OLX",
    contact: "+351 989 012 345",
    email: "miguel.o@student.pt",
    aiScore: 35,
    aiReasoning: "Estudante universitário. Budget limitado. Pais a ajudar.",
    notes: "Primeira consulta. Precisa de estudar opções de crédito jovem.",
    optOut: false,
    customerId: null,
    lastContact: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
];

interface DashboardHomeProps {
  onNavigate?: (page: string) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { isAdminDemo } = useAuth();
  
  const { data: apiLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: !isAdminDemo, // Don't fetch when in demo mode
  });

  // Use demo leads when in admin demo mode
  const leads = isAdminDemo ? DEMO_LEADS : apiLeads;

  const { data: reportData } = useQuery({
    queryKey: ["/api/reports/daily"],
    enabled: !isAdminDemo,
  });

  const leadsQuente = leads.filter(l => l.status === "quente").length;
  const leadsMorno = leads.filter(l => l.status === "morno").length;
  const leadsFrio = leads.filter(l => l.status === "frio").length;

  // Count leads by source
  const leadsBySource = {
    casafari: leads.filter(l => l.source?.toLowerCase().includes('casafari')).length,
    idealista: leads.filter(l => l.source?.toLowerCase().includes('idealista')).length,
    olx: leads.filter(l => l.source?.toLowerCase().includes('olx')).length,
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const chartData = last7Days.map(date => {
    const dayLeads = leads.filter(lead => {
      if (!lead.createdAt) return false;
      const leadDate = new Date(lead.createdAt);
      return leadDate.toDateString() === date.toDateString();
    });
    return {
      name: date.toLocaleDateString('pt-PT', { weekday: 'short' }),
      leads: dayLeads.length
    };
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do desempenho
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Leads"
          value={leads.length}
          icon={Users}
          description="Todos os leads capturados"
          onClick={() => onNavigate?.("leads")}
        />
        <StatsCard
          title="Leads Quentes"
          value={leadsQuente}
          icon={Flame}
          description="Alto potencial de conversão"
          onClick={() => onNavigate?.("leads")}
        />
        <StatsCard
          title="Leads Mornos"
          value={leadsMorno}
          icon={MessageSquare}
          description="Médio potencial"
          onClick={() => onNavigate?.("leads")}
        />
        <StatsCard
          title="Leads Frios"
          value={leadsFrio}
          icon={Calendar}
          description="Baixo potencial"
          onClick={() => onNavigate?.("leads")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-search-frequency">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
            <div>
              <CardTitle className="text-base font-medium">Pesquisa Automática</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Configuração estimada</p>
            </div>
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Frequência de pesquisa</span>
                <Badge variant="secondary" className="font-mono" data-testid="badge-frequency">A cada 6 horas</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última pesquisa</span>
                <span className="text-sm font-medium">Hoje, 09:30</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Próxima pesquisa</span>
                <span className="text-sm font-medium">Hoje, 15:30</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant="default" className="bg-green-600" data-testid="badge-status">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-leads-by-source">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
            <CardTitle className="text-base font-medium">Leads por Origem</CardTitle>
            <Globe className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/leads?source=Casafari">
                <div 
                  className="flex items-center justify-between p-2 rounded-lg hover-elevate cursor-pointer"
                  data-testid="link-source-casafari"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Casafari</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{leadsBySource.casafari}</span>
                    <span className="text-xs text-muted-foreground">leads</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/leads?source=Idealista">
                <div 
                  className="flex items-center justify-between p-2 rounded-lg hover-elevate cursor-pointer"
                  data-testid="link-source-idealista"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Idealista</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{leadsBySource.idealista}</span>
                    <span className="text-xs text-muted-foreground">leads</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/leads?source=OLX">
                <div 
                  className="flex items-center justify-between p-2 rounded-lg hover-elevate cursor-pointer"
                  data-testid="link-source-olx"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">OLX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{leadsBySource.olx}</span>
                    <span className="text-xs text-muted-foreground">leads</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendência de Leads - Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <LeadsTable />
    </div>
  );
}
