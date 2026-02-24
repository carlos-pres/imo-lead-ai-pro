import nodemailer from "nodemailer";
import logger from "./logger.js";
import { sendOutlookEmail, isOutlookConfigured } from "./outlook.js";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  };
}

function createTransporter() {
  const config = getEmailConfig();
  
  if (!config) {
    logger.warn('Email não configurado - SMTP_HOST, SMTP_USER ou SMTP_PASS em falta');
    return null;
  }

  return nodemailer.createTransport(config);
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Try Outlook API first (preferred method)
  try {
    const outlookConfigured = await isOutlookConfigured();
    if (outlookConfigured) {
      const outlookResult = await sendOutlookEmail(options);
      if (outlookResult) {
        logger.info('Email enviado via Outlook API', { to: options.to, subject: options.subject });
        return true;
      }
    }
  } catch (error) {
    logger.warn('Outlook API falhou, tentando SMTP fallback', { error: error instanceof Error ? error.message : 'unknown' });
  }

  // Fallback to SMTP
  const transporter = createTransporter();
  
  if (!transporter) {
    logger.info('Email não enviado (SMTP não configurado)', { to: options.to, subject: options.subject });
    return false;
  }

  const fromName = process.env.EMAIL_FROM_NAME || 'ImoLead AI Pro';
  const fromEmail = process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    });

    logger.info('Email enviado com sucesso', { to: options.to, subject: options.subject });
    return true;
  } catch (error) {
    logger.error('Erro ao enviar email', { 
      to: options.to, 
      subject: options.subject, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
    return false;
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';
  
  const verificationUrl = `${baseUrl}/verificar-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verificação de Email - ImoLead AI Pro</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">ImoLead AI Pro</h1>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px;">Olá ${name}!</h2>
          
          <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            Obrigado por se registar no ImoLead AI Pro. Para ativar a sua conta e começar a utilizar a plataforma, 
            por favor confirme o seu endereço de email clicando no botão abaixo.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                      color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; 
                      font-weight: 600; font-size: 16px;">
              Verificar Email
            </a>
          </div>
          
          <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
            Se o botão não funcionar, copie e cole o seguinte link no seu navegador:
          </p>
          <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 8px 0 0 0;">
            ${verificationUrl}
          </p>
          
          <div style="border-top: 1px solid #e4e4e7; margin-top: 32px; padding-top: 24px;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              Este link expira em 24 horas. Se não solicitou esta verificação, pode ignorar este email.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f4f4f5; padding: 20px; text-align: center;">
          <p style="color: #71717a; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ImoLead AI Pro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Olá ${name}!

Obrigado por se registar no ImoLead AI Pro. Para ativar a sua conta, por favor visite o seguinte link:

${verificationUrl}

Este link expira em 24 horas.

Se não solicitou esta verificação, pode ignorar este email.

© ${new Date().getFullYear()} ImoLead AI Pro
  `;

  return sendEmail({
    to: email,
    subject: 'Verifique o seu email - ImoLead AI Pro',
    html,
    text
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';
  
  const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperação de Senha - ImoLead AI Pro</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">ImoLead AI Pro</h1>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px;">Olá ${name}!</h2>
          
          <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            Recebemos um pedido para redefinir a senha da sua conta no ImoLead AI Pro. 
            Para criar uma nova senha, clique no botão abaixo.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                      color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; 
                      font-weight: 600; font-size: 16px;">
              Redefinir Senha
            </a>
          </div>
          
          <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
            Se o botão não funcionar, copie e cole o seguinte link no seu navegador:
          </p>
          <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 8px 0 0 0;">
            ${resetUrl}
          </p>
          
          <div style="border-top: 1px solid #e4e4e7; margin-top: 32px; padding-top: 24px;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              Este link expira em 1 hora. Se não solicitou esta recuperação de senha, pode ignorar este email.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f4f4f5; padding: 20px; text-align: center;">
          <p style="color: #71717a; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ImoLead AI Pro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Olá ${name}!

Recebemos um pedido para redefinir a senha da sua conta no ImoLead AI Pro.

Para criar uma nova senha, visite o seguinte link:

${resetUrl}

Este link expira em 1 hora.

Se não solicitou esta recuperação de senha, pode ignorar este email.

© ${new Date().getFullYear()} ImoLead AI Pro
  `;

  return sendEmail({
    to: email,
    subject: 'Recuperação de Senha - ImoLead AI Pro',
    html,
    text
  });
}

export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null;
}

interface ReportData {
  customerName: string;
  planName: string;
  period: string;
  totalLeads: number;
  newLeadsThisWeek: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  scheduledEvents: number;
  messagesSent: number;
  topLocations: Array<{ location: string; count: number }>;
  conversionRate?: number;
}

export async function sendWeeklyReportEmail(email: string, data: ReportData): Promise<boolean> {
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';

  const html = `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatorio Semanal - ImoLead AI Pro</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">ImoLead AI Pro</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Relatorio ${data.period}</p>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="color: #18181b; margin: 0 0 8px 0; font-size: 20px;">Ola ${data.customerName}!</h2>
          <p style="color: #71717a; margin: 0 0 24px 0; font-size: 14px;">Plano: ${data.planName}</p>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #0369a1;">${data.totalLeads}</div>
              <div style="font-size: 12px; color: #64748b;">Total Leads</div>
            </div>
            <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #15803d;">${data.newLeadsThisWeek}</div>
              <div style="font-size: 12px; color: #64748b;">Novos Esta Semana</div>
            </div>
          </div>
          
          <h3 style="color: #18181b; margin: 24px 0 16px 0; font-size: 16px; font-weight: 600;">Classificacao de Leads</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="background: #fef2f2; border-radius: 6px; padding: 12px; text-align: center;">
              <div style="font-size: 20px; font-weight: 600; color: #dc2626;">${data.hotLeads}</div>
              <div style="font-size: 11px; color: #991b1b;">Quentes</div>
            </div>
            <div style="background: #fffbeb; border-radius: 6px; padding: 12px; text-align: center;">
              <div style="font-size: 20px; font-weight: 600; color: #d97706;">${data.warmLeads}</div>
              <div style="font-size: 11px; color: #92400e;">Mornos</div>
            </div>
            <div style="background: #eff6ff; border-radius: 6px; padding: 12px; text-align: center;">
              <div style="font-size: 20px; font-weight: 600; color: #2563eb;">${data.coldLeads}</div>
              <div style="font-size: 11px; color: #1e40af;">Frios</div>
            </div>
          </div>
          
          <h3 style="color: #18181b; margin: 24px 0 16px 0; font-size: 16px; font-weight: 600;">Atividade</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #52525b;">Eventos Agendados</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #18181b;">${data.scheduledEvents}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #52525b;">Mensagens Enviadas</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #18181b;">${data.messagesSent}</td>
            </tr>
            ${data.conversionRate !== undefined ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #52525b;">Taxa de Conversao</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #15803d;">${data.conversionRate.toFixed(1)}%</td>
            </tr>
            ` : ''}
          </table>
          
          ${data.topLocations.length > 0 ? `
          <h3 style="color: #18181b; margin: 24px 0 16px 0; font-size: 16px; font-weight: 600;">Top Localizacoes</h3>
          <div style="background: #f9fafb; border-radius: 6px; padding: 12px;">
            ${data.topLocations.slice(0, 5).map((loc, i) => `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; ${i < data.topLocations.slice(0, 5).length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                <span style="color: #52525b;">${loc.location}</span>
                <span style="font-weight: 600; color: #18181b;">${loc.count} leads</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${baseUrl}/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                      color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; 
                      font-weight: 600; font-size: 16px;">
              Ver Dashboard Completo
            </a>
          </div>
        </div>
        
        <div style="background-color: #f4f4f5; padding: 20px; text-align: center;">
          <p style="color: #71717a; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ImoLead AI Pro. Todos os direitos reservados.
          </p>
          <p style="color: #a1a1aa; font-size: 11px; margin: 8px 0 0 0;">
            Recebe este email porque e cliente ImoLead AI Pro.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Relatorio ${data.period} - ImoLead AI Pro

Ola ${data.customerName}!
Plano: ${data.planName}

RESUMO
------
Total Leads: ${data.totalLeads}
Novos Esta Semana: ${data.newLeadsThisWeek}

CLASSIFICACAO
-------------
Quentes: ${data.hotLeads}
Mornos: ${data.warmLeads}
Frios: ${data.coldLeads}

ATIVIDADE
---------
Eventos Agendados: ${data.scheduledEvents}
Mensagens Enviadas: ${data.messagesSent}
${data.conversionRate !== undefined ? `Taxa de Conversao: ${data.conversionRate.toFixed(1)}%` : ''}

Aceda ao dashboard: ${baseUrl}/dashboard

© ${new Date().getFullYear()} ImoLead AI Pro
  `;

  return sendEmail({
    to: email,
    subject: `Relatorio ${data.period} - ImoLead AI Pro`,
    html,
    text
  });
}

export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <title>Teste de Email - ImoLead AI Pro</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">✓ Teste de Email</h1>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px;">Configuração de Email Confirmada!</h2>
          
          <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            Este é um email de teste do ImoLead AI Pro. Se está a receber esta mensagem, 
            significa que a configuração de email está a funcionar corretamente.
          </p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 24px 0;">
            <p style="color: #166534; margin: 0; font-size: 14px;">
              <strong>Configuração SMTP:</strong><br>
              Servidor: ${process.env.SMTP_HOST}<br>
              Porta: ${process.env.SMTP_PORT}<br>
              Email: ${process.env.SMTP_USER}
            </p>
          </div>
          
          <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">
            Data do teste: ${new Date().toLocaleString('pt-PT')}
          </p>
        </div>
        
        <div style="background-color: #f4f4f5; padding: 20px; text-align: center;">
          <p style="color: #71717a; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ImoLead AI Pro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const success = await sendEmail({
      to: toEmail,
      subject: 'Teste de Email - ImoLead AI Pro',
      html,
      text: `Teste de Email - ImoLead AI Pro\n\nEste é um email de teste. Se está a receber esta mensagem, a configuração de email está a funcionar corretamente.\n\nServidor: ${process.env.SMTP_HOST}\nPorta: ${process.env.SMTP_PORT}\nEmail: ${process.env.SMTP_USER}\n\nData: ${new Date().toLocaleString('pt-PT')}`
    });
    
    return { success };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
