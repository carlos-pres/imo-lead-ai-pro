import { runLeadAgent } from "./ai/agentService";

async function main() {
  await runLeadAgent({
    name: "Lead Teste",
    property: "Apartamento T2",
    price: 320000,
    location: "Lisboa",
    source: "idealista",
    contact: "teste@example.com",
    notes: "Lead local para validar score, desk e recomendacao.",
  });
}

main();
