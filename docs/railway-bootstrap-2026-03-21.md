# Railway Bootstrap 2026-03-21

## Objetivo

Subir um servico Railway novo para o ImoLead AI Pro com Postgres ligado logo na primeira subida, sem depender de ajustes manuais no codigo.

## Pressupostos

- Estas na raiz do projeto `c:\dev\ImoLeadAIPro`
- Vais criar um servico web chamado `imo-lead-ai-pro`
- Vais criar um Postgres chamado `postgres`
- Estas a usar PowerShell

## Sequencia recomendada

1. Autenticar no Railway
2. Criar projeto novo
3. Criar Postgres com nome fixo
4. Criar o servico web
5. Ligar as variaveis do servico ao Postgres
6. Fazer o primeiro deploy
7. Gerar dominio
8. Correr smoke test

## Comandos

```powershell
railway login
railway init -n ImoLeadAIPro
railway add --database postgres --service postgres
railway add --service imo-lead-ai-pro
railway link --service imo-lead-ai-pro
```

## Variaveis minimas do servico web

Importante:
- usa aspas simples em PowerShell para preservar `${{...}}`
- se o teu servico de base de dados tiver outro nome, troca `postgres` no `DATABASE_URL`

```powershell
railway variables --service imo-lead-ai-pro `
  --skip-deploys `
  --set 'DATABASE_URL=${{postgres.DATABASE_URL}}' `
  --set 'JWT_SECRET=troca_isto_por_um_segredo_longo_e_aleatorio' `
  --set 'SESSION_SECRET=troca_isto_por_um_segredo_longo_e_aleatorio' `
  --set 'NODE_ENV=production' `
  --set 'DEFAULT_PLAN_ID=pro' `
  --set 'OPENAI_DEFAULT_MODEL=gpt-4o-mini' `
  --set 'OPENAI_HEAVY_MODEL=gpt-4o-mini'
```

## AI provider

### OpenAI direta

```powershell
railway variables --service imo-lead-ai-pro `
  --skip-deploys `
  --set 'OPENAI_API_KEY=sk-...'
```

### OpenRouter

```powershell
railway variables --service imo-lead-ai-pro `
  --skip-deploys `
  --set 'AI_INTEGRATIONS_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1' `
  --set 'AI_INTEGRATIONS_OPENROUTER_API_KEY=sk-or-...'
```

## Deploy

```powershell
railway up --service imo-lead-ai-pro
railway domain --service imo-lead-ai-pro
```

Depois de gerares o dominio `*.up.railway.app`, grava-o:

```powershell
railway variables --service imo-lead-ai-pro `
  --skip-deploys `
  --set 'APP_BASE_URL=https://SUBSTITUIR_PELO_DOMINIO.up.railway.app'
```

## Healthcheck recomendado

No painel do Railway, define o healthcheck path como:

```text
/health
```

## Smoke test rapido

Substitui `https://SUBSTITUIR_PELO_DOMINIO.up.railway.app` pelo dominio real.

```powershell
$base = 'https://SUBSTITUIR_PELO_DOMINIO.up.railway.app'

Invoke-RestMethod "$base/health"
Invoke-RestMethod "$base/api/plans"

$login = Invoke-RestMethod `
  -Uri "$base/api/auth/login" `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"email":"carla@imolead.ai","password":"Demo123!"}'

$token = $login.token

Invoke-RestMethod `
  -Uri "$base/api/auth/me" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod `
  -Uri "$base/api/leads" `
  -Headers @{ Authorization = "Bearer $token" }
```

## O que o codigo ja faz sozinho

- Escuta em `process.env.PORT`
- Serve o frontend compilado em `dist/client`
- Cria as tabelas `customers`, `workspace_users` e `leads` automaticamente
- Faz seed dos utilizadores demo
- Faz seed dos leads demo
- Cai para memoria se a base falhar
- Trata hosts internos `*.railway.internal` sem forcar SSL indevido

## Se algo falhar

Ver primeiro:

```powershell
railway variables --service imo-lead-ai-pro
```

Depois:

```powershell
railway logs --service imo-lead-ai-pro --lines 150
```

Procura estas mensagens:
- `Storage ready: PostgreSQL connected and migrations applied.`
- `Storage fallback active: database configured but unavailable, using memory.`
- `Server running on port`
