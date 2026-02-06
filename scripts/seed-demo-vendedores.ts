// scripts/seed-demo-vendedores.ts
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../server/db"; // se este import falhar, diz-me e ajusto já
import {
  customers,
  leads,
  automationSettings,
  messageTemplates,
  messageJobs,
  interactionHistory,
} from "../shared/schema";

function euro(n: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n);
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const LSB_ZONES = [
  "Campo de Ourique",
  "Areeiro",
  "Benfica",
  "Alcântara",
  "Telheiras",
  "Parque das Nações",
  "Alvalade",
  "Estrela",
  "Marvila",
  "Lumiar",
];

const TYPES = ["Apartamento", "Moradia"] as const;

const NAMES = [
  "Ana Ribeiro",
  "João Martins",
  "Sofia Almeida",
  "Miguel Santos",
  "Carla Ferreira",
  "Ricardo Oliveira",
  "Mariana Costa",
  "Tiago Lopes",
  "Inês Rodrigues",
  "Pedro Silva",
  "Beatriz Gomes",
  "Rui Carvalho",
  "Daniela Pereira",
  "André Sousa",
  "Patrícia Mendes",
];

async function main() {
  const demoEmail = process.env.DEMO_EMAIL;
  if (!demoEmail) {
    console.error("Falta DEMO_EMAIL. No PowerShell: $env:DEMO_EMAIL='teu@email'");
    process.exit(1);
  }

  // 1) buscar customer pelo email
  const cust = await db.query.customers.findFirst({
    where: eq(customers.email, demoEmail),
  });

  if (!cust) {
    console.error(`Não encontrei customer com email ${demoEmail}. Cria conta no site e tenta novamente.`);
    process.exit(1);
  }

  const customerId = cust.id;

  // 2) garantir template inicial
  const existingTpl = await db.query.messageTemplates.findFirst({
    where: eq(messageTemplates.category, "inicial"),
  });

  const tpl =
    existingTpl ??
    (
      await db
        .insert(messageTemplates)
        .values({
          name: "Mensagem Inicial - Vendedores (Demo)",
          subject: "Contacto sobre o anúncio",
          category: "inicial",
          content:
            "Olá, vi o seu anúncio de venda na sua zona.\nTrabalho com um consultor imobiliário com compradores ativos neste momento.\nFaz sentido falarmos?",
          variables: ["leadName", "propertyLocation", "propertyType", "propertyPrice"],
        })
        .returning()
    )[0];

  // 3) ativar automation settings (modo demo)
  // Upsert manual: se existir, update; senão insert
  const existingSettings = await db.query.automationSettings.findFirst({
    where: eq(automationSettings.customerId, customerId),
  });

  const settingsPayload = {
    enabled: true,
    searchEnabled: true,
    casafariEnabled: false,
    autoMessageNewLead: true,
    autoClassifyLeads: true,
    autoContactNewLeads: false, // IMPORTANT: não enviar automaticamente em canais reais na demo
    preferredChannel: "whatsapp",
    searchSources: ["Demo"], // na demo, origem controlada
    searchLocations: ["Lisboa"],
    searchPropertyTypes: ["Apartamento", "Moradia"],
    searchTransactionType: "sale",
    searchPriceMin: 300000,
    searchPriceMax: 900000,
    searchMinScore: 40,
    updatedAt: new Date(),
  } as any;

  if (existingSettings) {
    await db.update(automationSettings).set(settingsPayload).where(eq(automationSettings.customerId, customerId));
  } else {
    await db.insert(automationSettings).values({
      customerId,
      ...settingsPayload,
      createdAt: new Date(),
    } as any);
  }

  // 4) criar leads realistas (Demo)
  const now = new Date();
  const rows = [];
  for (let i = 0; i < 15; i++) {
    const priceNum = 300000 + Math.floor(Math.random() * 450000); // 300k-750k
    const zone = pick(LSB_ZONES);
    const type = pick([...TYPES]);
    const name = NAMES[i % NAMES.length];
    const title =
      type === "Apartamento"
        ? `T${pick([2, 3, 4])} em ${zone}`
        : `Moradia T${pick([3, 4, 5])} em ${zone}`;

    // score determinístico (mas realista)
    let score = 45;
    if (priceNum >= 450000) score += 10;
    if (["Campo de Ourique", "Areeiro", "Alvalade", "Estrela", "Parque das Nações"].includes(zone)) score += 15;
    score += Math.floor(Math.random() * 15);
    if (score > 95) score = 95;

    const status = score >= 70 ? "quente" : score >= 50 ? "morno" : "frio";

    rows.push({
      name,
      property: title,
      propertyType: type,
      location: `Lisboa - ${zone}`,
      price: euro(priceNum),
      status,
      qualification: "pendente_visita",
      ownerType: "particular",
      source: "Demo",
      sourceUrl: `https://demo.imoleadaipro.com/anuncio/${i + 1}`,
      contact: `+351 9${Math.floor(10000000 + Math.random() * 89999999)}`,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@exemplo.pt`,
      aiScore: score,
      aiReasoning: `Lead ${status}. Zona ${zone} e faixa de preço ${euro(priceNum)} sugerem bom potencial de conversão.`,
      customerId,
      createdAt: now,
      updatedAt: now,
      lastContact: now,
    });
  }

  const inserted = await db.insert(leads).values(rows as any).returning();

  // 5) criar jobs de mensagem (pendente) + interação “sent” (para mostrar atividade)
  for (const lead of inserted) {
    // job pendente (para a demo mostrar automação sem disparar WhatsApp real)
    await db.insert(messageJobs).values({
      customerId,
      leadId: lead.id,
      channel: "whatsapp",
      templateId: tpl.id,
      subject: tpl.subject ?? null,
      content: tpl.content,
      status: "pending",
      trigger: "new_lead",
      scheduledAt: new Date(Date.now() + 60 * 1000), // 1 minuto
      metadata: { demo: true },
      createdAt: new Date(),
    } as any);

    await db.insert(interactionHistory).values({
      leadId: lead.id,
      type: "note",
      content: "Lead criado em modo DEMO. Classificação IA gerada e mensagem inicial agendada.",
      metadata: { demo: true },
      createdAt: new Date(),
    } as any);
  }

  console.log(`✅ Seed concluído: ${inserted.length} leads (Lisboa, venda) para customer ${demoEmail}`);
  console.log("👉 Abre o CRM e filtra por Source = Demo para a demo ficar limpa.");
}

main().catch((e) => {
  console.error("❌ Erro no seed:", e);
  process.exit(1);
});
