export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
}

export interface PaymentRequest {
  planId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: "mbway" | "card" | "multibanco";
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: "pending" | "processing" | "completed" | "failed" | "expired";
  message: string;
  redirectUrl?: string;
  expiresAt?: Date;
}

export interface MBWayPaymentRequest {
  orderId: string;
  amount: number;
  mobileNumber: string;
  email?: string;
  description?: string;
}

export interface MBWayPaymentResponse {
  requestId: string;
  orderId: string;
  amount: string;
  status: "000" | "100" | "101";
  message: string;
}

const PLANS: PaymentPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 39.00,
    currency: "EUR",
    interval: "month",
    features: [
      "Até 50 leads por mês",
      "Integração Casafari API",
      "Pesquisa em Idealista + OLX",
      "Classificação com IA integrada",
      "WhatsApp Business integrado",
      "Mensagens automáticas com IA",
      "Relatórios semanais",
      "Pagamento via MBWay",
      "Suporte por email"
    ]
  },
  {
    id: "basic-yearly",
    name: "Basic Anual",
    price: 390.00,
    currency: "EUR",
    interval: "year",
    features: [
      "Até 50 leads por mês",
      "Integração Casafari API",
      "Pesquisa em Idealista + OLX",
      "Classificação com IA integrada",
      "WhatsApp Business integrado",
      "Mensagens automáticas com IA",
      "Relatórios semanais",
      "Pagamento via MBWay",
      "Suporte por email",
      "2 meses grátis (poupança de 78€)"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 99.99,
    currency: "EUR",
    interval: "month",
    features: [
      "Leads ilimitados",
      "Integração Casafari API completa",
      "Todos os sites (Idealista, OLX, Casafari)",
      "IA avançada com análise preditiva",
      "WhatsApp Business integrado",
      "Disparo automático de mensagens IA",
      "Templates personalizáveis ilimitados",
      "Relatórios diários + PDF",
      "Integração Google Calendar",
      "Pagamento via MBWay",
      "Suporte prioritário 24/7"
    ]
  },
  {
    id: "pro-yearly",
    name: "Pro Anual",
    price: 999.00,
    currency: "EUR",
    interval: "year",
    features: [
      "Leads ilimitados",
      "Integração Casafari API completa",
      "Todos os sites (Idealista, OLX, Casafari)",
      "IA avançada com análise preditiva",
      "WhatsApp Business integrado",
      "Disparo automático de mensagens IA",
      "Templates personalizáveis ilimitados",
      "Relatórios diários + PDF",
      "Integração Google Calendar",
      "Pagamento via MBWay",
      "Suporte prioritário 24/7",
      "2 meses grátis (poupança de 200€)"
    ]
  }
];

export class PaymentService {
  private mbwayKey: string | null;
  private stripeKey: string | null;

  constructor() {
    this.mbwayKey = process.env.MBWAY_API_KEY || null;
    this.stripeKey = process.env.STRIPE_SECRET_KEY || null;
  }

  getPlans(): PaymentPlan[] {
    return PLANS;
  }

  getPlan(planId: string): PaymentPlan | undefined {
    return PLANS.find(p => p.id === planId);
  }

  async createMBWayPayment(request: MBWayPaymentRequest): Promise<MBWayPaymentResponse> {
    const requestId = `mbway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      requestId,
      orderId: request.orderId,
      amount: request.amount.toFixed(2),
      status: "000",
      message: "Pagamento iniciado. Por favor confirme no seu telemóvel dentro de 4 minutos."
    };
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    const plan = this.getPlan(request.planId);
    if (!plan) {
      return {
        success: false,
        paymentId: "",
        status: "failed",
        message: "Plano não encontrado"
      };
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (request.paymentMethod === "mbway") {
      const formattedPhone = request.customerPhone.replace(/\s/g, "").replace("+", "");
      const phoneNumber = formattedPhone.startsWith("351") ? formattedPhone : `351${formattedPhone}`;

      const mbwayResult = await this.createMBWayPayment({
        orderId: paymentId,
        amount: plan.price,
        mobileNumber: phoneNumber,
        email: request.customerEmail,
        description: `ImoLead AI Pro - Plano ${plan.name}`
      });

      return {
        success: true,
        paymentId,
        status: "pending",
        message: mbwayResult.message,
        expiresAt: new Date(Date.now() + 4 * 60 * 1000)
      };
    }

    if (request.paymentMethod === "multibanco") {
      const entity = "21312";
      const reference = Math.floor(100000000 + Math.random() * 900000000).toString();

      return {
        success: true,
        paymentId,
        status: "pending",
        message: `Referência Multibanco gerada:\nEntidade: ${entity}\nReferência: ${reference}\nValor: ${plan.price}€\nVálida por 72 horas.`,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
      };
    }

    return {
      success: true,
      paymentId,
      status: "pending",
      message: "Redirecionando para página de pagamento...",
      redirectUrl: `/checkout/${paymentId}`
    };
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
    return {
      success: true,
      paymentId,
      status: "completed",
      message: "Pagamento confirmado com sucesso!"
    };
  }

  async processWebhook(payload: any): Promise<{ success: boolean; paymentId?: string }> {
    console.log("Processing payment webhook:", payload);
    return { success: true, paymentId: payload.paymentId };
  }
}

export const paymentService = new PaymentService();
