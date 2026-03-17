import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 OpenAI seguro (não quebra se faltar chave)
let client = null;

if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn("⚠️ OPENAI_API_KEY não definida");
}

// 🔥 Porta dinâmica (Railway obrigatório)
const PORT = process.env.PORT || 5000;

/**
 * 🧠 Função: analisar lead com IA
 */
async function analyzeLeadWithAI(lead) {
  try {
    if (!client) return "IA indisponível";

    const prompt = `
Analisa este imóvel como um especialista imobiliário:

Tipo: ${lead.title}
Localização: ${lead.location}
Preço: ${lead.price}€

Responde com:
- Pontuação de 0 a 100
- Se é um bom investimento
- Justificação curta
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    return response.output[0].content[0].text;
  } catch (error) {
    console.error("Erro ao analisar lead:", error);
    return "Erro na análise";
  }
}

/**
 * 🔹 Rota base (health check)
 */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "ImoLead AI Pro",
    version: "2.0.0",
  });
});

/**
 * 🔥 Rota: leads com análise IA
 */
app.get("/api/leads", async (req, res) => {
  try {
    const leads = [
      {
        id: 1,
        title: "T2 Lisboa Centro",
        price: 250000,
        location: "Lisboa",
      },
      {
        id: 2,
        title: "T1 Cascais Vista Mar",
        price: 320000,
        location: "Cascais",
      },
      {
        id: 3,
        title: "T3 Sintra Espaçoso",
        price: 210000,
        location: "Sintra",
      },
    ];

    const analyzedLeads = await Promise.all(
      leads.map(async (lead) => {
        const analysis = await analyzeLeadWithAI(lead);

        return {
          ...lead,
          analysis,
        };
      })
    );

    res.json(analyzedLeads);
  } catch (error) {
    console.error("Erro geral:", error);
    res.status(500).json({ error: "Erro ao buscar leads" });
  }
});

/**
 * 🤖 Rota IA livre (teste)
 */
app.post("/api/ai", async (req, res) => {
  try {
    if (!client) {
      return res.status(500).json({ error: "IA não configurada" });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt é obrigatório" });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    res.json({
      result: response.output[0].content[0].text,
    });
  } catch (error) {
    console.error("Erro IA:", error);
    res.status(500).json({ error: "Erro na IA" });
  }
});

/**
 * 🚀 Start servidor (Railway OK)
 */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ImoLead AI Pro rodando na porta ${PORT}`);
});