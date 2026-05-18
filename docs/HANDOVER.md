# Checklist de Handover — Classificado Pilates

Este documento guia a transferência técnica do projeto. Marque os itens à medida que avança.

## Status da entrega

**Já entregue no repositório:**

- Código-fonte completo e funcional
- 9 migrations versionadas e idempotentes
- 3 Edge Functions de WhatsApp (Deno)
- 4 templates de email com identidade da marca
- Playbook de deploy em Digital Ocean (`docs/DEPLOYMENT-DIGITALOCEAN.md`)
- Documentação de customização (`docs/customization.md`)
- Design system (`docs/visual-reference/`)
- Logos em PNG e SVG (`docs/logos/`)
- Type check passando (zero erros TypeScript)
- `.env.example` documentado com 7 variáveis

## Pré-requisitos do time técnico do cliente

Antes de começar, garantir que tem:

- [ ] Conta Digital Ocean ativa
- [ ] Conta Supabase ativa
- [ ] Acesso ao GitHub do repositório transferido
- [ ] Domínio registrado (ou subdomínio temporário para testes)
- [ ] Conhecimento de: Next.js, Docker, Linux, Postgres, RLS

## Fase 1 — Preparação local

- [ ] Clonar repositório
- [ ] Ler `README.md`
- [ ] Ler `docs/DEPLOYMENT-DIGITALOCEAN.md` na íntegra
- [ ] Instalar dependências: `pnpm install`
- [ ] Copiar `.env.example` → `.env.local`
- [ ] Rodar `pnpm dev` e confirmar que sobe (mesmo sem Supabase configurado, deve mostrar tela com erros conhecidos)

## Fase 2 — Provisionar Supabase

- [ ] Criar novo projeto Supabase
- [ ] Aplicar as 9 migrations em ordem (via CLI ou Studio):
  - [ ] `0001_initial.sql`
  - [ ] `0002_curation_admin_logs.sql`
  - [ ] `0003_dispatch_columns.sql`
  - [ ] `0004_visual_refresh.sql`
  - [ ] `0005_content_management.sql`
  - [ ] `0006_is_admin_function.sql`
  - [ ] `0007_site_customization.sql`
  - [ ] `0008_notifications.sql`
  - [ ] `0009_invited_admin_auto_promote.sql`
- [ ] Verificar que buckets `listing-images` e `site-assets` foram criados
- [ ] Configurar Site URL em Authentication → URL Configuration
- [ ] Adicionar Redirect URL: `https://<seu-dominio>/auth/callback`
- [ ] Aplicar os 4 templates de email (ver `supabase/email-templates/_base.md`)
- [ ] Deploy das 3 Edge Functions:
  ```bash
  supabase functions deploy check-whatsapp
  supabase functions deploy dispatch-whatsapp
  supabase functions deploy whatsapp-webhook --no-verify-jwt
  ```
- [ ] Configurar secrets das Edge Functions:
  ```bash
  supabase secrets set \
    EVOLUTION_API_URL=... \
    EVOLUTION_API_KEY=... \
    EVOLUTION_INSTANCE_NAME=...
  ```

## Fase 3 — Provisionar Digital Ocean

Seguir `docs/DEPLOYMENT-DIGITALOCEAN.md` passo a passo. Resumo:

- [ ] Criar Droplet (4GB RAM, Ubuntu 24.04)
- [ ] Configurar SSH e firewall
- [ ] Instalar Docker + Docker Compose
- [ ] Configurar DNS apontando para o Droplet
- [ ] Clonar repositório no Droplet
- [ ] Criar `.env` e `.env.evolution` (com credenciais do passo anterior)
- [ ] Criar `docker-compose.yml` e `Caddyfile` (templates no playbook)
- [ ] Subir stack: `docker compose up -d --build`
- [ ] Aguardar SSL (Caddy obtém automaticamente)
- [ ] Validar: site abre em `https://<seu-dominio>`

## Fase 4 — Conectar WhatsApp

- [ ] Acessar `/admin/conexao` no site
- [ ] Escanear QR Code com o celular dedicado da plataforma
- [ ] Confirmar status "Conectado" no painel
- [ ] Configurar webhook na Evolution:
  ```bash
  curl -X POST "https://<evolution-url>/webhook/set/<instance>" \
    -H "apikey: <EVOLUTION_API_KEY>" \
    -H "Content-Type: application/json" \
    -d '{
      "webhook": {
        "enabled": true,
        "url": "https://<supabase-ref>.supabase.co/functions/v1/whatsapp-webhook?apikey=<EVOLUTION_API_KEY>",
        "events": ["MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"]
      }
    }'
  ```

## Fase 5 — Promover primeiro admin

Após criar a primeira conta de usuário no site (via `/cadastro`):

```sql
-- No SQL Editor do Supabase:
INSERT INTO public.app_admins (user_id, created_by)
SELECT id, id FROM auth.users WHERE email = 'admin@seudominio.com';
```

- [ ] Confirmar acesso ao `/admin`

## Fase 6 — Smoke test end-to-end

- [ ] Criar anúncio teste pelo `/dashboard/novo`
- [ ] Aprovar pelo `/admin/anuncios`
- [ ] Anúncio aparece em `/` (público)
- [ ] Enviar lead pelo modal de contato (com WhatsApp real)
- [ ] WhatsApp do comprador recebe mensagem com dados do vendedor
- [ ] WhatsApp do vendedor recebe notificação do lead
- [ ] Lead aparece em `/admin/leads`
- [ ] Log do dispatch aparece em `/admin/logs/mensagens` com status `sent`

## Fase 7 — Personalização inicial

- [ ] `/admin/identidade` — upload de logo e tagline
- [ ] `/admin/tema` — ajustar cores se desejado
- [ ] `/admin/aparencia` — definir imagem e textos do hero
- [ ] `/admin/rodape` — preencher dados da empresa e redes sociais
- [ ] `/admin/paginas` — editar política de privacidade e termos de uso (recomendado consultoria jurídica)

## Pós-handover (responsabilidade do cliente)

- [ ] Rotacionar credenciais herdadas:
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → API → Reset)
  - [ ] `EVOLUTION_API_KEY` (regenerar no servidor Evolution)
  - [ ] Webhook signing secret (regenerar em `/admin/notificacoes`)
- [ ] Configurar GitHub branch protection em `main`
- [ ] Configurar GitHub Actions para `pnpm lint` e `pnpm type-check` em PRs (opcional)
- [ ] Configurar backup automático do Postgres do Evolution (cron tar.gz)
- [ ] Considerar SMTP customizado (Resend) quando o domínio próprio estiver pronto
- [ ] Considerar plano Supabase Pro ($25/mês) para backups automáticos e sem pause de inatividade

## Documentação de apoio

| Documento | Para quê |
|---|---|
| `README.md` | Visão geral e quick start |
| `docs/DEPLOYMENT-DIGITALOCEAN.md` | Playbook completo de deploy (875 linhas) |
| `docs/customization.md` | Personalização visual via painel admin |
| `docs/visual-reference/DESIGN.md` | Design system |
| `supabase/email-templates/_base.md` | Como aplicar templates de email |
| `.env.example` | Variáveis de ambiente documentadas |
