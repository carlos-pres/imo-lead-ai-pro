import OpenAI from "openai";
import pRetry from "p-retry";

// Using Replit's AI Integrations service with OpenRouter for DeepSeek access
// This does not require your own API key - charges are billed to your Replit credits
const hasOpenRouterConfig = !!(process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL && process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY);

const openrouter = hasOpenRouterConfig ? new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
}) : null;

// Fallback to OpenAI if configured
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
export const openai = hasOpenAIKey ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
}) : null;

interface LeadAnalysisResult {
  status: "quente" | "morno" | "frio";
  score: number;
  reasoning: string;
}

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export async function analyzeLeadWithAI(leadData: {
  name: string;
  property: string;
  propertyType: string;
  location: string;
  price: string;
  contact: string;
  source: string;
}): Promise<LeadAnalysisResult> {
  // Prefer OpenRouter/DeepSeek, fallback to OpenAI, then default classification
  const client = openrouter || openai;
  const model = openrouter ? "deepseek/deepseek-chat-v3.1" : "gpt-4o-mini";
  
  if (!client) {
    console.warn("No AI provider configured, returning default classification");
    return {
      status: "morno",
      score: 50,
      reasoning: "Classificação automática não disponível. Lead marcado como morno por defeito.",
    };
  }

  const prompt = `Analisa este lead imobiliário português e classifica o potencial de conversão:

DADOS DO LEAD:
- Nome/Vendedor: ${leadData.name}
- Descrição Imóvel: ${leadData.property}
- Tipo: ${leadData.propertyType}
- Localização: ${leadData.location}
- Preço Pedido: ${leadData.price}
- Contacto: ${leadData.contact}
- Origem/Fonte: ${leadData.source}

CRITÉRIOS DE AVALIAÇÃO (mercado português):
1. LOCALIZAÇÃO (peso 30%):
   - Premium: Lisboa Centro, Cascais, Porto Foz, Algarve (+25-30 pontos)
   - Boa: Grande Lisboa, Grande Porto, Capitais Distrito (+15-20 pontos)
   - Regular: Interior, zonas periféricas (+5-10 pontos)

2. PREÇO/m2 COMPETITIVO (peso 25%):
   - Abaixo mercado: +20 pontos (oportunidade)
   - Mercado: +10 pontos (standard)
   - Acima mercado: +0-5 pontos (difícil venda)

3. QUALIDADE DO CONTACTO (peso 20%):
   - Telefone + Email: +20 pontos
   - Só telefone ou só email: +10 pontos
   - Sem contacto direto: +0 pontos

4. FONTE DO LEAD (peso 15%):
   - Casafari/Idealista: +15 pontos (profissionais)
   - OLX/Facebook: +8 pontos (misto)
   - Manual/Outros: +5 pontos

5. INFORMAÇÃO COMPLETA (peso 10%):
   - Descrição detalhada, fotos, área: +10 pontos
   - Informação básica: +5 pontos
   - Mínima: +0 pontos

CLASSIFICAÇÃO FINAL:
- "quente" (75-100 pontos): Prioridade máxima, contactar nas próximas 24h
- "morno" (40-74 pontos): Potencial, incluir em follow-up regular
- "frio" (0-39 pontos): Baixa prioridade, manter para futuro

Responde APENAS com um objeto JSON neste formato exato:
{
  "status": "quente" | "morno" | "frio",
  "score": número entre 0-100,
  "reasoning": "breve explicação em português de Portugal (máx 80 palavras)"
}`;

  try {
    const result = await pRetry(
      async () => {
        const completion = await client.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: `És um analista especializado no mercado imobiliário português com conhecimento profundo de:
- Zonas premium (Lisboa, Porto, Cascais, Algarve) e respetivos preços/m2
- Tendências de mercado (investimento estrangeiro, AL, Golden Visa)
- Qualificação de leads por potencial de conversão
Responde SEMPRE com JSON válido, sem texto adicional.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from AI");
        }

        // Parse JSON from response (handle markdown code blocks)
        let jsonContent = content.trim();
        if (jsonContent.startsWith("```")) {
          jsonContent = jsonContent.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        }

        const parsed = JSON.parse(jsonContent) as LeadAnalysisResult;

        if (!parsed.status || !["quente", "morno", "frio"].includes(parsed.status)) {
          throw new Error("Invalid status from AI");
        }

        return parsed;
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2,
        shouldRetry: (error: any) => isRateLimitError(error),
      }
    );

    return result;
  } catch (error) {
    console.error("Error analyzing lead with AI:", error);
    return {
      status: "morno",
      score: 50,
      reasoning:
        "Análise automática não disponível. Lead marcado como morno por defeito.",
    };
  }
}

