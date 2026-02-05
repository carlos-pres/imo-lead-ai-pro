import { useState, useMemo, useCallback, memo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Check, 
  Zap, 
  Building2, 
  ArrowLeft,
  Sparkles,
  Shield,
  Clock,
  MessageSquare,
  Crown,
} from "lucide-react";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

interface ProductsResponse {
  data: Product[];
}

const featuresByPlan: Record<string, string[]> = {
  "ImoLead Basic": [
    "Mais de 100 leads/mês",
    "Pesquisa automática em sites imobiliários",
    "Gestão de agenda integrada (Google Agenda)",
    "Relatório semanal dos leads",
    "Aliado digital estratégico",
    "Pesquisa Casafari, Idealista, OLX",
    "Suporte semanal",
    "Estudo de mercado analítico (1x por semana)",
  ],
  "ImoLead Pro": [
    "Tudo do plano Basic",
    "IA avançada com análise detalhada",
    "Leads ilimitados",
    "Relatórios 3x por semana",
    "Cards personalizados digitais",
    "Relatório mensal da evolução do agente",
    "Agenda com marcação de visitas",
    "Automação de mensagens WhatsApp/Email",
    "Integração Casafari & Idealista premium",
    "Suporte prioritário",
  ],
  "ImoLead Custom": [
    "Tudo do plano Pro",
    "Reuniões estratégicas individuais (com equipa)",
    "3 vídeos imobiliários profissionais/mês",
    "Acesso exclusivo com estudo de mercado",
    "Automação: Instagram, WhatsApp, TikTok",
    "Relatório diário de acompanhamento leads",
    "Material promocional digital",
    "Gestor de conta dedicado",
    "Suporte 24/7",
  ],
};

const planIcons: Record<string, typeof Zap> = {
  "ImoLead Basic": Zap,
  "ImoLead Pro": Building2,
  "ImoLead Custom": Crown,
};

const planBadges: Record<string, string> = {
  "ImoLead Basic": "7 dias grátis",
  "ImoLead Pro": "Mais Popular",
  "ImoLead Custom": "Enterprise",
};

const planNotes: Record<string, string> = {
  "ImoLead Basic": "Nota: Marcação de visitas pelo assistente disponível apenas nos planos Pro e Custom",
};

const PRICE_OVERRIDES: Record<string, { monthly: number; yearly: number }> = {
  "ImoLead Basic": { monthly: 6700, yearly: 6700 * 10 },
  "ImoLead Pro": { monthly: 16700, yearly: 16700 * 10 },
  "ImoLead Custom": { monthly: 39700, yearly: 39700 * 10 },
};

