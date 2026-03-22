export const LEGAL_POLICY_VERSION = "2026-03-21";
export const PRIVACY_CONTACT_EMAIL =
  import.meta.env.VITE_PRIVACY_CONTACT_EMAIL || "carlospsantos19820@gmail.com";

export type LegalSection = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
};

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    id: "legal-privacy",
    eyebrow: "Privacidade",
    title: "Politica de Privacidade e tratamento de dados",
    summary:
      "Tratamos apenas os dados necessarios para autenticar utilizadores, gerir pedidos de trial, operar leads e suportar a relacao comercial.",
    bullets: [
      "Recolhemos nome, email, telefone e dados operacionais introduzidos na plataforma.",
      "Os dados sao usados para execucao do servico, analise comercial, suporte e obrigacoes legais.",
      "Os pedidos de acesso, retificacao, apagamento ou oposicao podem ser feitos por email para o contacto RGPD.",
      "Nao vendemos bases de dados nem prometemos volumes garantidos de leads.",
    ],
  },
  {
    id: "legal-terms",
    eyebrow: "Termos",
    title: "Termos de Utilizacao e limites da oferta",
    summary:
      "Os planos representam capacidade operacional e funcionalidade incluida, nao garantia de captacao de leads ou resultados comerciais.",
    bullets: [
      "Starter, Pro e Enterprise limitam funcionalidades, utilizadores e geografias conforme a oferta ativa.",
      "Os trials sao unicos por email e telefone e podem ser recusados em caso de abuso.",
      "As contas nao podem ser usadas para atividade ilicita, scraping abusivo ou tentativa de contorno dos limites do produto.",
      "A operacao enterprise pode exigir onboarding, configuracao e proposta comercial especifica.",
    ],
  },
  {
    id: "legal-ai",
    eyebrow: "Uso de IA",
    title: "Uso de IA, recomendacoes e supervisao humana",
    summary:
      "Quando o plano inclui IA avancada, parte dos dados do lead pode ser processada por fornecedores externos de IA para classificacao, recomendacoes e redacao assistida.",
    bullets: [
      "As recomendacoes do agente apoiam a decisao comercial, mas nao substituem validacao humana.",
      "Podem ser processados dados como localizacao, fonte, faixa de preco, notas e contexto operacional do lead.",
      "Se a IA externa estiver indisponivel, o sistema recorre a heuristicas internas para continuidade de servico.",
      "A equipa cliente continua responsavel pela revisao de mensagens, contactos e decisoes comerciais finais.",
    ],
  },
];
