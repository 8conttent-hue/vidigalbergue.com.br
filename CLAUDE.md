# CLAUDE.md — VIDIGALBERGUE

Site gerado pelo **SF (Site Factory)** em 15/04/2026. Migrado para o modelo Cloudflare + Supabase em 25/09/2026.

## Contexto do Site

**Nome:** VIDIGALBERGUE
**Nicho:** Viagens e Turismo
**Keywords:** Meu nome e Ana Paula tenho 29 anos carioca e cidada do
**Paleta de cores:** forest | **Fonte:** inter

Meu nome é Ana Paula, tenho 29 anos, carioca e cidadã do mundo. Eu amo viajar e por isso desde que conquistei a minha independência financeira iniciei uma jornada linda e desafiante na minha vida: viajar o mundo sozinha. O que mais me fascina neste universo é a culinária de cada lugar, a moda, os costumes e tudo que envolve as culturas diversas que temos dentro do Brasil e no mundo. O nome do blog é VidigalBergue pois este foi o meu primeiro empreendimento — no Rio de Janeiro eu inaugurei um hostel, o VidigalBergue. Foram 5 anos de muito amor, aprendizado e novas amizades. Hoje eu viajo o mundo e escrevo tudo neste blog para inspirar novas pessoas a viajarem e aproveitarem mais a vida. Aqui você encontra dicas sobre: Empreendedorismo, viagens, moda e life style.

## Componentes visuais usados

| Seção | Variante |
|-------|----------|
| Header | Header-H |
| Hero | Hero-E |
| Features | Features-A |
| About Section | About-E |
| Posts | Posts-G |
| Footer | Footer-E |
| Página Sobre | Sobre-B |
| Página Contato | Contato-I |

## Estrutura do projeto

```
src/
  sections/        # Layout escolhido pelo SF — Header, Hero, Features, About, Posts, Footer, Sobre, Contato
  data/            # JSONs com todo o conteúdo editável
  lib/             # supabase.ts (cliente) e posts.ts (getPosts/getPostBySlug)
  components/      # Seo.astro (meta tags + JSON-LD)
  pages/           # Rotas Astro (index, sobre, contato, blog, privacidade, termos, [...slug])
  layouts/         # BaseLayout com fonte e cores dinâmicas
  styles/          # global.css com variáveis CSS de cor
public/
  images/          # hero.jpg, about.jpg, sobre.jpg
```

## O que editar

### Textos e conteúdo
- **`src/data/home.json`** — hero (título, subtítulo, botão), features (título, items), about section (título, desc, stats), posts
- **`src/data/sobre.json`** — conteúdo completo da página Sobre (hero, texto, missão)
- **`src/data/contato.json`** — título, subtítulo, email, tempo de resposta
- **`src/data/siteConfig.json`** — nome, slug, email, redes sociais, menu (título/descrição/OG/JSON-LD derivam daqui)

### Imagens
Imagens já estão em `public/images/` (via Pexels). Para substituir, mantenha os mesmos nomes de arquivo:
- `hero.jpg` — imagem de fundo do Hero (e og:image padrão)
- `about.jpg` — imagem da seção About (home)
- `sobre.jpg` — imagem de fundo da página Sobre

### Posts do blog
Os posts NÃO ficam mais em markdown local. São carregados do Supabase (tabela `network_posts`, filtrados por `domain = vidigalbergue.com.br`).
- `src/lib/posts.ts` — `getPosts()` e `getPostBySlug()`; `formatContentToHtml()` converte markdown → HTML.
- Sem painel admin. Novos posts/posts editados entram pela plataforma 8links e publicam automaticamente (via Git/CF).

### Cores
Variáveis em `src/styles/global.css`: `--color-primary`, `--color-accent`, `--color-dark`.

## SEO

- `src/components/Seo.astro` injetado pelo `BaseLayout`: title, description, canonical, OG, Twitter, `name="robots"`, JSON-LD (WebSite nas páginas estáticas, BlogPosting nos artigos).
- `src/pages/robots.txt.ts` e `src/pages/sitemap.xml.ts` gerados dinamicamente (sitemap inclui posts com lastmod).

## Deploy

```bash
bun install
bun run build
# Publicar no Cloudflare: a pasta dist/ é servida como Worker (adaptador @astrojs/cloudflare)
# Envs opcionais no CF: SUPABASE_URL e SUPABASE_ANON_KEY (fallbacks embutidos no código)
```