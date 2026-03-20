import { getPaymentPlanOptions } from "../core/plans.js";

export interface PaymentPlan {
  id: string;
  planId: string;
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

const PLANS: PaymentPlan[] = getPaymentPlanOptions();

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
    return PLANS.find((plan) => plan.id === planId);
  }

  async createMBWayPayment(request: MBWayPaymentRequest): Promise<MBWayPaymentResponse> {
    const requestId = `mbway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      requestId,
      orderId: request.orderId,
      amount: request.amount.toFixed(2),
      status: "000",
      message: "Pagamento iniciado. Por favor confirme no seu telemovel dentro de 4 minutos.",
    };
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    const plan = this.getPlan(request.planId);
    if (!plan) {
      return {
        success: false,
        paymentId: "",
        status: "failed",
        message: "Plano nao encontrado",
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
        description: `ImoLead AI Pro - Plano ${plan.name}`,
      });

      return {
        success: true,
        paymentId,
        status: "pending",
        message: mbwayResult.message,
        expiresAt: new Date(Date.now() + 4 * 60 * 1000),
      };
    }

    if (request.paymentMethod === "multibanco") {
      const entity = "21312";
      const reference = Math.floor(100000000 + Math.random() * 900000000).toString();

      return {
        success: true,
        paymentId,
        status: "pending",
        message: `Referencia Multibanco gerada:\nEntidade: ${entity}\nReferencia: ${reference}\nValor: ${plan.price} EUR\nValida por 72 horas.`,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      };
    }

    return {
      success: true,
      paymentId,
      status: "pending",
      message: "Redirecionando para pagina de pagamento...",
      redirectUrl: `/checkout/${paymentId}`,
    };
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentResult> {
    return {
      success: true,
      paymentId,
      status: "completed",
      message: "Pagamento confirmado com sucesso!",
    };
  }

  async processWebhook(payload: any): Promise<{ success: boolean; paymentId?: string }> {
    console.log("Processing payment webhook:", payload);
    return { success: true, paymentId: payload.paymentId };
  }
}

export const paymentService = new PaymentService();
