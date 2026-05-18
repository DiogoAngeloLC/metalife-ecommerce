# Classificado Pilates

> Marketplace de equipamentos de Pilates usados e seminovos. Conecta vendedores e compradores diretamente via WhatsApp, sem intermediação de pagamento ou transação.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)](https://supabase.com)

## O que é

Plataforma de classificados onde:
- **Vendedores** anunciam equipamentos de Pilates (Reformers, Cadillacs, Chairs, acessórios)
- **Compradores** descobrem ofertas e recebem contato do vendedor via WhatsApp
- **Admin** modera anúncios, gerencia usuários e personaliza o marketplace

Sem cobrança de comissão, sem intermediação de pagamento, sem cuidado de frete — apenas o encontro.

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Banco/Auth/Storage:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **WhatsApp:** Evolution API (Baileys, self-hosted)
- **UI:** shadcn/ui + lucide-react
- **Forms:** react-hook-form + zod
- **Deploy:** Docker (Digital Ocean) ou Vercel

## Quick Start

### Pré-requisitos

- Node.js 20+ (`node --version`)
- pnpm 9+ (`pnpm --version`)
- Conta Supabase com projeto criado
- Servidor Evolution API rodando (ou usar `docs/DEPLOYMENT-DIGITALOCEAN.md` para subir um)

### Setup local

```bash
# 1. Clonar
git clone <repo-url>
cd classificado-pilates

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis
cp .env.example .env.local
# Edite .env.local com suas credenciais (ver .env.example para detalhes)

# 4. Aplicar migrations no Supabase
supabase link --project-ref <seu-ref>
supabase db push

# 5. Deploy das Edge Functions
supabase functions deploy dispatch-whatsapp
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy check-whatsapp

# 6. Configurar secrets das Edge Functions
supabase secrets set \
  EVOLUTION_API_URL=https://wa.seu-dominio.com \
  EVOLUTION_API_KEY=sua-chave \
  EVOLUTION_INSTANCE_NAME=classificado-pilates

# 7. Aplicar templates de email (ver supabase/email-templates/_base.md)

# 8. Promover primeiro admin (no SQL Editor do Supabase):
# INSERT INTO public.app_admins (user_id, created_by)
# SELECT id, id FROM auth.users WHERE email = 'admin@seudominio.com';

# 9. Rodar
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Configuração

Todas as variáveis estão documentadas em [`.env.example`](.env.example).

Resumo:
- **Supabase:** URL + anon key + service_role key
- **Site:** `NEXT_PUBLIC_SITE_URL` (URL absoluta da aplicação)
- **Evolution:** URL + API key + nome da instância

## Scripts

```bash
pnpm dev          # Servidor de desenvolvimento (http://localhost:3000)
pnpm build        # Build de produção
pnpm start        # Roda build local
pnpm lint         # ESLint
pnpm type-check   # TypeScript check (sem gerar arquivos)
```

## Estrutura

```
app/                    # Next.js App Router
├── admin/              # Painel administrativo (13 sub-rotas)
├── dashboard/          # Painel do vendedor
├── catalogo/           # Listagem pública
└── [slug]/             # Detalhe do anúncio
components/
├── admin/              # Componentes do painel admin
├── reforma/            # Componentes do marketplace
└── ui/                 # Primitives (button, dialog, input…)
lib/
├── supabase/           # Clients e types
├── messages/           # Templates WhatsApp e dispatcher
└── *.ts                # Utilities
supabase/
├── migrations/         # 9 migrations versionadas
├── functions/          # 3 Edge Functions (Deno)
└── email-templates/    # 4 templates HTML branded
docs/
├── customization.md
├── DEPLOYMENT-DIGITALOCEAN.md
└── visual-reference/   # Design system + screenshots
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/DEPLOYMENT-DIGITALOCEAN.md`](docs/DEPLOYMENT-DIGITALOCEAN.md) | Playbook completo de deploy em Digital Ocean (Droplet + Docker + Caddy) |
| [`docs/customization.md`](docs/customization.md) | Como personalizar o marketplace via painel admin (tema, marca, conteúdo) |
| [`docs/visual-reference/DESIGN.md`](docs/visual-reference/DESIGN.md) | Design system, tokens, tipografia |

## Funcionalidades

### Público
- Home com hero customizável
- Catálogo com filtros (categoria, ordem, busca)
- Detalhe do anúncio com galeria
- Modal de captura de lead com validação de WhatsApp
- Páginas legais editáveis (política, termos)

### Vendedor
- Cadastro via Magic Link ou senha
- Painel com stats (anúncios, leads, visualizações)
- Criar/editar anúncios com upload de fotos
- Edição de perfil

### Admin
- Curadoria de anúncios (aprovar / rejeitar / destaque)
- Gestão de usuários e vendedores verificados
- Visualização de leads
- Conexão Evolution (QR code, status)
- Logs de mensagens e erros
- Customização completa: tema, marca, hero, rodapé, menu, banners
- Editor de páginas legais
- Notificações de novos leads via webhook + WhatsApp

## Licença

Proprietário — uso restrito ao titular do contrato.

## Suporte

Para o time técnico que herda o projeto:
- [`docs/DEPLOYMENT-DIGITALOCEAN.md`](docs/DEPLOYMENT-DIGITALOCEAN.md) cobre 95% das dúvidas de deploy
- Issues recorrentes: ver seção "Troubleshooting" do playbook de deploy
- Schema do banco: ver `supabase/migrations/` em ordem numérica
- Edge Functions: ver `supabase/functions/<nome>/index.ts`