interface ChatContext {
  customerName?: string;
  customerPlan?: string;
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  leadsDetails?: string;
}

interface ReportData {
  leads: Array<{
    name: string;
    property: string;
    location: string;
    price: string;
    status: string;
    aiScore: number | null;
    source: string;
    createdAt: Date;
  }>;
  period: string;
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
}

export async function generateReportWithAI(data: ReportData): Promise<string> {
  const client = openrouter || openai;
  const model = openrouter ? "deepseek/deepseek-chat-v3.1" : "gpt-4o-mini";
  
  if (!client) {
    return generateDefaultReport(data);
  }

  const leadsDetails = data.leads.slice(0, 20).map(l => 
    `- ${l.name}: ${l.property} em ${l.location}, ${l.price}, Score: ${l.aiScore || 'N/A'}, Estado: ${l.status}, Fonte: ${l.source}`
  ).join('\n');

  const systemPrompt = `És um analista de dados especializado em leads imobiliários em Portugal. 
Gera relatórios profissionais, concisos e acionáveis em português de Portugal.
Usa formatação clara com secções, listas e destaques.`;

  const userPrompt = `Gera um relatório executivo de leads imobiliários para o período: ${data.period}

DADOS:
- Total de leads: ${data.totalLeads}
- Leads quentes: ${data.hotLeads} (${((data.hotLeads / data.totalLeads) * 100).toFixed(1)}%)
- Leads mornos: ${data.warmLeads} (${((data.warmLeads / data.totalLeads) * 100).toFixed(1)}%)
- Leads frios: ${data.coldLeads} (${((data.coldLeads / data.totalLeads) * 100).toFixed(1)}%)

AMOSTRA DE LEADS:
${leadsDetails || 'Nenhum lead disponível'}

ESTRUTURA DO RELATÓRIO:
1. Resumo Executivo (2-3 linhas)
2. Análise de Desempenho
3. Principais Oportunidades (top 3 leads quentes)
4. Recomendações Estratégicas (3-5 ações)
5. Próximos Passos

Mantém o relatório conciso (máximo 500 palavras).`;

  try {
    const result = await pRetry(
      async () => {
        const completion = await client.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 1500,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from AI");
        }

        return content;
      },
      {
        retries: 2,
        minTimeout: 1000,
        maxTimeout: 5000,
        shouldRetry: (error: any) => isRateLimitError(error),
      }
    );

    return result;
  } catch (error) {
    console.error("Error generating report with AI:", error);
    return generateDefaultReport(data);
  }
}

function generateDefaultReport(data: ReportData): string {
  const hotPercentage = data.totalLeads > 0 ? ((data.hotLeads / data.totalLeads) * 100).toFixed(1) : 0;
  const warmPercentage = data.totalLeads > 0 ? ((data.warmLeads / data.totalLeads) * 100).toFixed(1) : 0;
  const coldPercentage = data.totalLeads > 0 ? ((data.coldLeads / data.totalLeads) * 100).toFixed(1) : 0;

  return `RELATORIO DE LEADS - ${data.period}

RESUMO EXECUTIVO
Total de ${data.totalLeads} leads captados no periodo analisado.

DISTRIBUICAO POR ESTADO
- Leads Quentes: ${data.hotLeads} (${hotPercentage}%)
- Leads Mornos: ${data.warmLeads} (${warmPercentage}%)
- Leads Frios: ${data.coldLeads} (${coldPercentage}%)

RECOMENDACOES
1. Priorize o contacto com os ${data.hotLeads} leads quentes
2. Agende follow-ups para os leads mornos
3. Reveja a estrategia de captacao se muitos leads forem frios

PROXIMOS PASSOS
- Contactar leads quentes nas proximas 24h
- Preparar mensagens personalizadas de follow-up
- Analisar fontes com melhor qualidade de leads`;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// Streaming version for faster perceived response
export async function* chatWithAIStream(message: string, context?: ChatContext, conversationHistory?: ConversationMessage[]): AsyncGenerator<string> {
  const client = openrouter || openai;
  const model = openrouter ? "deepseek/deepseek-chat-v3.1" : "gpt-4o-mini";
  
  if (!client) {
    yield "O assistente IA está temporariamente indisponível.";
    return;
  }

  const systemPrompt = buildSystemPrompt(context);
  
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];
  
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  
  messages.push({ role: "user", content: message });

  try {
    const stream = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error("Error in AI chat stream:", error);
    yield "Desculpe, ocorreu um erro ao processar o seu pedido.";
  }
}

