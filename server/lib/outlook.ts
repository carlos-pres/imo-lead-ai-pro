// Outlook Integration using Microsoft Graph API
// This file uses the Replit Outlook connector for OAuth-based email sending

import { Client } from '@microsoft/microsoft-graph-client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    return null;
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=outlook',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );
    
    const data = await response.json();
    connectionSettings = data.items?.[0];

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!connectionSettings || !accessToken) {
      return null;
    }
    return accessToken;
  } catch (error) {
    console.error('Error getting Outlook access token:', error);
    return null;
  }
}

async function getOutlookClient() {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    return null;
  }

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function isOutlookConfigured(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

interface OutlookEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendOutlookEmail(options: OutlookEmailOptions): Promise<boolean> {
  try {
    const client = await getOutlookClient();
    
    if (!client) {
      console.log('Outlook not configured, skipping email send');
      return false;
    }

    const message = {
      subject: options.subject,
      body: {
        contentType: 'HTML',
        content: options.html
      },
      toRecipients: [
        {
          emailAddress: {
            address: options.to
          }
        }
      ]
    };

    await client.api('/me/sendMail').post({
      message: message,
      saveToSentItems: true
    });

    console.log('Email sent successfully via Outlook API to:', options.to);
    return true;
  } catch (error) {
    console.error('Error sending email via Outlook:', error);
    return false;
  }
}

export async function sendOutlookVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
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
            © ${new Date().getFullYear()} ImoLead AI Pro - SHALON Soluções Tecnológicas. Deus seja louvado!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendOutlookEmail({
    to: email,
    subject: 'Verifique o seu email - ImoLead AI Pro',
    html
  });
}

export async function sendOutlookPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
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
            © ${new Date().getFullYear()} ImoLead AI Pro - SHALON Soluções Tecnológicas. Deus seja louvado!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendOutlookEmail({
    to: email,
    subject: 'Recuperação de Senha - ImoLead AI Pro',
    html
  });
}

export async function sendOutlookTestEmail(toEmail: string): Promise<{ success: boolean; error?: string }> {
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
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Teste de Email</h1>
        </div>
        
        <div style="padding: 32px;">
          <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 20px;">Configuração Confirmada!</h2>
          
          <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            Este é um email de teste do ImoLead AI Pro. Se está a receber esta mensagem, 
            significa que a configuração de email via Outlook API está a funcionar corretamente.
          </p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 24px 0;">
            <p style="color: #166534; margin: 0; font-size: 14px;">
              <strong>Método:</strong> Microsoft Graph API (Outlook)<br>
              <strong>Status:</strong> Conectado e funcionando
            </p>
          </div>
          
          <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">
            Data do teste: ${new Date().toLocaleString('pt-PT')}
          </p>
        </div>
        
        <div style="background-color: #f4f4f5; padding: 20px; text-align: center;">
          <p style="color: #71717a; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ImoLead AI Pro - SHALON Soluções Tecnológicas. Deus seja louvado!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const success = await sendOutlookEmail({
      to: toEmail,
      subject: 'Teste de Email - ImoLead AI Pro',
      html
    });
    
    return { success };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
