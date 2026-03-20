import OpenAI from "openai";
import { getOpenAIHeavyModel } from "./aiModelConfig.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "first_contact" | "follow_up" | "scheduling" | "offer" | "closing";
  content: string;
  variables: string[];
  isActive: boolean;
}

export interface WhatsAppMessage {
  id: string;
  leadId: string;
  templateId?: string;
  to: string;
  content: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

export interface GenerateMessageParams {
  leadName: string;
  propertyDescription: string;
  propertyLocation: string;
  propertyPrice: string;
  leadStatus: "quente" | "morno" | "frio";
  messageType: "first_contact" | "follow_up" | "scheduling" | "offer" | "closing";
  agentName?: string;
}

const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "tpl-001",
    name: "Primeiro Contacto - ImÃ³vel EspecÃ­fico",
    category: "first_contact",
    content: `OlÃ¡ {{leadName}}! ðŸ‘‹

Vi o seu anÃºncio do imÃ³vel em {{propertyLocation}} e fiquei interessado/a.

{{propertyDescription}}

Seria possÃ­vel agendar uma visita? Estou disponÃ­vel esta semana.

Cumprimentos,
{{agentName}}
ImoLead AI Pro`,
    variables: ["leadName", "propertyLocation", "propertyDescription", "agentName"],
    isActive: true
  },
  {
    id: "tpl-002",
    name: "Follow-up - Sem Resposta",
    category: "follow_up",
    content: `Bom dia {{leadName}}! 

Enviei-lhe uma mensagem hÃ¡ alguns dias sobre o imÃ³vel em {{propertyLocation}}.

Gostaria de saber se ainda estÃ¡ disponÃ­vel e se podemos agendar uma visita.

Aguardo o seu contacto.

Cumprimentos,
{{agentName}}`,
    variables: ["leadName", "propertyLocation", "agentName"],
    isActive: true
  },
  {
    id: "tpl-003",
    name: "Agendamento de Visita",
    category: "scheduling",
    content: `OlÃ¡ {{leadName}}!

Confirmo a visita ao imÃ³vel em {{propertyLocation}} para {{visitDate}} Ã s {{visitTime}}.

EndereÃ§o: {{propertyAddress}}
PreÃ§o: {{propertyPrice}}

Estarei Ã  sua espera. Se precisar de remarcar, avise-me com antecedÃªncia.

AtÃ© breve!
{{agentName}}`,
    variables: ["leadName", "propertyLocation", "visitDate", "visitTime", "propertyAddress", "propertyPrice", "agentName"],
    isActive: true
  },
  {
    id: "tpl-004",
    name: "Proposta de Valor",
    category: "offer",
    content: `Prezado/a {{leadName}},

AgradeÃ§o a visita ao imÃ³vel em {{propertyLocation}}.

Gostaria de apresentar uma proposta formal:
â€¢ Valor: {{offerAmount}}
â€¢ CondiÃ§Ãµes: {{offerConditions}}

Esta proposta Ã© vÃ¡lida por {{validityDays}} dias.

Fico a aguardar a sua resposta.

Com os melhores cumprimentos,
{{agentName}}`,
    variables: ["leadName", "propertyLocation", "offerAmount", "offerConditions", "validityDays", "agentName"],
    isActive: true
  },
  {
    id: "tpl-005",
    name: "Fecho de NegÃ³cio",
    category: "closing",
    content: `Caro/a {{leadName}},

Excelente notÃ­cia! A proposta foi aceite. ðŸŽ‰

PrÃ³ximos passos:
1. Contrato Promessa de Compra e Venda
2. Escritura no notÃ¡rio
3. Entrega das chaves

Vou enviar toda a documentaÃ§Ã£o necessÃ¡ria por email.

ParabÃ©ns pela aquisiÃ§Ã£o!

{{agentName}}
ImoLead AI Pro`,
    variables: ["leadName", "agentName"],
    isActive: true
  }
];