function buildSystemPrompt(context?: ChatContext): string {
  const customerName = context?.customerName || "";
  const customerPlan = context?.customerPlan || "basic";
  const isBasic = customerPlan === "basic";
  const isPro = customerPlan === "pro";
  
  const planFeatures = {
    basic: { name: "ImoLead Basic", leads: "100+ leads/mes", reports: "1x por semana", canScheduleVisits: false, hasAdvancedAI: false },
    pro: { name: "ImoLead Pro", leads: "Leads ilimitados", reports: "3x por semana", canScheduleVisits: true, hasAdvancedAI: true },
    custom: { name: "ImoLead Custom", leads: "Leads ilimitados", reports: "Diario", canScheduleVisits: true, hasAdvancedAI: true }
  };
  
  const currentPlanInfo = planFeatures[customerPlan as keyof typeof planFeatures] || planFeatures.basic;
  
  return `Es o ImoLead AI, assistente virtual especializado em imobiliario portugues.
PLANO: ${currentPlanInfo.name}
${isBasic ? "RESTRICOES BASIC: NAO marcar visitas nem agendar. Limite 100 leads/mes." : isPro ? "PRO ATIVO: Marcacao visitas, relatorios 3x/semana, automacao." : "CUSTOM: Todas funcionalidades."}

CONTEXTO: ${context?.totalLeads || 0} leads (${context?.hotLeads || 0} quentes, ${context?.warmLeads || 0} mornos, ${context?.coldLeads || 0} frios)
${context?.leadsDetails ? `TOP: ${context.leadsDetails}` : ""}

ESTILO: Portugues de Portugal, respostas curtas (<150 palavras), sugestoes proativas.`;
}

