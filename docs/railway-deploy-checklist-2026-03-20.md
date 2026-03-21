# Railway Deploy Checklist

Guia completo de bootstrap para um servico novo: `docs/railway-bootstrap-2026-03-21.md`

## Estado atual

- Build da raiz passa com `npm run build`
- `railway.json` ja esta configurado para build + start
- O backend serve o frontend compilado em `dist/client`
- O login por perfil e as rotas protegidas ja estao funcionais

## Variaveis minimas no Railway

- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY` ou o par:
- `AI_INTEGRATIONS_OPENROUTER_BASE_URL`
- `AI_INTEGRATIONS_OPENROUTER_API_KEY`

## Variaveis recomendadas

- `SESSION_SECRET`
- `DEFAULT_PLAN_ID=pro`
- `APP_BASE_URL=https://<app>.up.railway.app`
- `NODE_ENV=production`
- `OPENAI_DEFAULT_MODEL=gpt-4o-mini`
- `OPENAI_HEAVY_MODEL=gpt-4o`
- `OPENROUTER_DEFAULT_MODEL=deepseek/deepseek-chat-v3.1`

## Checklist antes do deploy

1. Fazer login no Railway CLI com `railway login` ou `railway login --browserless`
2. Ligar este repo ao projeto com `railway link`
3. Confirmar as variaveis com `railway variables`
4. Fazer deploy com `railway up`

## Smoke test apos deploy

1. `GET /health`
2. `GET /api/plans`
3. `POST /api/auth/login`
4. `GET /api/auth/me`
5. `GET /api/leads`
6. Abrir `/` e validar o fluxo de login no frontend

## Alertas conhecidos

- O `.env.local` atual esta malformado e nao deve ser copiado para producao
- Sem `JWT_SECRET` ou `SESSION_SECRET`, a app usa segredo de fallback e isso nao e aceitavel para producao
- Sem credito/chave AI valida, o sistema cai corretamente para heuristica
