# CLAUDE.md — VIDIGALBERGUE

Site gerado pelo **SF (Site Factory)** em 15/04/2026.

## Contexto do Site

**Nome:** VIDIGALBERGUE
**Nicho:** Viagens e Turismo
**Keywords:** Meu nome e Ana Paula tenho 29 anos carioca e cidada do
**Paleta de cores:** forest | **Fonte:** inter

Meu nome é Ana Paula, tenho 29 anos, carioca e cidadã do mundo. Eu amo viajar e por isso desde que eu conquistei a minha independência financeira eu iniciei uma jornada linda e desafiante na minha vida: Viajar o mundo sozinha. O que mais me fascina neste universo é a culinária de cada lugar, a moda os costumes e tudo que envolve as culturas diversas que temos dentro do Brasil e no mundo. O nome do blog é VidigalBergue pois este foi o meu primeiro empreendimento e foi através dele que conquistei a minha independência financeira e a minha paixão por conhecer pessoas de todo o mundo.No Rio de Janeiro, cidade que eu amo de paixão, eu inaugurei um hostel, o VidigalBergue. Foram 5 anos de muito amor, aprendizado e novas amizades. Hoje eu viajo o mundo e escrevo tudo neste blog para inspirar novas pessoas a viajarem e aproveitarem mais a vida. Aqui você encontra dicas sobre: Empreendedorismo, viagens, moda e life style. <3



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
  content/blog/    # Posts em Markdown
  pages/           # Rotas Astro (index, sobre, contato, blog, privacidade, termos)
  layouts/         # BaseLayout com fonte e cores dinâmicas
  styles/          # global.css com variáveis CSS de cor
public/
  images/          # hero.jpg, about.jpg, blog/*.jpg — inseridos automaticamente via Pexels
```

## O que editar

### Textos e conteúdo
- **`src/data/home.json`** — hero (título, subtítulo, botão), features (título, items), about section (título, desc, stats), posts
- **`src/data/sobre.json`** — conteúdo completo da página Sobre (hero, texto, missão)
- **`src/data/contato.json`** — título, subtítulo, email, tempo de resposta
- **`src/data/siteConfig.json`** — nome, slug, email, redes sociais, menu

### Imagens
Imagens já estão em `public/images/` (via Pexels). Para substituir, mantenha os mesmos nomes de arquivo:
- `hero.jpg` — imagem de fundo do Hero
- `about.jpg` — imagem da seção About (home)
- `sobre.jpg` — imagem de fundo da página Sobre
- `blog/{slug}.jpg` — imagens dos posts

### Posts do blog
Arquivos em `src/content/blog/`. Ajuste o tom de voz, adicione dados específicos do nicho e personalize conforme a identidade do site.

### Cores
Variáveis em `src/styles/global.css`: `--color-primary`, `--color-accent`, `--color-dark`.

## Deploy

```bash
bun install
bun run build
# Faça upload da pasta dist/ para Netlify, Vercel ou hosting estático
```
