# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Reforma** — Marketplace de equipamentos de Pilates (compra/venda). MVP em português brasileiro, desenvolvido por Atlaas/Metalife.

## Commands

```bash
pnpm dev          # Dev server na porta 3000
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # ESLint (next/core-web-vitals + next/typescript)
pnpm tsc --noEmit # Type-check sem emitir
```

Não há framework de testes configurado.

## Architecture

- **Framework:** Next.js 14.2.35 com App Router, React 18, TypeScript 5
- **Styling:** Tailwind CSS 3.4 + CSS custom properties (design system próprio)
- **UI Components:** shadcn (style `base-nova`) + Base UI (unstyled primitives) + Lucide icons
- **Class utilities:** `cn()` via `clsx` + `tailwind-merge` (em `lib/utils.ts`), `cva` para variantes
- **Data:** Supabase (PostgreSQL + Storage). Tipos em `lib/supabase/types.ts`, helpers em `lib/listings.ts`
- **Supabase:** Clients em `lib/supabase/` (client.ts, server.ts, middleware.ts, types.ts)

## Key Conventions

### Fonts
- **Fraunces** (`--font-fraunces`, classe `.font-display`) — headers/display
- **Manrope** (`--font-manrope`) — body text

### Color System
Duas cores de acento: `sage` (verde) e `terracota` (vermelho quente). Variáveis CSS definidas em `app/globals.css` com suporte a dark mode via classe.

### Component Organization
- `components/ui/` — Primitivos reutilizáveis (button, dialog, input, label)
- `components/reforma/` — Componentes de feature do marketplace
- Pages são Server Components; componentes interativos usam `"use client"`

### Path Alias
`@/*` mapeia para `./` (raiz do projeto)

### Currency
Formatação BRL via `lib/format.ts`
