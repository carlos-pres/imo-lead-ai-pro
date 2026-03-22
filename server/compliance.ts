export const LEGAL_POLICY_VERSION = "2026-03-21";

export function getPrivacyContactEmail() {
  const configured = process.env.PRIVACY_CONTACT_EMAIL || process.env.ADMIN_CONTACT_EMAIL;
  const normalized = configured?.trim();
  return normalized || "carlospsantos19820@gmail.com";
}

export function getComplianceSummary() {
  return {
    policyVersion: LEGAL_POLICY_VERSION,
    privacyContactEmail: getPrivacyContactEmail(),
    dataUseSummary:
      "Tratamos dados de contacto e operacionais para autenticar utilizadores, gerir trials, operar leads e gerar analise comercial.",
    aiUseSummary:
      "Quando o plano inclui IA avancada, alguns dados do lead podem ser enviados a fornecedores externos de IA para classificacao, recomendacao e redacao assistida.",
    retentionSummary:
      "Os pedidos de trial e registos operacionais sao mantidos apenas pelo tempo necessario para avaliacao comercial, execucao contratual e cumprimento legal.",
  };
}
