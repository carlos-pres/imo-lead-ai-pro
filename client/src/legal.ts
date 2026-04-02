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
    title: "Política de Privacidade e tratamento de dados",
    summary:
      "Tratamos apenas os dados necessários para autenticar utilizadores, gerir pedidos de trial, operar leads e suportar a relação comercial.",
    bullets: [
      "Recolhemos nome, email, telefone e dados operacionais introduzidos na plataforma.",
      "Os dados são usados para execução do serviço, análise comercial, suporte e obrigações legais.",
      "Os pedidos de acesso, retificação, apagamento ou oposição podem ser feitos por email para o contacto RGPD.",
      "Não vendemos bases de dados nem prometemos volumes garantidos de leads.",
    ],
  },
  {
    id: "legal-terms",
    eyebrow: "Termos",
    title: "Termos de Utilização e limites da oferta",
    summary:
      "Os planos representam capacidade operacional e funcionalidade incluída, não garantia de captação de leads ou resultados comerciais.",
    bullets: [
      "Starter, Pro e Enterprise limitam funcionalidades, utilizadores e geografias conforme a oferta ativa.",
      "Os trials são únicos por email e telefone e podem ser recusados em caso de abuso.",
      "As contas não podem ser usadas para atividade ilícita, scraping abusivo ou tentativa de contorno dos limites do produto.",
      "A operação enterprise pode exigir onboarding, configuração e proposta comercial específica.",
    ],
  },
  {
    id: "legal-ai",
    eyebrow: "Uso de IA",
    title: "Uso de IA, recomendações e supervisão humana",
    summary:
      "Quando o plano inclui IA avançada, parte dos dados do lead pode ser processada por fornecedores externos de IA para classificação, recomendações e redação assistida.",
    bullets: [
      "As recomendações do agente apoiam a decisão comercial, mas não substituem validação humana.",
      "Podem ser processados dados como localização, fonte, faixa de preço, notas e contexto operacional do lead.",
      "Se a IA externa estiver indisponível, o sistema recorre a heurísticas internas para continuidade de serviço.",
      "A equipa cliente continua responsável pela revisão de mensagens, contactos e decisões comerciais finais.",
    ],
  },
  {
    id: "legal-security",
    eyebrow: "Segurança & RGPD",
    title: "Segurança da informação e conformidade RGPD",
    summary:
      "Protegemos dados com TLS, encriptação em repouso no fornecedor cloud e segregação de ambientes. Seguimos o princípio de minimização e honramos direitos dos titulares.",
    bullets: [
      "Tráfego protegido por HTTPS/TLS; bases de dados com encriptação em repouso no fornecedor cloud.",
      "Acesso restrito por função; credenciais sensíveis em variáveis de ambiente, não em código.",
      "Minimização: só pedimos dados necessários para operar leads, trials e faturação.",
      "Direitos RGPD (acesso, apagamento, portabilidade, oposição) podem ser exercidos via contacto RGPD.",
    ],
  },
];
