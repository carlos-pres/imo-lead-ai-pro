import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/* ================= SISTEMA ================= */

const SYSTEM_ROLE = `
Você é um especialista em prospecção imobiliária na Europa.

Seu papel é ajudar uma imobiliária moderna a:

- identificar oportunidades
- qualificar proprietários
- iniciar conversas profissionais
- converter leads em visitas

Mercados principais:
Portugal, Espanha e França.

Você escreve mensagens humanas, naturais
e profissionais para proprietários.

Objetivo final: gerar uma visita.
`

/* ================= FILTRO DE QUALIDADE ================= */

function validateLead(lead: any) {

  if (!lead) return false

  if (!lead.price) return false
  if (!lead.property) return false
  if (!lead.location) return false

  return true
}

/* ================= CLASSIFICAR LEAD ================= */

export async function classifyLead(lead: any): Promise<string> {

  const prompt = `
Analise o lead abaixo e classifique como:

quente
morno
frio

Considere:

- preço competitivo
- localização
- comportamento do anúncio
- probabilidade de venda

Lead:
${JSON.stringify(lead)}

Responda apenas com uma palavra.
`

  try {

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: SYSTEM_ROLE },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })

    const result =
      response.choices[0].message.content?.toLowerCase().trim() || "frio"

    return result

  } catch (error) {

    console.log("[AI] erro classificação")

    return "frio"
  }
}

/* ================= DEFINIR ESTRATÉGIA ================= */

function defineStrategy(classification: string) {

  if (classification === "quente") {

    return {
      goal: "marcar visita rapidamente",
      tone: "profissional direto"
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

export async function generateFirstContact(
  lead: any,
  strategy: any
): Promise<string> {

  const prompt = `
Objetivo da conversa: ${strategy.goal}

Tom da conversa: ${strategy.tone}

Dados do imóvel:
${JSON.stringify(lead)}

Crie uma primeira mensagem curta para o proprietário.

A mensagem deve:

- parecer humana
- ser profissional
- incentivar resposta
`

  try {

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: SYSTEM_ROLE },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    })

    return response.choices[0].message.content || ""

  } catch (error) {

    console.log("[AI] erro geração mensagem")

    return ""
  }
}

/* ================= EXECUTAR AGENTE ================= */

export async function runLeadAgent(lead: any) {

  console.log("[AI] analisando lead")

  if (!validateLead(lead)) {

    console.log("[AI] descartado pelo filtro")

    return {
      classification: "frio",
      goal: "dados incompletos",
      message: ""
    }

  }

  const classification = await classifyLead(lead)

  console.log("[AI] classificação:", classification)

  const strategy = defineStrategy(classification)

  let message = ""

  if (classification !== "frio") {

    message = await generateFirstContact(lead, strategy)

  }

  return {
    classification,
    strategy,
    message
  }
}
/* ================= TESTE LOCAL ================= */

async function testAgent() {

  const lead = {
    property: "Apartamento T2",
    price: "320000",
    location: "Lisboa",
    source: "idealista",
    description: "Apartamento T2 renovado no centro de Lisboa"
  }

  const result = await runLeadAgent(lead)

  console.log("----------- TESTE AGENTE -----------")
  console.log(result)
  console.log("------------------------------------")

}

/* executa teste apenas se rodar este ficheiro diretamente */

if (process.argv[1] && process.argv[1].includes("agentService")) {
  testAgent()
}