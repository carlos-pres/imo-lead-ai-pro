import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/* ================= AGENTE ESPECIALISTA ================= */

const SYSTEM_ROLE = `
Você é um especialista em prospecção imobiliária na Europa.

Seu papel é ajudar uma imobiliária moderna a:

- identificar oportunidades de venda
- qualificar proprietários
- iniciar conversas profissionais
- converter leads em visitas

Você entende o mercado imobiliário europeu,
especialmente Portugal, Espanha e França.

Você escreve mensagens naturais, profissionais
e focadas em criar confiança com o proprietário.

Seu objetivo final é gerar uma visita ou reunião
com o cliente.
`

/* ================= CLASSIFICAR LEAD ================= */

export async function classifyLead(lead: any): Promise<string> {

  const prompt = `
Analise o lead abaixo.

Classifique como:

quente
morno
frio

Considere:

- tempo do imóvel no mercado
- reduções de preço
- comportamento do proprietário
- probabilidade de venda

Lead:
${JSON.stringify(lead)}

Responda apenas com a classificação.
`

  const response = await openai.chat.completions.create({
    model: "gpt-5.3-instant",
    messages: [
      { role: "system", content: SYSTEM_ROLE },
      { role: "user", content: prompt }
    ]
  })

  return response.choices[0].message.content?.trim().toLowerCase() || "frio"
}


/* ================= DEFINIR ESTRATÉGIA ================= */

export function defineStrategy(classification: string) {

  if (classification === "quente") {
    return {
      goal: "marcar visita rapidamente",
      tone: "profissional e direto"
    }
  }

  if (classification === "morno") {
    return {
      goal: "entender interesse do proprietário",
      tone: "consultivo"
    }
  }

  return {
    goal: "criar relacionamento",
    tone: "informativo"
  }
}


/* ================= GERAR PRIMEIRO CONTACTO ================= */

export async function generateFirstContact(lead: any, strategy: any): Promise<string> {

  const prompt = `
Objetivo da conversa: ${strategy.goal}

Tom da conversa: ${strategy.tone}

Dados do lead:
${JSON.stringify(lead)}

Escreva uma primeira mensagem profissional para o proprietário.

A mensagem deve:

- parecer humana
- ser curta
- gerar interesse em conversar
`

  const response = await openai.chat.completions.create({
    model: "gpt-5.3-instant",
    messages: [
      { role: "system", content: SYSTEM_ROLE },
      { role: "user", content: prompt }
    ]
  })

  return response.choices[0].message.content || ""
}


/* ================= EXECUTAR AGENTE ================= */

export async function runLeadAgent(lead: any) {

  console.log("[AI] analisando lead")

  const classification = await classifyLead(lead)

  console.log("[AI] classificação:", classification)

  const strategy = defineStrategy(classification)

  const message = await generateFirstContact(lead, strategy)

  return {
    classification,
    strategy,
    message
  }
}