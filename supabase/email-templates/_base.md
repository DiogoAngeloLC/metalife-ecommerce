# Email Templates — Classificado Pilates

Templates customizados pra substituir os defaults do Supabase Auth.

## Como aplicar

1. Painel Supabase → Authentication → Email Templates
2. Para cada template (Confirm signup, Magic Link, Change Email Address, Reset Password):
   - Subject: copiar do mapeamento abaixo
   - Body (HTML): copiar todo o conteúdo do arquivo .html correspondente
3. Salvar

## Variáveis Supabase disponíveis

- `{{ .ConfirmationURL }}` — URL completa com token de confirmação
- `{{ .Token }}` — código numérico 6 dígitos (caso queira auth por código)
- `{{ .TokenHash }}` — hash do token
- `{{ .SiteURL }}` — URL configurada em Project Settings (https://classificado-pilates.vercel.app)
- `{{ .Email }}` — email do usuário

## Mapeamento

| Painel | Subject | Arquivo |
|---|---|---|
| Confirm signup | Confirme seu email no Classificado Pilates | `confirm-signup.html` |
| Magic Link | Seu acesso ao Classificado Pilates | `magic-link.html` |
| Reset Password | Redefinir senha — Classificado Pilates | `recovery.html` |
| Change Email Address | Confirme seu novo email | `email-change.html` |

## SMTP customizado (futuro)

Hoje usa SMTP gratuito do Supabase (limitado a ~3/hora). Pra produção real:
1. Resend ou Postmark (sugestão: Resend, free tier generoso)
2. Painel Supabase → Project Settings → Auth → SMTP Settings
3. Domínio com SPF/DKIM/DMARC configurados
4. From: noreply@classificadopilates.com.br (quando domínio estiver pronto)
