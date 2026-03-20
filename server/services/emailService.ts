import OpenAI from "openai";
import { getOpenAIHeavyModel } from "../lib/aiModelConfig.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EmailConfig {
  provider: "sendgrid" | "resend" | "smtp";
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export async function generateAIMessage(
  leadName: string,
  leadLocation: string,
  leadProperty: string,
  leadPrice: string,
  triggerType: "new_lead" | "followup_3d" | "followup_7d" | "status_change",
  channel: "whatsapp" | "email"
): Promise<{ subject?: string; content: string }> {
  const triggerDescriptions = {
    new_lead: "primeiro contacto com um novo lead",
    followup_3d: "follow-up apos 3 dias sem resposta",
    followup_7d: "follow-up apos 7 dias sem resposta",
    status_change: "mudanca de estado do lead"
  };

  const prompt = `Gera uma mensagem profissional em portugues europeu para um consultor imobiliario.

Contexto:
- Tipo: ${triggerDescriptions[triggerType]}
- Canal: ${channel === "whatsapp" ? "WhatsApp" : "Email"}
- Nome do lead: ${leadName}
- Localizacao: ${leadLocation}
- Propriedade: ${leadProperty}
- Preco: ${leadPrice}

Requisitos:
- Tom profissional mas acolhedor
- Maximo 150 palavras para WhatsApp, 250 para email
- Nao uses emojis
- Inclui uma chamada para acao clara
- ${channel === "email" ? "Inclui tambem um assunto curto e atrativo (max 60 caracteres)" : ""}

Responde em formato JSON:
${channel === "email" ? '{"subject": "assunto aqui", "content": "mensagem aqui"}' : '{"content": "mensagem aqui"}'}`;

  try {
    const response = await openai.chat.completions.create({
      model: getOpenAIHeavyModel(),
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      subject: result.subject,
      content: result.content || "Ola! Gostaria de saber se posso ajuda-lo com mais informacoes sobre este imovel."
    };
  } catch (error) {
    console.error("Error generating AI message:", error);
    return {
      subject: channel === "email" ? `Imovel em ${leadLocation} - Informacoes` : undefined,
      content: `Ola ${leadName}! Sou consultor imobiliario e gostaria de saber se posso ajuda-lo com mais informacoes sobre o imovel em ${leadLocation}. Aguardo o seu contacto.`
    };
  }
}

export async function sendEmail(params: SendEmailParams, config?: EmailConfig): Promise<{ success: boolean; error?: string }> {
  if (!config?.apiKey) {
    console.log("Email service not configured - simulating send to:", params.to);
    return { success: true };
  }

  try {
    if (config.provider === "sendgrid") {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: config.fromEmail, name: config.fromName },
          subject: params.subject,
          content: [
            { type: "text/plain", value: params.body },
            ...(params.html ? [{ type: "text/html", value: params.html }] : []),
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }
      return { success: true };
    }

    if (config.provider === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${config.fromName} <${config.fromEmail}>`,
          to: params.to,
          subject: params.subject,
          text: params.body,
          html: params.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }
      return { success: true };
    }

    return { success: false, error: "Provider not supported" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendTrialExpiredEmail(
  to: string,
  customerName: string,
  trialEndDate: Date,
  config?: EmailConfig
): Promise<{ success: boolean; error?: string }> {
  const formattedDate = trialEndDate.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const subject = "O seu periodo de teste ImoLead AI Pro expirou";
  const body = `Ola ${customerName},

O seu periodo de teste gratuito do ImoLead AI Pro terminou em ${formattedDate}.

Para continuar a usar a plataforma com AI, pipeline e relatorios de mercado, pode ativar:
- ImoLead Starter - 47 EUR/mes ou 451.20 EUR/ano
  Inclui relatorio de mercado local mensal
- ImoLead Pro - 97 EUR/mes ou 931.20 EUR/ano
  Inclui relatorios de mercado semanais para Portugal e Iberia
- ImoLead Enterprise - 297 EUR/mes ou 2851.20 EUR/ano
  Inclui relatorios executivos multi-mercado e operacao europeia

Todos os planos anuais incluem 20% de desconto fixo.

Aceda a sua conta em: https://imo-lead-ai-pro.replit.app/loja

Se tiver alguma questao, responda a este email.

Cumprimentos,
Equipa ImoLead AI Pro`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .plan { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
    .plan-title { font-size: 18px; font-weight: bold; color: #1e3a5f; }
    .plan-price { font-size: 24px; color: #2563eb; font-weight: bold; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ImoLead AI Pro</h1>
      <p>O seu periodo de teste terminou</p>
    </div>
    <div class="content">
      <p>Ola <strong>${customerName}</strong>,</p>
      <p>O seu periodo de teste gratuito do ImoLead AI Pro terminou em <strong>${formattedDate}</strong>.</p>
      <p>Para continuar a usar a plataforma com AI, pipeline e relatorios de mercado, subscreva um dos nossos planos:</p>
      
      <div class="plan">
        <div class="plan-title">ImoLead Starter</div>
        <div class="plan-price">47 EUR/mes</div>
        <p>451.20 EUR/ano com 20% de desconto fixo e relatorio de mercado local mensal</p>
      </div>
      
      <div class="plan">
        <div class="plan-title">ImoLead Pro</div>
        <div class="plan-price">97 EUR/mes</div>
        <p>931.20 EUR/ano com 20% de desconto fixo e relatorios semanais de mercado</p>
      </div>

      <div class="plan">
        <div class="plan-title">ImoLead Enterprise</div>
        <div class="plan-price">297 EUR/mes</div>
        <p>2851.20 EUR/ano com 20% de desconto fixo e relatorios executivos multi-mercado</p>
      </div>
      
      <center>
        <a href="https://imo-lead-ai-pro.replit.app/loja" class="btn">Ver Planos</a>
      </center>
      
      <p style="margin-top: 30px;">Se tiver alguma questao, responda a este email.</p>
      <p>Cumprimentos,<br><strong>Equipa ImoLead AI Pro</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 ImoLead AI Pro. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to, subject, body, html }, config);
}

export async function sendWhatsApp(
  phone: string,
  message: string,
  config?: { apiKey?: string; phoneNumberId?: string }
): Promise<{ success: boolean; error?: string; fallbackUrl?: string }> {
  const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+/, "");
  
  if (!config?.apiKey || !config?.phoneNumberId) {
    const encodedMessage = encodeURIComponent(message);
    const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    console.log("WhatsApp Business API not configured - using fallback URL");
    return { success: true, fallbackUrl };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      const encodedMessage = encodeURIComponent(message);
      return { 
        success: false, 
        error,
        fallbackUrl: `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      };
    }

    return { success: true };
  } catch (error: any) {
    const encodedMessage = encodeURIComponent(message);
    return { 
      success: false, 
      error: error.message,
      fallbackUrl: `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    };
  }
}

