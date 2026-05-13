# Customização do Site

Tudo via painel `/admin`. Sem código necessário.

## Tema (`/admin/tema`)

Cores, tipografia, border radius. Aplicado globalmente.

- Cores via color picker
- Fontes: 6 opções pré-aprovadas (Montserrat, Playfair, Inter, Bebas, Roboto, Open Sans) para display; corpo: Inter, Roboto, Source Sans 3, Open Sans
- Border radius com sliders

## Identidade (`/admin/identidade`)

- Nome do marketplace
- Tagline
- Logo (versão clara e dark)
- Favicon
- Imagem OG (compartilhamento em redes)

## Rodapé (`/admin/rodape`)

- Descrição da empresa
- Dados (CNPJ, email, telefone, endereço)
- Até 4 colunas de links customizáveis
- Redes sociais (Instagram, Facebook, LinkedIn, YouTube, X, TikTok)

## Menu (`/admin/menu`)

- Até 8 itens
- Label, URL, ordem, abrir em nova aba

## Hero da home (`/admin/aparencia`)

Imagem + textos do banner principal.

## Páginas (`/admin/paginas`)

Política de Privacidade e Termos de Uso (editor markdown).

## Banners (`/admin/banners`)

Slots de banner pra catálogo e detail page.

## Limitações conhecidas

- Não há editor de CSS livre (decisão deliberada por estabilidade)
- Fontes limitadas a opções pré-carregadas no `next/font`
- Estrutura de páginas legais limitada a markdown
- Mudanças refletem após revalidação do Next.js (normalmente em poucos segundos ao navegar)
