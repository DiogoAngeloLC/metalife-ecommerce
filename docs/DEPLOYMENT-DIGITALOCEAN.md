# Deploy — Digital Ocean (Droplet único)

Playbook completo para subir o Classificado Pilates do zero em um Droplet da Digital Ocean com Supabase Cloud e Evolution API self-hosted.

---

## Arquitetura

```
                            ┌─────────────────────────────────┐
                            │   Digital Ocean Droplet (4GB)    │
                            │                                  │
   Cliente ──HTTPS──────────│──> Caddy (reverse proxy + SSL)   │
                            │       │                          │
                            │       ├─> Next.js (Docker :3000) │
                            │       │                          │
                            │       └─> Evolution (Docker :8080)│
                            │              │                   │
                            │              └─> Postgres        │
                            │                  (interno docker)│
                            └─────────────────────────────────┘
                                          │
                                          ├──> Supabase Cloud
                                          │    (Postgres + Auth + Storage + Edge Fns)
                                          │
                                          └──> WhatsApp Web
```

**Serviços no Droplet (via Docker Compose):**

| Container | Função |
|---|---|
| **Caddy** | Reverse proxy + HTTPS automático (Let's Encrypt) |
| **Next.js** | Aplicação web (build standalone em Node.js) |
| **Evolution API** | Gateway WhatsApp (conecta via Baileys) |
| **Postgres** | Banco interno do Evolution (não é o Supabase) |
| **Redis** | Cache e fila do Evolution |

**Serviços externos:**

| Serviço | Função |
|---|---|
| **Supabase Cloud** | Banco principal, Auth, Storage, Edge Functions |
| **WhatsApp Web** | Pareamento via QR Code no celular dedicado |

---

## Pré-requisitos

Antes de começar, o time precisa ter:

- [ ] Conta na [Digital Ocean](https://cloud.digitalocean.com)
- [ ] Conta no [Supabase](https://supabase.com) (projeto novo ou existente)
- [ ] Domínio registrado (ex: `classificadopilates.com.br`)
- [ ] Chave SSH local (`ssh-keygen -t ed25519` se não tiver)
- [ ] Conhecimento básico de Linux e Docker
- [ ] Acesso ao repositório Git do projeto

---

## 1. Provisionamento do Droplet

### 1.1 Criar o Droplet no painel Digital Ocean

1. Acesse **Create → Droplets**
2. Configure:
   - **Image:** Ubuntu 24.04 LTS
   - **Plan:** Basic Regular — **4GB RAM / 2 vCPU / 80GB SSD** ($24/mês)
   - **Region:** NYC1, AMS3 ou GRU1 (mais próximo do público-alvo)
   - **Authentication:** adicione sua chave SSH
   - **Hostname:** `classificado-pilates-prod`
3. Clique em **Create Droplet**
4. Anote o IP público (ex: `164.90.123.45`)

> **Por que 4GB?** O build do Next.js consome bastante memória. Com 2GB, o build pode falhar por falta de RAM.

### 1.2 Primeiro acesso e setup básico

```bash
# Conectar como root
ssh root@<DROPLET_IP>

# Atualizar pacotes
apt update && apt upgrade -y

# Instalar Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Verificar instalação
docker --version
docker compose version
```

### 1.3 Criar usuário não-root

Nunca rode a aplicação como root. Crie o usuário `deploy`:

```bash
# Criar usuário
adduser deploy
# (defina uma senha forte quando solicitado)

# Dar acesso ao Docker e sudo
usermod -aG docker deploy
usermod -aG sudo deploy

# Copiar chave SSH pro novo usuário
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

### 1.4 Configurar firewall

```bash
ufw allow OpenSSH
ufw allow http
ufw allow https
ufw enable
# Confirme com 'y'

# Verificar
ufw status
```

### 1.5 Trocar para o usuário deploy

```bash
# Sair do root
exit

# Reconectar como deploy
ssh deploy@<DROPLET_IP>
```

A partir daqui, **todos os comandos são como `deploy`**.

---

## 2. Estrutura de pastas no servidor

```bash
mkdir -p ~/apps/classificado-pilates
cd ~/apps/classificado-pilates
```

Estrutura final após setup:

```
~/apps/classificado-pilates/
├── docker-compose.yml       ← orquestra todos os containers
├── Caddyfile                ← reverse proxy + SSL automático
├── .env                     ← variáveis do Next.js (NÃO commitar)
├── .env.evolution           ← variáveis do Evolution (NÃO commitar)
├── nextjs/                  ← código clonado do repositório
└── evolution-data/          ← dados persistentes do Evolution
    ├── instances/
    └── store/
```

---

## 3. Clone do repositório

```bash
cd ~/apps/classificado-pilates
git clone <URL_DO_REPOSITORIO> nextjs
cd nextjs
```

> **Nota:** O repositório já inclui o `Dockerfile` e `.dockerignore` na raiz.

> **Dev local no Windows:** O `output: 'standalone'` no `next.config.mjs` pode causar erro de symlink ao rodar `pnpm build` no Windows/OneDrive. Isso **não afeta** o build dentro do Docker (Linux). Para dev local, rode `pnpm dev` normalmente — o standalone só é necessário no build de produção.

---

## 4. Gerar senhas

Antes de criar os arquivos `.env`, gere 3 senhas únicas:

```bash
# Senha do Postgres do Evolution
openssl rand -hex 32
# Exemplo: a1b2c3d4e5f6...  (copie e guarde)

# Senha do Redis do Evolution
openssl rand -hex 32
# Exemplo: f6e5d4c3b2a1...  (copie e guarde)

# API Key do Evolution
openssl rand -hex 32
# Exemplo: 9z8y7x6w5v4u...  (copie e guarde)
```

---

## 5. Arquivos de configuração

### 5.1 docker-compose.yml

Crie `~/apps/classificado-pilates/docker-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2.8-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - nextjs
      - evolution
    networks:
      - app-network

  nextjs:
    build:
      context: ./nextjs
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - .env
    expose:
      - "3000"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  evolution:
    image: atendai/evolution-api:v2.2.3
    restart: unless-stopped
    env_file:
      - .env.evolution
    expose:
      - "8080"
    volumes:
      - ./evolution-data/instances:/evolution/instances
      - ./evolution-data/store:/evolution/store
    depends_on:
      - evolution-postgres
      - evolution-redis
    networks:
      - app-network

  evolution-postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: ${EVOLUTION_DB_PASSWORD}
      POSTGRES_DB: evolution
    volumes:
      - evolution_db:/var/lib/postgresql/data
    networks:
      - app-network

  evolution-redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${EVOLUTION_REDIS_PASSWORD}
    volumes:
      - evolution_redis:/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
  evolution_db:
  evolution_redis:
```

> **Sobre tags de imagem:** Usamos versões fixas (`caddy:2.8-alpine`, `postgres:16-alpine`, `redis:7-alpine`, `atendai/evolution-api:v2.2.3`) para evitar quebras inesperadas em produção. Ao atualizar, teste a nova versão antes de trocar a tag.

### 5.2 Caddyfile

Crie `~/apps/classificado-pilates/Caddyfile`:

Substitua `classificadopilates.com.br` e `wa.classificadopilates.com.br` pelos seus domínios reais.

```
classificadopilates.com.br {
    reverse_proxy nextjs:3000
    encode gzip

    header {
        Strict-Transport-Security "max-age=31536000;"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}

www.classificadopilates.com.br {
    redir https://classificadopilates.com.br{uri} permanent
}

wa.classificadopilates.com.br {
    reverse_proxy evolution:8080
    encode gzip
}
```

> **Caddy obtém certificados SSL automaticamente** via Let's Encrypt. Não é preciso configurar nada. Basta que o DNS esteja apontando pro Droplet e as portas 80/443 estejam abertas.

### 5.3 .env (Next.js)

Crie `~/apps/classificado-pilates/.env`:

```bash
# =============================================
# Supabase — do projeto do cliente
# (encontre no painel: Settings → API)
# =============================================
NEXT_PUBLIC_SUPABASE_URL=https://<SEU_PROJETO>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...cole-a-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=eyJ...cole-a-service-role-key-aqui

# =============================================
# Site
# =============================================
NEXT_PUBLIC_SITE_URL=https://classificadopilates.com.br

# =============================================
# Evolution API — comunicação interna entre containers
# =============================================
EVOLUTION_API_URL=http://evolution:8080
EVOLUTION_API_KEY=<COLE_A_API_KEY_GERADA_NO_PASSO_4>
EVOLUTION_INSTANCE_NAME=classificado-pilates

# =============================================
# Senhas internas (usadas pelo docker-compose)
# =============================================
EVOLUTION_DB_PASSWORD=<COLE_A_SENHA_POSTGRES_GERADA_NO_PASSO_4>
EVOLUTION_REDIS_PASSWORD=<COLE_A_SENHA_REDIS_GERADA_NO_PASSO_4>
```

### 5.4 .env.evolution

Crie `~/apps/classificado-pilates/.env.evolution`:

```bash
# =============================================
# Server
# =============================================
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=https://wa.classificadopilates.com.br

# =============================================
# Auth
# =============================================
AUTHENTICATION_API_KEY=<MESMA_API_KEY_DO_.ENV>
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# =============================================
# Database (Postgres interno — NÃO é o Supabase)
# =============================================
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:<SENHA_POSTGRES_GERADA>@evolution-postgres:5432/evolution
DATABASE_CONNECTION_CLIENT_NAME=evolution_exchange

# =============================================
# Redis (cache + fila)
# =============================================
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://default:<SENHA_REDIS_GERADA>@evolution-redis:6379
CACHE_REDIS_PREFIX_KEY=evolution

# =============================================
# WhatsApp
# =============================================
CONFIG_SESSION_PHONE_CLIENT=Classificado Pilates
CONFIG_SESSION_PHONE_NAME=Chrome
DEL_INSTANCE=false

# =============================================
# Webhook (configurado depois via API)
# =============================================
WEBHOOK_GLOBAL_URL=
WEBHOOK_GLOBAL_ENABLED=false
WEBHOOK_EVENTS_MESSAGES_UPDATE=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_QRCODE_UPDATED=true

# =============================================
# Limites e logs
# =============================================
QRCODE_LIMIT=30
LOG_LEVEL=ERROR,WARN,INFO
LANGUAGE=pt-BR
```

---

## 6. Configurar DNS

No registrador do domínio, crie estes registros **A** apontando pro IP do Droplet:

| Registro | Tipo | Valor |
|---|---|---|
| `classificadopilates.com.br` | A | `<DROPLET_IP>` |
| `www.classificadopilates.com.br` | A | `<DROPLET_IP>` |
| `wa.classificadopilates.com.br` | A | `<DROPLET_IP>` |

Aguarde a propagação (5 min a 1 hora). Verifique:

```bash
dig classificadopilates.com.br +short
# Deve retornar o IP do Droplet

dig wa.classificadopilates.com.br +short
# Mesmo IP
```

> **Importante:** O Caddy só consegue obter o certificado SSL se o DNS já estiver apontando corretamente. Não suba os containers antes do DNS propagar.

---

## 7. Primeiro deploy

```bash
cd ~/apps/classificado-pilates

# Criar pasta de dados do Evolution
mkdir -p evolution-data/instances evolution-data/store

# Subir todos os containers
docker compose up -d --build

# Acompanhar logs em tempo real
docker compose logs -f
```

O que esperar:

1. **Caddy** — obtém certificados SSL automaticamente (~1 min)
2. **Postgres + Redis** — sobem em ~5s
3. **Evolution** — conecta no Postgres e Redis (~10s após eles subirem)
4. **Next.js** — build + start (~1-3 min na primeira vez)

### Validação rápida

```bash
# Verificar que todos os containers estão rodando
docker compose ps

# Deve mostrar 5 containers com status "Up" ou "healthy"
```

Teste no navegador:

- `https://classificadopilates.com.br` → site carrega
- `https://wa.classificadopilates.com.br` → Evolution responde

---

## 8. Configurar Supabase

### 8.1 URL Configuration (Auth)

No painel do Supabase: **Authentication → URL Configuration**

- **Site URL:** `https://classificadopilates.com.br`
- **Redirect URLs:** adicione:
  - `https://classificadopilates.com.br/auth/callback`
  - `http://localhost:3000/auth/callback` (para dev local do time)

### 8.2 Aplicar migrations

**Opção A — via Supabase CLI (recomendado):**

Na máquina do desenvolvedor:

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Linkar ao projeto
supabase link --project-ref <REF_DO_PROJETO>

# Aplicar todas as migrations
supabase db push
```

**Opção B — via Supabase Studio (UI):**

1. Abra o SQL Editor no painel do Supabase
2. Cole e execute cada arquivo `.sql` da pasta `supabase/migrations/` em ordem cronológica

### 8.3 Deploy das Edge Functions

```bash
supabase functions deploy dispatch-whatsapp
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy check-whatsapp
```

### 8.4 Secrets das Edge Functions

```bash
supabase secrets set \
  EVOLUTION_API_URL=https://wa.classificadopilates.com.br \
  EVOLUTION_API_KEY=<MESMA_API_KEY_DO_.ENV> \
  EVOLUTION_INSTANCE_NAME=classificado-pilates
```

### 8.5 Buckets de Storage

Os buckets `listing-images` e `site-assets` já são criados pelas migrations. Verifique no painel: **Storage** → devem existir ambos como públicos.

### 8.6 Email Templates

No painel do Supabase: **Authentication → Email Templates**

Cole os 4 HTMLs da pasta `supabase/email-templates/` nos respectivos campos:
- Confirm signup
- Magic Link
- Change Email Address
- Reset Password

### 8.7 Criar primeiro admin

O usuário precisa primeiro criar conta no app (via `/cadastro` ou Magic Link).

Depois, no SQL Editor do Supabase:

```sql
INSERT INTO public.app_admins (user_id, created_by)
SELECT id, id FROM auth.users WHERE email = 'admin@seudominio.com.br';
```

---

## 9. Configurar Evolution (WhatsApp)

### 9.1 Criar instância

```bash
curl -X POST "https://wa.classificadopilates.com.br/instance/create" \
  -H "apikey: <EVOLUTION_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "classificado-pilates",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### 9.2 Parear com WhatsApp

Acesse `https://classificadopilates.com.br/admin/conexao` no navegador → escaneie o QR Code com o celular dedicado ao WhatsApp Business.

### 9.3 Configurar webhook reverso

Este webhook faz o Evolution enviar eventos (mensagem entregue, lida etc.) de volta pro Supabase:

```bash
curl -X POST "https://wa.classificadopilates.com.br/webhook/set/classificado-pilates" \
  -H "apikey: <EVOLUTION_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "https://<REF_SUPABASE>.supabase.co/functions/v1/whatsapp-webhook?apikey=<EVOLUTION_API_KEY>",
      "webhookByEvents": false,
      "events": ["MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"]
    }
  }'
```

Substitua `<REF_SUPABASE>` pela referência do seu projeto Supabase.

---

## 10. Smoke test — checklist de produção

Execute todos os itens antes de considerar o deploy finalizado:

```
[ ] https://classificadopilates.com.br carrega normalmente
[ ] Certificado SSL válido (cadeado verde no navegador)
[ ] /login → Magic Link → email chega na caixa de entrada
[ ] /admin → consegue acessar como admin
[ ] /admin/conexao → status "Conectado" (WhatsApp pareado)
[ ] Criar anúncio teste → aprovar no admin → ver publicado na listagem
[ ] Enviar lead com WhatsApp real → mensagens chegam pro comprador e vendedor
[ ] /admin/leads → lead aparece na lista
[ ] /admin/logs/mensagens → status evolui: sent → delivered → read
[ ] www.classificadopilates.com.br redireciona pra sem www
```

---

## 11. Operação contínua

### Deploy de uma mudança no código

```bash
ssh deploy@<DROPLET_IP>
cd ~/apps/classificado-pilates/nextjs
git pull origin main
cd ..
docker compose up -d --build nextjs
docker compose logs -f nextjs
```

### Aplicar nova migration do Supabase

Na máquina local do desenvolvedor:

```bash
supabase db push
```

Ou cole o SQL no Supabase Studio → SQL Editor.

### Ver logs

```bash
docker compose logs -f                     # todos os containers
docker compose logs -f nextjs              # só a aplicação
docker compose logs -f evolution           # só o WhatsApp
docker compose logs --tail=100 caddy       # últimas 100 linhas do Caddy
```

### Reiniciar serviço específico

```bash
docker compose restart nextjs
docker compose restart evolution
```

### Atualizar Evolution API

```bash
# Editar docker-compose.yml → trocar a tag da imagem
# Exemplo: atendai/evolution-api:v2.2.3 → atendai/evolution-api:v2.3.0

docker compose pull evolution
docker compose up -d evolution
docker compose logs -f evolution
```

---

## 12. Backups

### Dados do Evolution (instâncias + sessão WhatsApp)

Crie um cron job diário:

```bash
# Criar pasta de backups
mkdir -p ~/backups

# Editar crontab
crontab -e
```

Adicione:

```
# Backup dos dados do Evolution — todo dia às 3h
0 3 * * * tar -czf /home/deploy/backups/evolution-$(date +\%Y\%m\%d).tar.gz -C /home/deploy/apps/classificado-pilates evolution-data

# Backup do Postgres do Evolution — todo dia às 3h15
15 3 * * * docker exec classificado-pilates-evolution-postgres-1 pg_dump -U evolution evolution | gzip > /home/deploy/backups/evolution-db-$(date +\%Y\%m\%d).sql.gz

# Limpar backups com mais de 30 dias
0 4 * * * find /home/deploy/backups -name "*.gz" -mtime +30 -delete
```

### Supabase

- **Plano Pro:** backup automático diário (retenção 7 dias)
- **Plano Free:** faça `pg_dump` manual periodicamente via Supabase CLI

---

## 13. Monitoring (opcional, recomendado)

Adicione o [Uptime Kuma](https://github.com/louislam/uptime-kuma) ao mesmo Droplet:

### Adicionar ao docker-compose.yml

```yaml
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped
    volumes:
      - uptime_kuma:/app/data
    expose:
      - "3001"
    networks:
      - app-network
```

E na seção `volumes:`:

```yaml
  uptime_kuma:
```

### Adicionar ao Caddyfile

```
status.classificadopilates.com.br {
    reverse_proxy uptime-kuma:3001
}
```

### DNS adicional

```
status.classificadopilates.com.br    A    <DROPLET_IP>
```

### Monitores recomendados

Após acessar `https://status.classificadopilates.com.br` e criar sua conta:

1. **Site:** `https://classificadopilates.com.br` — HTTP 200
2. **Evolution:** `https://wa.classificadopilates.com.br` — HTTP 200
3. **Supabase:** `https://<REF>.supabase.co/rest/v1/` — HTTP 200 (com header `apikey`)

---

## 14. Troubleshooting

### "Caddy não obtém certificado SSL"

| Causa provável | Solução |
|---|---|
| DNS não propagou | Verifique com `dig <dominio> +short` — deve retornar o IP do Droplet |
| Porta 80 bloqueada | `sudo ufw status` — porta 80 deve estar ALLOW |
| Domínio errado no Caddyfile | Compare o domínio no Caddyfile com o DNS |

```bash
docker compose logs caddy
# Procure por erros de ACME/Let's Encrypt
```

### "Evolution não conecta no Postgres"

```bash
# Verificar se os containers estão na mesma rede
docker network inspect classificado-pilates_app-network

# Verificar se o Postgres subiu
docker compose logs evolution-postgres

# Causa comum: DATABASE_CONNECTION_URI no .env.evolution com senha errada
```

### "Next.js build falha"

```bash
# Ver o erro completo
docker compose logs nextjs

# Se for out-of-memory:
# - O Droplet tem pelo menos 4GB RAM?
# - Tente: docker compose build --no-cache nextjs
# - Ou adicione swap: https://www.digitalocean.com/community/tutorials/how-to-add-swap-space-on-ubuntu
```

### "Magic Link manda pra localhost:3000"

O **Site URL** no Supabase Auth não foi atualizado:

1. Painel Supabase → **Authentication → URL Configuration**
2. Altere Site URL para `https://classificadopilates.com.br`

### "Mensagens WhatsApp não enviam"

1. Verifique `/admin/conexao` → reconectar QR se status não for "Conectado"
2. Verifique `/admin/logs/erros` → `error_message` dá a pista
3. Verifique logs do Evolution: `docker compose logs -f evolution`
4. Verifique se o webhook reverso foi configurado (passo 9.3)

### "Container reinicia em loop"

```bash
# Ver por que está reiniciando
docker compose logs --tail=50 <nome-do-container>

# Ver status detalhado
docker inspect <container-id> | grep -A 5 "State"
```

---

## 15. Custos mensais estimados

| Item | Custo |
|---|---|
| Droplet 4GB Digital Ocean | $24/mês |
| Domínio .com.br | ~R$40/ano (~$3/mês) |
| Supabase Free tier | $0 |
| **Total mínimo** | **~$27/mês** |

| Item | Custo |
|---|---|
| Droplet 4GB Digital Ocean | $24/mês |
| Domínio .com.br | ~$3/mês |
| Supabase Pro (recomendado) | $25/mês |
| Backups DO (20% do Droplet) | $4.80/mês |
| **Total produção** | **~$57/mês** |

---

## 16. Alternativa: Vercel + Supabase + Evolution Droplet

Para times que preferem deploy via `git push` (sem gerenciar o servidor da aplicação):

| Componente | Hospedagem | Custo |
|---|---|---|
| Next.js | Vercel Pro | $20/mês |
| Evolution API + Postgres + Redis | Droplet DO 2GB | $12/mês |
| Banco + Auth + Storage | Supabase Pro | $25/mês |
| **Total** | | **$57/mês** |

**Vantagens:** deploy automático no push, preview deployments, zero config de SSL para o app.

**Desvantagens:** menos controle, vendor lock-in, limites de execução serverless.

### Setup Vercel (resumo)

1. Conecte o repositório no [painel Vercel](https://vercel.com)
2. Configure as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.)
3. Deploy automático a cada push na branch `main`
4. O Evolution API ainda precisa de um Droplet separado (passos 5.1, 5.4, 9.1–9.3 deste guia)

---

## Referência rápida de comandos

```bash
# === Deploy ===
docker compose up -d --build              # Subir/rebuildar tudo
docker compose up -d --build nextjs       # Rebuildar só o Next.js
docker compose down                       # Parar tudo
docker compose restart <servico>          # Reiniciar um serviço

# === Logs ===
docker compose logs -f                    # Todos os logs (Ctrl+C pra sair)
docker compose logs -f nextjs             # Só Next.js
docker compose logs --tail=100 caddy      # Últimas 100 linhas do Caddy

# === Status ===
docker compose ps                         # Status dos containers
docker system df                          # Uso de disco do Docker

# === Limpeza ===
docker system prune -a --volumes          # ⚠️ Remove TUDO não usado (images, containers, volumes)
docker image prune -a                     # Remove só imagens não usadas

# === Git pull + redeploy ===
cd ~/apps/classificado-pilates/nextjs && git pull && cd .. && docker compose up -d --build nextjs
```
