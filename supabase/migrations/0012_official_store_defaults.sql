-- ============================================================
-- 0012_official_store_defaults.sql
-- Loja Oficial Metalife: vendor padrão, sob encomenda, LGPD
-- ============================================================

-- ---------- listing_variants: fabricação sob encomenda ----------
ALTER TABLE public.listing_variants
  ADD COLUMN IF NOT EXISTS is_made_to_order boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS production_days integer NOT NULL DEFAULT 15
    CHECK (production_days >= 0);

COMMENT ON COLUMN public.listing_variants.is_made_to_order IS
  'Se true, permite venda com estoque 0 (fabricação sob encomenda).';
COMMENT ON COLUMN public.listing_variants.production_days IS
  'Prazo estimado de fabricação em dias úteis quando is_made_to_order = true.';

-- ---------- vendors: flag da Loja Oficial ----------
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_official_unique
  ON public.vendors (is_official)
  WHERE is_official = true;

-- ---------- Seed: usuário + vendor Metalife Pilates (Loja Oficial) ----------
-- vendors.id referencia auth.users(id); UUID fixo para FK estável em pedidos/produtos.
DO $$
DECLARE
  store_id uuid := 'a1111111-1111-4111-8111-111111111111';
  inst_id uuid;
BEGIN
  SELECT id INTO inst_id FROM auth.instances LIMIT 1;
  IF inst_id IS NULL THEN
    inst_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = store_id) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      inst_id,
      store_id,
      'authenticated',
      'authenticated',
      'loja@metalife.pilates',
      crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Metalife Pilates","full_name":"Metalife Pilates Loja Oficial"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities
    WHERE user_id = store_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      store_id,
      jsonb_build_object(
        'sub', store_id::text,
        'email', 'loja@metalife.pilates',
        'email_verified', true
      ),
      'email',
      store_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  INSERT INTO public.vendors (
    id,
    name,
    city,
    state,
    whatsapp,
    onboarding_completed,
    is_verified,
    is_official
  ) VALUES (
    store_id,
    'Metalife Pilates (Loja Oficial)',
    'São Paulo',
    'SP',
    NULL,
    true,
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    onboarding_completed = true,
    is_verified = true,
    is_official = true,
    updated_at = now();

  -- Garante unicidade: só este vendor é oficial
  UPDATE public.vendors
  SET is_official = false
  WHERE id <> store_id AND is_official = true;
END $$;

-- ---------- Páginas legais LGPD (Metalife Pilates) ----------
UPDATE public.legal_pages
SET
  title = 'Política de Privacidade',
  content_md = $md$
# Política de Privacidade

**Última atualização:** 15 de novembro de 2026

A **Metalife Pilates** (“nós”, “nossa” ou “Loja Oficial”) valoriza a privacidade e a proteção dos dados pessoais. Esta Política descreve como coletamos, usamos, armazenamos e compartilhamos informações no site da Loja Oficial Metalife Pilates, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## 1. Quem somos

Controladora dos dados: Metalife Pilates — Loja Oficial de equipamentos de Pilates.  
Canal de privacidade: utilize o e-mail ou WhatsApp comercial publicados no site, com o assunto “Privacidade / LGPD”.

## 2. Dados que coletamos

Podemos coletar, conforme a finalidade do cadastro ou da compra:

- **Dados de identificação e contato:** nome completo, e-mail, telefone/WhatsApp.
- **Dados cadastrais e fiscais:** CPF ou CNPJ; em compras B2B (CNPJ), Razão Social e Inscrição Estadual (ou indicação de isenção).
- **Dados de entrega:** CEP, logradouro, número, complemento, bairro, cidade e UF.
- **Dados da compra:** produtos, variações (cores de estrutura STR e estofado STF), valores, frete, forma de pagamento e status do pedido.
- **Dados técnicos:** endereço IP, data/hora de aceite dos Termos e desta Política, e registros necessários à segurança da operação.

Não solicitamos dados sensíveis para a operação padrão da loja.

## 3. Finalidades e bases legais

Utilizamos os dados para:

- Processar pedidos, emitir documentos fiscais e cumprir obrigações legais/tributárias.
- Entregar produtos (incluindo cotação e contratação de frete) e prestar atendimento pós-venda.
- Comunicar status do pedido, suporte e informações essenciais à compra.
- Prevenir fraudes, garantir a segurança da plataforma e exercer direitos em processos administrativos ou judiciais.
- Cumprir deveres legais e regulatórios aplicáveis.

As bases legais incluem, conforme o caso: execução de contrato (art. 7º, V), cumprimento de obrigação legal (art. 7º, II), legítimo interesse (art. 7º, IX) e consentimento quando exigido (art. 7º, I).

## 4. Compartilhamento

Podemos compartilhar dados estritamente necessários com:

- **Gateway de pagamento** (ex.: processadores como Asaas), para autenticação do pagador e liquidação.
- **Transportadoras e operadores logísticos**, para cotação, coleta e entrega.
- **Sistemas de gestão (ERP/Protheus)** e prestadores de infraestrutura (hospedagem, e-mail, banco de dados), sob contrato e medidas de segurança.
- Autoridades públicas, quando houver obrigação legal ou ordem válida.

Não vendemos dados pessoais.

## 5. Armazenamento e segurança

Os dados são armazenados em ambiente controlado, com acesso restrito e medidas técnicas e administrativas razoáveis. O prazo de retenção observa a necessidade da operação, obrigações fiscais/contábeis e prazos legais de prescrição.

## 6. Direitos do titular (LGPD)

Você pode solicitar, nos termos da lei:

- confirmação de tratamento e acesso aos dados;
- correção de dados incompletos, inexatos ou desatualizados;
- anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;
- portabilidade, quando aplicável;
- informação sobre compartilhamentos;
- revogação de consentimento, quando essa for a base legal.

Para exercer direitos, contate o canal de privacidade indicado nesta Política. Responderemos no prazo legal.

## 7. Cookies e preferências

Podemos usar cookies essenciais ao funcionamento do site (sessão, carrinho, autenticação) e, quando aplicável, cookies de medição agregada. Você pode gerenciar cookies no navegador; a desativação de cookies essenciais pode afetar o checkout.

## 8. Atualizações

Esta Política pode ser atualizada para refletir melhorias operacionais ou exigências legais. A versão vigente estará sempre publicada nesta página, com a data da última atualização.
$md$,
  updated_at = now()
WHERE slug = 'politica-de-privacidade';

UPDATE public.legal_pages
SET
  title = 'Termos de Uso',
  content_md = $md$
# Termos de Uso

**Última atualização:** 15 de novembro de 2026

Estes Termos regulam o uso do site e das compras realizadas na **Loja Oficial Metalife Pilates**. Ao criar conta, navegar na loja ou concluir um pedido, você declara ter lido e aceito estes Termos e a Política de Privacidade.

## 1. Sobre o serviço

A Metalife Pilates opera uma **loja oficial única** para comercialização de equipamentos e acessórios de Pilates, inclusive sob encomenda com seleção de cores de estrutura (STR) e estofado (STF).  
Não se trata de marketplace multi-vendedor: os produtos são ofertados e faturados pela própria Metalife Pilates (ou empresa do grupo indicada na nota fiscal).

## 2. Cadastro e conta

- O usuário é responsável pela veracidade dos dados informados (incluindo CPF/CNPJ, Razão Social e Inscrição Estadual, quando aplicável).
- Credenciais de acesso são pessoais e intransferíveis.
- Podemos suspender contas em caso de uso indevido, fraude ou violação destes Termos.

## 3. Pedidos, preços e fabricação sob encomenda

- Preços, condições de frete e prazos exibidos no checkout prevalecem no momento da confirmação do pedido.
- Produtos com variação STR/STF podem ser **fabricados sob encomenda**. Nesses casos, o prazo estimado de produção (em dias úteis) é informado na página do produto e no fluxo de compra; estoque zero não impede a compra quando a variação estiver marcada como sob encomenda.
- Após a confirmação do pagamento, o pedido segue para preparação/produção e posterior envio conforme a modalidade de frete escolhida.

## 4. Pagamento

- O pagamento é processado por gateway parceiro. A conclusão do pedido depende da confirmação do pagamento.
- Em caso de recusa, chargeback ou inconsistência cadastral/fiscal, a Metalife pode cancelar o pedido e orientar a regularização.

## 5. Entrega e risco

- Prazos de frete são estimativas e podem variar por região, transportadora e disponibilidade.
- É responsabilidade do comprador informar endereço completo e acessível. Tentativas frustradas de entrega por dados incorretos podem gerar custos adicionais.

## 6. Trocas, cancelamentos e garantia

- Políticas de cancelamento antes do envio, trocas e garantia do fabricante/Metalife seguem a legislação consumerista aplicável e as orientações de atendimento publicadas no site ou comunicadas no pós-venda.
- Itens personalizados sob encomenda (cores STR/STF específicas) podem ter regras próprias de cancelamento após início da produção; essas regras serão informadas no atendimento.

## 7. Propriedade intelectual

Marcas, layouts, textos, fotos e demais conteúdos do site são protegidos. É vedada a reprodução não autorizada para fins comerciais.

## 8. Limitação de responsabilidade

Na máxima extensão permitida pela lei, a Metalife não se responsabiliza por danos indiretos decorrentes de indisponibilidade temporária do site, falhas de terceiros (gateway, transportadoras, provedores de internet) ou uso indevido da conta pelo usuário, sem prejuízo das garantias legais do consumidor.

## 9. Privacidade

O tratamento de dados pessoais observa a **Política de Privacidade**. Ao finalizar a compra, o usuário declara ciência do tratamento necessário à execução do pedido (dados cadastrais, fiscais, de entrega e pagamento).

## 10. Foro

Salvo disposição legal de foro privilegiado do consumidor, fica eleito o foro da comarca de São Paulo/SP para dirimir controvérsias oriundas destes Termos.
$md$,
  updated_at = now()
WHERE slug = 'termos-de-uso';
