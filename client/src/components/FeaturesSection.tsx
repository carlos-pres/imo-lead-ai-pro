import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Brain, MessageSquare, Calendar, BarChart3, Settings } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Web Scraping Automático",
    description: "Prospeção diária automática em Idealista, OLX e Casafari com filtros personalizáveis por localização, tipo de imóvel e preço."
  },
  {
    icon: Brain,
    title: "Classificação com IA",
    description: "OpenAI GPT analisa cada lead e atribui pontuação de conversão baseada em urgência, qualidade e histórico do imóvel."
  },
  {
    icon: MessageSquare,
    title: "Mensagens Personalizadas",
    description: "Templates editáveis adaptados automaticamente ao perfil do lead - quente, morno ou frio - para máxima eficácia."
  },
  {
    icon: Calendar,
    title: "Agendamento Inteligente",
    description: "Sistema de calendário integrado com Google Calendar para marcação automática de reuniões e visitas."
  },
  {
    icon: BarChart3,
    title: "Relatórios Detalhados",
    description: "Dashboards em tempo real com métricas de performance, taxa de conversão e evolução semanal exportáveis em PDF."
  },
  {
    icon: Settings,
    title: "Configuração Flexível",
    description: "Painel de controlo completo para customizar filtros de pesquisa, templates de mensagem e horários de operação."
  }
];

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-20 md:py-24 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Tudo o que Precisa para Automatizar
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Uma plataforma completa que combina inteligência artificial, automação e análise de dados 
            para transformar a forma como gere leads imobiliários.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate active-elevate-2 transition-transform duration-200" data-testid={`card-feature-${index}`}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