export default function Store() {
  const [isYearly, setIsYearly] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const { toast } = useToast();

  const { data: productsResponse, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["/api/stripe/products-with-prices"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  const products = productsResponse?.data;

  const checkoutMutation = useMutation({
    mutationFn: async (data: { priceId: string; customerEmail: string; customerName: string }) => {
      const response = await apiRequest("POST", "/api/stripe/checkout", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro no checkout",
        description: error.message || "Não foi possível iniciar o pagamento",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = useCallback((product: Product, price: Price) => {
    setSelectedProduct(product);
    setSelectedPrice(price);
    setCheckoutDialogOpen(true);
  }, []);

  const handleCheckout = useCallback(() => {
    if (!selectedPrice || !customerEmail) {
      toast({
        title: "Dados incompletos",
        description: "Por favor preencha o seu email",
        variant: "destructive",
      });
      return;
    }

    checkoutMutation.mutate({
      priceId: selectedPrice.id,
      customerEmail,
      customerName,
    });
  }, [selectedPrice, customerEmail, customerName, checkoutMutation, toast]);

  const formatPrice = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }, []);

  const getPrice = useCallback((product: Product, yearly: boolean) => {
    const interval = yearly ? "year" : "month";
    return product.prices.find(p => p.recurring?.interval === interval);
  }, []);

  const sortedProducts = useMemo(() => {
    if (!products) return undefined;
    return [...products].sort((a, b) => {
      const priceA = getPrice(a, false)?.unit_amount || 0;
      const priceB = getPrice(b, false)?.unit_amount || 0;
      return priceA - priceB;
    });
  }, [products, getPrice]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-home">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">ImoLead AI Pro</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Escolha o seu plano
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Preços simples e transparentes
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Escolha o plano ideal para o seu negócio imobiliário. 
            Todos os planos incluem classificação AI e integração WhatsApp.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="billing-toggle" className={!isYearly ? "font-semibold" : "text-muted-foreground"}>
              Mensal
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
              data-testid="switch-billing"
            />
            <Label htmlFor="billing-toggle" className={isYearly ? "font-semibold" : "text-muted-foreground"}>
              Anual
            </Label>
            {isYearly && (
              <Badge variant="default" className="ml-2 bg-green-600">
                Poupe 17%
              </Badge>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[1, 2].map((i) => (
              <Card key={i} className="relative">
                <CardHeader>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-24 mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {sortedProducts?.map((product, index) => {
              const price = getPrice(product, isYearly);
              const monthlyPrice = getPrice(product, false);
              const isPro = product.name.includes("Pro");
              const isCustom = product.name.includes("Custom");
              const isHighlighted = isPro;
              const Icon = planIcons[product.name] || Zap;
              const features = featuresByPlan[product.name] || [];
              const badge = planBadges[product.name];
              const note = planNotes[product.name];

              return (
                <Card 
                  key={product.id} 
                  className={`relative ${isHighlighted ? "border-primary shadow-lg scale-[1.02]" : ""} ${isCustom ? "border-purple-500/50" : ""}`}
                  data-testid={`card-product-${product.id}`}
                >
                  {badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className={isPro ? "bg-primary text-primary-foreground" : isCustom ? "bg-purple-600 text-white" : "bg-green-600 text-white"}>
                        {badge}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${isPro ? "bg-primary/10" : isCustom ? "bg-purple-500/10" : "bg-muted"}`}>
                        <Icon className={`h-6 w-6 ${isPro ? "text-primary" : isCustom ? "text-purple-500" : "text-muted-foreground"}`} />
                      </div>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      {(() => {
                        const override = PRICE_OVERRIDES[product.name];
                        const displayAmount = override 
                          ? (isYearly ? override.yearly : override.monthly)
                          : (price?.unit_amount || 0);
                        const currency = price?.currency || "eur";
                        
                        if (override || price) {
                          return (
                            <>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold">
                                  {formatPrice(displayAmount, currency)}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                  /{isYearly ? "ano" : "mês"}
                                </span>
                              </div>
                              {isYearly && override && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  equivalente a {formatPrice(override.monthly, currency)}/mês
                                </p>
                              )}
                            </>
                          );
                        } else if (isCustom) {
                          return (
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-purple-500">Sob consulta</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <ul className="space-y-2">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {note && (
                      <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                        {note}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant={isPro ? "default" : isCustom ? "secondary" : "outline"}
                      size="lg"
                      onClick={() => price && handleSelectPlan(product, price)}
                      disabled={!price && !isCustom}
                      data-testid={`button-select-${product.id}`}
                    >
                      {isCustom ? "Contactar equipa" : isPro ? "Começar agora" : "Escolher Basic"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8">Incluído em todos os planos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-4">
              <div className="p-3 rounded-full bg-primary/10 mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Classificação AI</h3>
              <p className="text-sm text-muted-foreground text-center">
                Análise automática de leads com DeepSeek
              </p>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="p-3 rounded-full bg-primary/10 mb-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">WhatsApp</h3>
              <p className="text-sm text-muted-foreground text-center">
                Integração com WhatsApp Business
              </p>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="p-3 rounded-full bg-primary/10 mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Seguro</h3>
              <p className="text-sm text-muted-foreground text-center">
                Dados encriptados e protegidos
              </p>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="p-3 rounded-full bg-primary/10 mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Actualizações</h3>
              <p className="text-sm text-muted-foreground text-center">
                Novas funcionalidades regulares
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-card border rounded-lg p-8 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Plano Enterprise</h2>
          <p className="text-muted-foreground mb-6">
            Precisa de uma solução personalizada para a sua imobiliária? 
            Contacte-nos para um plano à medida com funcionalidades exclusivas.
          </p>
          <Button variant="outline" size="lg" data-testid="button-contact-enterprise">
            Falar com vendas
          </Button>
        </div>
      </main>

      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar subscrição</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - {selectedPrice && formatPrice(selectedPrice.unit_amount, selectedPrice.currency)}
              /{selectedPrice?.recurring?.interval === "year" ? "ano" : "mês"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="O seu nome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                data-testid="input-checkout-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                data-testid="input-checkout-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCheckoutDialogOpen(false)}
              data-testid="button-cancel-checkout"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending || !customerEmail}
              data-testid="button-confirm-checkout"
            >
              {checkoutMutation.isPending ? "A processar..." : "Continuar para pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
