import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, BarChart3, Search, Bell, CheckCircle2, Users, TrendingUp, Clock } from "lucide-react";

type EmptyStateType = "agenda" | "relatorios" | "noLeads";

interface EmptyStateConfig {
  icon: typeof Calendar;
  title: string;
  description: string;
  preview?: string;
  launchDate?: string;
  cta: string;
  ctaAction?: () => void;
  features?: string[];
  gradient: string;
}

const configs: Record<EmptyStateType, EmptyStateConfig> = {
  agenda: {
    icon: Calendar,
    title: "Agendamento Inteligente",
    description: "Sincronize com Google Calendar e agende visitas automaticamente. Receba lembretes e nunca perca uma oportunidade.",
    launchDate: "Janeiro 2025",
    cta: "Notificar-me quando estiver pronto",
    features: [
      "Sincronização Google Calendar",
      "Lembretes automáticos por SMS/Email",
      "Reagendamento inteligente com IA",
      "Disponibilidade partilhada com clientes"
    ],
    gradient: "from-blue-500/10 to-cyan-500/10"
  },
  relatorios: {
    icon: BarChart3,
    title: "Relatórios Detalhados",
    description: "Dashboards com métricas de conversão, análise preditiva e insights sobre o seu desempenho comercial.",
    launchDate: "Fevereiro 2025",
    cta: "Notificar-me quando estiver pronto",
    features: [
      "Taxa de conversão por fonte",
      "ROI por campanha",
      "Análise preditiva de vendas",
      "Relatórios automáticos semanais"
    ],
    gradient: "from-purple-500/10 to-pink-500/10"
  },
  noLeads: {
    icon: Search,
    title: "Nenhum lead encontrado ainda",
    description: "Comece por fazer uma pesquisa no Casafari para captar leads automaticamente com classificação por IA.",
    cta: "Fazer Primeira Pesquisa",
    gradient: "from-amber-500/10 to-orange-500/10"
  }
};

interface EmptyStateProps {
  type: EmptyStateType;
  onCtaClick?: () => void;
}

export function EmptyState({ type, onCtaClick }: EmptyStateProps) {
  const config = configs[type];
  const Icon = config.icon;

  const handleNotify = () => {
    const notified = localStorage.getItem(`imolead_notify_${type}`);
    if (!notified) {
      localStorage.setItem(`imolead_notify_${type}`, "true");
    }
    if (onCtaClick) onCtaClick();
  };

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${config.gradient}`} data-testid={`empty-state-${type}`}>
      <CardContent className="py-12 px-6 sm:px-12">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="relative">
            <div className="h-20 w-20 mx-auto rounded-2xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Icon className="h-10 w-10 text-primary" />
            </div>
            {config.launchDate && (
              <Badge 
                className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary/90 text-primary-foreground"
              >
                Em Breve
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold">{config.title}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {config.description}
            </p>
          </div>

          {config.features && (
            <div className="grid gap-3 sm:grid-cols-2 text-left max-w-lg mx-auto">
              {config.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}

          {config.launchDate && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Lançamento previsto: <strong>{config.launchDate}</strong></span>
            </div>
          )}

          <Button 
            onClick={handleNotify}
            className="gap-2"
            data-testid={`button-${type}-cta`}
          >
            {config.launchDate ? <Bell className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            {config.cta}
          </Button>

          {type === "noLeads" && (
            <div className="pt-4 border-t border-border/50 mt-6">
              <p className="text-xs text-muted-foreground mb-3">Ou comece com leads de exemplo</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  2 leads demo disponíveis
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Classificados por IA
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
