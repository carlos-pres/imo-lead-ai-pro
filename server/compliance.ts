export const LEGAL_POLICY_VERSION = "2026-03-21";

export function getPrivacyContactEmail() {
  const configured = process.env.PRIVACY_CONTACT_EMAIL || process.env.ADMIN_CONTACT_EMAIL;
  const normalized = configured?.trim();
  return normalized || "privacidade@imolead.ai";
}

export function getComplianceSummary() {
  return {
    policyVersion: LEGAL_POLICY_VERSION,
    privacyContactEmail: getPrivacyContactEmail(),
    dataUseSummary:
      "Tratamos dados de contacto e operacionais para autenticar utilizadores, gerir trials, operar leads e gerar análise comercial.",
    aiUseSummary:
      "Quando o plano inclui IA avançada, alguns dados do lead podem ser enviados a fornecedores externos de IA para classificação, recomendação e redação assistida.",
    retentionSummary:
      "Os pedidos de trial e registos operacionais são mantidos apenas pelo tempo necessário para avaliação comercial, execução contratual e cumprimento legal.",
  };
}