export async function chatWithAI(message: string, context?: ChatContext, conversationHistory?: ConversationMessage[]): Promise<string> {
  const client = openrouter || openai;
  const model = openrouter ? "deepseek/deepseek-chat-v3.1" : "gpt-4o-mini";
  
  if (!client) {
    return "O assistente IA está temporariamente indisponível. Por favor, configure a API key nas definições para ativar todas as funcionalidades de IA.";
  }

  const customerName = context?.customerName || "";
  const customerPlan = context?.customerPlan || "basic";
  const isBasic = customerPlan === "basic";
  const isPro = customerPlan === "pro";
  const isCustom = customerPlan === "custom";
  
  // Plan-specific features
  const planFeatures = {
    basic: {
      name: "ImoLead Basic",
      leads: "100+ leads/mes",
      reports: "1x por semana",
      canScheduleVisits: false,
      hasAdvancedAI: false,
      features: ["Pesquisa automatica", "Gestao de agenda", "Relatorio semanal", "Suporte semanal"]
    },
    pro: {
      name: "ImoLead Pro", 
      leads: "Leads ilimitados",
      reports: "3x por semana",
      canScheduleVisits: true,
      hasAdvancedAI: true,
      features: ["Tudo do Basic", "IA avancada", "Marcacao de visitas", "Automacao WhatsApp/Email", "Suporte prioritario"]
    },
    custom: {
      name: "ImoLead Custom",
      leads: "Leads ilimitados",
      reports: "Diario",
      canScheduleVisits: true,
      hasAdvancedAI: true,
      features: ["Tudo do Pro", "Gestor dedicado", "Videos profissionais", "Suporte 24/7", "Automacao redes sociais"]
    }
  };
  
  const currentPlanInfo = planFeatures[customerPlan as keyof typeof planFeatures] || planFeatures.basic;
  
  const systemPrompt = `Es o ImoLead AI, um assistente virtual amigavel especializado em imobiliario portugues.

PLANO DO UTILIZADOR: ${currentPlanInfo.name}
${isBasic ? `
RESTRICOES DO PLANO BASIC (IMPORTANTE - RESPEITA SEMPRE):
- NAO podes marcar visitas nem agendar compromissos (so disponivel no Pro/Custom)
- NAO podes gerar relatorios avancados (so disponivel no Pro/Custom)
- Limite de 100 leads por mes
- Relatorios apenas 1x por semana
- Se o utilizador pedir para marcar visita, diz: "A marcacao de visitas esta disponivel apenas nos planos Pro e Custom. Posso ajudar-te a criar uma mensagem para contactar o lead diretamente!"
` : isPro ? `
FUNCIONALIDADES PRO (ATIVAS):
- Podes marcar visitas e agendar compromissos
- Relatorios 3x por semana
- IA avancada ativa
- Automacao de mensagens disponivel
` : `
FUNCIONALIDADES CUSTOM (TODAS ATIVAS):
- Todas as funcionalidades disponiveis
- Gestor de conta dedicado
- Suporte 24/7
`}

PERSONALIDADE:
- Fala de forma natural e calorosa, como um colega experiente
- Usa o nome "${customerName || "utilizador"}" de forma natural
- Oferece sugestoes proativas baseadas no contexto e PLANO

ESTADO ATUAL DO NEGOCIO:
- Total de leads: ${context?.totalLeads || 0}
- Leads quentes: ${context?.hotLeads || 0} (prioridade maxima!)
- Leads mornos: ${context?.warmLeads || 0}
- Leads frios: ${context?.coldLeads || 0}
${context?.leadsDetails ? `
TOP LEADS (por score IA):
${context.leadsDetails}` : ""}

ACOES DISPONIVEIS NO PLANO ${currentPlanInfo.name.toUpperCase()}:
1. "Pesquisar agora" - busca leads em Casafari, Idealista, OLX
2. "Gerar mensagem para [nome]" - cria WhatsApp/Email personalizado
3. "Analisar leads" - prioriza baseado em potencial
${!isBasic ? `4. "Gerar relatorio" - resumo executivo detalhado
5. "Marcar visita com [nome]" - agenda visita ao imovel` : `4. "Gerar relatorio basico" - resumo semanal simples`}

ESTILO DE COMUNICACAO:
- Portugues de Portugal (nunca brasileiro)
- Respostas curtas e acionaveis (max 200 palavras)
- Usa bullet points e estrutura clara
- Termina com uma sugestao de proxima acao
- NUNCA oferecas funcionalidades nao disponiveis no plano do utilizador
- Se pedirem algo fora do plano, sugere upgrade de forma educada

CONHECIMENTO DO MERCADO PORTUGUES:
- Lisboa Centro: 5.000-8.000 EUR/m2 | Porto: 3.000-5.500 EUR/m2
- Algarve: 2.500-5.000 EUR/m2 | Interior: 800-1.500 EUR/m2`;


  try {
    // Build messages array with conversation history
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    
    // Add conversation history (limit to last 10 messages to control token usage)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    
    // Add current user message
    messages.push({ role: "user", content: message });

    const result = await pRetry(
      async () => {
        const completion = await client.chat.completions.create({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from AI");
        }

        return content;
      },
      {
        retries: 2,
        minTimeout: 1000,
        maxTimeout: 5000,
        shouldRetry: (error: any) => isRateLimitError(error),
      }
    );

    return result;
  } catch (error) {
    console.error("Error in AI chat:", error);
    return "Desculpe, ocorreu um erro ao processar o seu pedido. Por favor, tente novamente em alguns momentos.";
  }
}
