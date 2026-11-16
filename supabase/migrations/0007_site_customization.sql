-- Seeds de customização (site_settings já existe em 0005)

INSERT INTO public.site_settings (key, value) VALUES
  ('theme', '{
    "colors": {
      "action": "#008591",
      "action_dark": "#006f79",
      "trust": "#008591",
      "ink": "#0f172a",
      "ink_soft": "#475569",
      "muted": "#64748b",
      "bg": "#f7f9fb",
      "bg_elevated": "#ffffff",
      "bg_section": "#f1f5f9",
      "bg_dark": "#0f172a",
      "line": "#e2e8f0",
      "line_strong": "#cbd5e1",
      "success": "#16a34a",
      "danger": "#dc2626"
    },
    "typography": {
      "font_display": "montserrat",
      "font_body": "inter",
      "weight_display": "900",
      "weight_body": "400",
      "scale": "1.0"
    },
    "shape": {
      "radius_base": "6px",
      "radius_card": "6px"
    }
  }'::jsonb),

  ('brand', '{
    "name": "Metalife Pilates",
    "tagline": "Marketplace de equipamentos",
    "logo_url": "/images/logo-metalife-verde.png",
    "logo_dark_url": "/images/logo-metalife-white.png",
    "favicon_url": "/icon.png",
    "og_image_url": null
  }'::jsonb),

  ('footer', '{
    "description": "Marketplace de equipamentos de Pilates da Metalife. Conexão direta entre vendedores e compradores.",
    "company": {
      "name": "Metalife Pilates",
      "cnpj": null,
      "email": null,
      "phone": null,
      "address": null
    },
    "columns": [
      {
        "title": "Compradores",
        "links": [
          {"label": "Catálogo", "href": "/catalogo"},
          {"label": "Reformers", "href": "/catalogo?categoria=reformer"},
          {"label": "Novidades", "href": "/catalogo?ordem=recentes"}
        ]
      },
      {
        "title": "Vendedores",
        "links": [
          {"label": "Como anunciar", "href": "/dashboard/novo"},
          {"label": "Painel", "href": "/dashboard"},
          {"label": "Cadastre-se", "href": "/cadastro"}
        ]
      },
      {
        "title": "Institucional",
        "links": [
          {"label": "Política de Privacidade", "href": "/politica-de-privacidade"},
          {"label": "Termos de Uso", "href": "/termos-de-uso"}
        ]
      }
    ],
    "social": [
      {"platform": "instagram", "url": null},
      {"platform": "facebook", "url": null},
      {"platform": "linkedin", "url": null},
      {"platform": "youtube", "url": null},
      {"platform": "tiktok", "url": null},
      {"platform": "twitter", "url": null}
    ]
  }'::jsonb),

  ('menu', '{
    "items": [
      {"label": "Catálogo", "href": "/catalogo", "external": false, "order": 1},
      {"label": "Reformers", "href": "/catalogo?categoria=reformer", "external": false, "order": 2},
      {"label": "Novidades", "href": "/catalogo?ordem=recentes", "external": false, "order": 3}
    ]
  }'::jsonb)

ON CONFLICT (key) DO NOTHING;