export class WhatsAppService {
  private apiKey: string | null;
  private phoneNumberId: string | null;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || null;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || null;
  }

  getTemplates(): WhatsAppTemplate[] {
    return DEFAULT_TEMPLATES;
  }

  getTemplate(id: string): WhatsAppTemplate | undefined {
    return DEFAULT_TEMPLATES.find(t => t.id === id);
  }

  async generateAIMessage(params: GenerateMessageParams): Promise<string> {
    const messageTypeDescriptions: Record<string, string> = {
      first_contact: "primeiro contacto para demonstrar interesse no imÃ³vel",
      follow_up: "follow-up apÃ³s nÃ£o ter recebido resposta",
      scheduling: "agendamento de visita ao imÃ³vel",
      offer: "apresentaÃ§Ã£o de proposta de compra",
      closing: "fecho de negÃ³cio e prÃ³ximos passos"
    };

    const urgencyLevel: Record<string, string> = {
      quente: "muito interessado e pronto para avanÃ§ar",
      morno: "interessado mas ainda a avaliar opÃ§Ãµes",
      frio: "contacto inicial para despertar interesse"
    };

    const prompt = `Gera uma mensagem WhatsApp profissional em portuguÃªs de Portugal para um agente imobiliÃ¡rio.

Contexto:
- Nome do lead: ${params.leadName}
- ImÃ³vel: ${params.propertyDescription}
- LocalizaÃ§Ã£o: ${params.propertyLocation}
- PreÃ§o: ${params.propertyPrice}
- NÃ­vel de interesse do lead: ${urgencyLevel[params.leadStatus]}
- Tipo de mensagem: ${messageTypeDescriptions[params.messageType]}
- Nome do agente: ${params.agentName || "Agente ImoLead"}

Requisitos:
- Mensagem curta e direta (mÃ¡ximo 200 palavras)
- Tom profissional mas amigÃ¡vel
- Usar portuguÃªs de Portugal (nÃ£o brasileiro)
- Incluir call-to-action claro
- NÃ£o usar emojis excessivos (mÃ¡ximo 1-2)

Responde APENAS com a mensagem, sem explicaÃ§Ãµes adicionais.`;

    try {
      const response = await openai.chat.completions.create({
        model: getOpenAIHeavyModel(),
        messages: [
          { role: "system", content: "Ã‰s um assistente especializado em comunicaÃ§Ã£o imobiliÃ¡ria em Portugal. Geras mensagens WhatsApp profissionais e eficazes." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || this.getDefaultMessage(params);
    } catch (error) {
      console.warn("OpenAI unavailable for WhatsApp message generation, using template:", error);
      return this.getDefaultMessage(params);
    }
  }

  private getDefaultMessage(params: GenerateMessageParams): string {
    const templates: Record<string, string> = {
      first_contact: `OlÃ¡ ${params.leadName}!

Vi o seu anÃºncio do ${params.propertyDescription} em ${params.propertyLocation} (${params.propertyPrice}) e gostaria de saber mais informaÃ§Ãµes.

Podemos agendar uma visita?

Cumprimentos,
${params.agentName || "Agente ImoLead"}`,
      
      follow_up: `Bom dia ${params.leadName}!

Gostaria de dar seguimento ao nosso contacto sobre o imÃ³vel em ${params.propertyLocation}.

Ainda estÃ¡ disponÃ­vel? Continuo interessado/a.

${params.agentName || "Agente ImoLead"}`,
      
      scheduling: `OlÃ¡ ${params.leadName}!

Gostaria de agendar uma visita ao imÃ³vel em ${params.propertyLocation}.

EstÃ¡ disponÃ­vel esta semana?

${params.agentName || "Agente ImoLead"}`,
      
      offer: `Prezado/a ${params.leadName},

ApÃ³s a visita ao imÃ³vel em ${params.propertyLocation}, gostaria de apresentar uma proposta.

Podemos conversar sobre os termos?

${params.agentName || "Agente ImoLead"}`,
      
      closing: `Caro/a ${params.leadName},

ParabÃ©ns! O negÃ³cio estÃ¡ fechado.

Vou enviar toda a documentaÃ§Ã£o por email.

${params.agentName || "Agente ImoLead"}`
    };

    return templates[params.messageType] || templates.first_contact;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<WhatsAppMessage> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[WhatsApp] Sending message to ${phoneNumber}:`, message.substring(0, 50) + "...");

    return {
      id: messageId,
      leadId: "",
      to: phoneNumber,
      content: message,
      status: "sent",
      sentAt: new Date()
    };
  }

  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1);
    }
    
    if (!cleaned.startsWith("351") && cleaned.length === 9) {
      cleaned = "351" + cleaned;
    }
    
    return cleaned;
  }
}

export const whatsappService = new WhatsAppService();
