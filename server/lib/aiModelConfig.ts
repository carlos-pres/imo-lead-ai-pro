const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-chat-v3.1";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OPENAI_HEAVY_MODEL = "gpt-4o";

export function getOpenRouterDefaultModel() {
  return process.env.OPENROUTER_DEFAULT_MODEL || DEFAULT_OPENROUTER_MODEL;
}

export function getOpenAIDefaultModel() {
  return process.env.OPENAI_DEFAULT_MODEL || DEFAULT_OPENAI_MODEL;
}

export function getOpenAIHeavyModel() {
  return process.env.OPENAI_HEAVY_MODEL || DEFAULT_OPENAI_HEAVY_MODEL;
}

export function getPreferredChatModel(options?: {
  useOpenRouter?: boolean;
  preferHeavy?: boolean;
}) {
  if (options?.useOpenRouter) {
    return getOpenRouterDefaultModel();
  }

  if (options?.preferHeavy) {
    return getOpenAIHeavyModel();
  }

  return getOpenAIDefaultModel();
}
