import OpenAI from "openai";

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
    name: "Primeiro Contacto - Imóvel Específico",
    category: "first_contact",
    content: `Olá {{leadName}}! 👋

Vi o seu anúncio do imóvel em {{propertyLocation}} e fiquei interessado/a.

{{propertyDescription}}

Seria possível agendar uma visita? Estou disponível esta semana.

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

Enviei-lhe uma mensagem há alguns dias sobre o imóvel em {{propertyLocation}}.

Gostaria de saber se ainda está disponível e se podemos agendar uma visita.

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
    content: `Olá {{leadName}}!

Confirmo a visita ao imóvel em {{propertyLocation}} para {{visitDate}} às {{visitTime}}.

Endereço: {{propertyAddress}}
Preço: {{propertyPrice}}

Estarei à sua espera. Se precisar de remarcar, avise-me com antecedência.

Até breve!
{{agentName}}`,
    variables: ["leadName", "propertyLocation", "visitDate", "visitTime", "propertyAddress", "propertyPrice", "agentName"],
    isActive: true
  },
  {
    id: "tpl-004",
    name: "Proposta de Valor",
    category: "offer",
    content: `Prezado/a {{leadName}},

Agradeço a visita ao imóvel em {{propertyLocation}}.

Gostaria de apresentar uma proposta formal:
• Valor: {{offerAmount}}
• Condições: {{offerConditions}}

Esta proposta é válida por {{validityDays}} dias.

Fico a aguardar a sua resposta.

Com os melhores cumprimentos,
{{agentName}}`,
    variables: ["leadName", "propertyLocation", "offerAmount", "offerConditions", "validityDays", "agentName"],
    isActive: true
  },
  {
    id: "tpl-005",
    name: "Fecho de Negócio",
    category: "closing",
    content: `Caro/a {{leadName}},

Excelente notícia! A proposta foi aceite. 🎉

Próximos passos:
1. Contrato Promessa de Compra e Venda
2. Escritura no notário
3. Entrega das chaves

Vou enviar toda a documentação necessária por email.

Parabéns pela aquisição!

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
      first_contact: "primeiro contacto para demonstrar interesse no imóvel",
      follow_up: "follow-up após não ter recebido resposta",
      scheduling: "agendamento de visita ao imóvel",
      offer: "apresentação de proposta de compra",
      closing: "fecho de negócio e próximos passos"
    };

    const urgencyLevel: Record<string, string> = {
      quente: "muito interessado e pronto para avançar",
      morno: "interessado mas ainda a avaliar opções",
      frio: "contacto inicial para despertar interesse"
    };

    const prompt = `Gera uma mensagem WhatsApp profissional em português de Portugal para um agente imobiliário.

Contexto:
- Nome do lead: ${params.leadName}
- Imóvel: ${params.propertyDescription}
- Localização: ${params.propertyLocation}
- Preço: ${params.propertyPrice}
- Nível de interesse do lead: ${urgencyLevel[params.leadStatus]}
- Tipo de mensagem: ${messageTypeDescriptions[params.messageType]}
- Nome do agente: ${params.agentName || "Agente ImoLead"}

Requisitos:
- Mensagem curta e direta (máximo 200 palavras)
- Tom profissional mas amigável
- Usar português de Portugal (não brasileiro)
- Incluir call-to-action claro
- Não usar emojis excessivos (máximo 1-2)

Responde APENAS com a mensagem, sem explicações adicionais.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "És um assistente especializado em comunicação imobiliária em Portugal. Geras mensagens WhatsApp profissionais e eficazes." },
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
      first_contact: `Olá ${params.leadName}!

Vi o seu anúncio do ${params.propertyDescription} em ${params.propertyLocation} (${params.propertyPrice}) e gostaria de saber mais informações.

Podemos agendar uma visita?

Cumprimentos,
${params.agentName || "Agente ImoLead"}`,
      
      follow_up: `Bom dia ${params.leadName}!

Gostaria de dar seguimento ao nosso contacto sobre o imóvel em ${params.propertyLocation}.

Ainda está disponível? Continuo interessado/a.

${params.agentName || "Agente ImoLead"}`,
      
      scheduling: `Olá ${params.leadName}!

Gostaria de agendar uma visita ao imóvel em ${params.propertyLocation}.

Está disponível esta semana?

${params.agentName || "Agente ImoLead"}`,
      
      offer: `Prezado/a ${params.leadName},

Após a visita ao imóvel em ${params.propertyLocation}, gostaria de apresentar uma proposta.

Podemos conversar sobre os termos?

${params.agentName || "Agente ImoLead"}`,
      
      closing: `Caro/a ${params.leadName},

Parabéns! O negócio está fechado.

Vou enviar toda a documentação por email.

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
