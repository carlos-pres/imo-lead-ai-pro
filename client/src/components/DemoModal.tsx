import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, BarChart3, Users, Zap, Calendar, MessageSquare, ChevronRight } from "lucide-react";

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTrial?: () => void;
}

export function DemoModal({ open, onOpenChange, onStartTrial }: DemoModalProps) {
  const [activeFeature, setActiveFeature] = useState("leads");

  const features = [
    {
      id: "leads",
      icon: Users,
      title: "Gestão de Leads",
      description: "Visualize e organize todos os seus leads num único lugar. Classificação automática por AI em leads quentes, mornos e frios.",
      benefits: [
        "Classificação automática por IA",
        "Filtros avançados por status e fonte",
        "Histórico completo de interações",
        "Score de qualidade para cada lead"
      ]
    },
    {
      id: "ai",
      icon: Zap,
      title: "Inteligência Artificial",
      description: "O nosso sistema de IA analisa cada lead e atribui uma pontuação de 0 a 100 baseada em múltiplos fatores.",
      benefits: [
        "Análise automática de propriedades",
        "Score de probabilidade de conversão",
        "Sugestões de abordagem personalizadas",
        "Aprendizagem contínua com os seus dados"
      ]
    },
    {
      id: "automation",
      icon: MessageSquare,
      title: "Automação WhatsApp",
      description: "Envie mensagens personalizadas automaticamente aos seus leads via WhatsApp Business API.",
      benefits: [
        "Templates de mensagens personalizáveis",
        "Envio automático após captação",
        "Sequências de follow-up programadas",
        "Integração com WhatsApp Business"
      ]
    },
    {
      id: "calendar",
      icon: Calendar,
      title: "Agenda Integrada",
      description: "Agende visitas e reuniões diretamente na plataforma com sincronização automática.",
      benefits: [
        "Calendário visual interativo",
        "Lembretes automáticos por email/SMS",
        "Sincronização com Google Calendar",
        "Gestão de disponibilidade"
      ]
    },
    {
      id: "analytics",
      icon: BarChart3,
      title: "Relatórios e Analytics",
      description: "Acompanhe o desempenho das suas campanhas com relatórios detalhados e métricas em tempo real.",
      benefits: [
        "Dashboard em tempo real",
        "Relatórios diários automáticos",
        "Métricas de conversão",
        "Análise de ROI por fonte"
      ]
    }
  ];

  const currentFeature = features.find(f => f.id === activeFeature) || features[0];
  const CurrentIcon = currentFeature.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-5 w-5 text-primary" />
            <Badge variant="secondary">Demonstração</Badge>
          </div>
          <DialogTitle className="text-2xl">Conheça o ImoLead AI Pro</DialogTitle>
          <DialogDescription>
            Descubra como a nossa plataforma pode transformar a forma como gere os seus leads imobiliários.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <Tabs value={activeFeature} onValueChange={setActiveFeature}>
            <TabsList className="grid grid-cols-5 w-full">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <TabsTrigger 
                    key={feature.id} 
                    value={feature.id}
                    className="flex flex-col items-center gap-1 py-2 px-1"
                    data-testid={`demo-tab-${feature.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs hidden sm:block">{feature.title.split(" ")[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {features.map((feature) => (
              <TabsContent key={feature.id} value={feature.id} className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <CurrentIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Principais Benefícios
                      </h4>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Experimente grátis por 7 dias</p>
                          <p className="text-sm text-muted-foreground">
                            Sem cartão de crédito necessário
                          </p>
                        </div>
                        <Badge variant="outline" className="text-primary border-primary">
                          Grátis
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex gap-3 mt-6 justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-demo-close"
            >
              Fechar
            </Button>
            <Button 
              onClick={() => {
                onOpenChange(false);
                onStartTrial?.();
              }}
              className="gap-2"
              data-testid="button-demo-start-trial"
            >
              Começar Período de Teste
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
