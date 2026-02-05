import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useState } from "react";

const monthlyPlans = [
  {
    id: "basic",
    name: "Basic",
    price: "67€",
    period: "mês",
    description: "Ideal para agentes independentes",
    badge: "7 dias grátis",
    features: [
      "100+ leads por mês",
      "Pesquisa em sites imobiliários",
      "Gestão de agenda integrada (Google Agenda)",
      "Relatório semanal dos leads",
      "Aliado digital estratégico",
      "Suporte semanal",
      "Estudo de mercado analítico (1x por semana)"
    ],
    note: "Marcação de visitas pelo assistente IA não disponível",
    cta: "Começar Agora",
    highlighted: false
  },
  {
    id: "pro",
    name: "Pro",
    price: "167€",
    period: "mês",
    description: "Para profissionais de alto volume",
    badge: "Mais Popular",
    features: [
      "Tudo do plano Basic",
      "IA avançada",
      "Leads ilimitados",
      "Relatórios 3x por semana",
      "Cards personalizados digitais",
      "Relatório mensal da evolução do agente",
      "Agenda com marcação de visitas pelo assistente IA"
    ],
    cta: "Escolher Pro",
    highlighted: true
  },
  {
    id: "custom",
    name: "Custom",
    price: "A definir",
    period: "",
    description: "Soluções enterprise à medida",
    badge: "Enterprise",
    features: [
      "Tudo do plano Pro",
      "Reuniões estratégicas individuais",
      "3 vídeos imobiliários profissionais/mês",
      "Acesso exclusivo com estudo de mercado",
      "Automação integrada: Instagram, WhatsApp, TikTok",
      "Relatório diário de acompanhamento leads",
      "IA avançada",
      "Material promocional digital"
    ],
    cta: "Contactar Vendas",
    highlighted: false
  }
];

const yearlyPlans = [
  {
    id: "basic-yearly",
    name: "Basic",
    price: "670€",
    period: "ano",
    originalPrice: "804€",
    savings: "Poupe 134€",
    description: "Ideal para agentes independentes",
    badge: "2 meses grátis",
    features: [
      "100+ leads por mês",
      "Pesquisa em sites imobiliários",
      "Gestão de agenda integrada (Google Agenda)",
      "Relatório semanal dos leads",
      "Aliado digital estratégico",
      "Suporte semanal",
      "Estudo de mercado analítico (1x por semana)"
    ],
    note: "Marcação de visitas pelo assistente IA não disponível",
    cta: "Começar Agora",
    highlighted: false
  },
  {
    id: "pro-yearly",
    name: "Pro",
    price: "1.670€",
    period: "ano",
    originalPrice: "2.004€",
    savings: "Poupe 334€",
    description: "Para profissionais de alto volume",
    badge: "Mais Popular",
    features: [
      "Tudo do plano Basic",
      "IA avançada",
      "Leads ilimitados",
      "Relatórios 3x por semana",
      "Cards personalizados digitais",
      "Relatório mensal da evolução do agente",
      "Agenda com marcação de visitas pelo assistente IA"
    ],
    cta: "Escolher Pro",
    highlighted: true
  },
  {
    id: "custom",
    name: "Custom",
    price: "A definir",
    period: "",
    description: "Soluções enterprise à medida",
    badge: "Enterprise",
    features: [
      "Tudo do plano Pro",
      "Reuniões estratégicas individuais",
      "3 vídeos imobiliários profissionais/mês",
      "Acesso exclusivo com estudo de mercado",
      "Automação integrada: Instagram, WhatsApp, TikTok",
      "Relatório diário de acompanhamento leads",
      "IA avançada",
      "Material promocional digital"
    ],
    cta: "Contactar Vendas",
    highlighted: false
  }
];

interface PricingSectionProps {
  onPlanClick?: (planId: string) => void;
}

export function PricingSection({ onPlanClick }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  const plans = isYearly ? yearlyPlans : monthlyPlans;

  return (
    <section id="precos" className="py-20 md:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Planos Transparentes e Flexíveis
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano ideal para o seu volume de negócio. Plano Basic inclui 7 dias de teste grátis.
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Mensal
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-primary' : 'bg-muted'
              }`}
              data-testid="toggle-billing-period"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2">
                2 meses grátis
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`hover-elevate active-elevate-2 transition-all duration-200 relative ${
                plan.highlighted ? 'border-primary shadow-lg md:scale-105' : ''
              }`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.badge && (
                <Badge 
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  variant={plan.highlighted ? "default" : "secondary"}
                >
                  {plan.badge}
                </Badge>
              )}
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {'originalPrice' in plan && (plan as typeof yearlyPlans[0]).originalPrice && (
                    <span className="text-lg text-muted-foreground line-through mr-2">{(plan as typeof yearlyPlans[0]).originalPrice}</span>
                  )}
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">/{plan.period}</span>}
                </div>
                {'savings' in plan && (plan as typeof yearlyPlans[0]).savings && (
                  <Badge variant="secondary" className="mt-2">{(plan as typeof yearlyPlans[0]).savings}</Badge>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {'note' in plan && plan.note && (
                  <p className="mt-4 text-xs text-muted-foreground italic border-t pt-3">
                    Nota: {plan.note}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => onPlanClick?.(plan.id)}
                  data-testid={`button-plan-${plan.id}`}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
