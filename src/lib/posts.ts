import { supabase } from './supabase';

export interface Post {
  id: string;
  domain?: string;
  network_site_id?: number | string;
  slug: string;
  title: string;
  content: string;
  meta_description?: string;
  featured_image?: string;
  category?: string;
  author?: string;
  published_at: string;
}

export function formatContentToHtml(rawContent: string): string {
  if (!rawContent) return '';

  let html = rawContent;
  html = html.replace(/style="[^"]*"/gi, '');

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => {
    return `<img src="${url}" alt="${alt || 'VIDIGALBERGUE'}" class="my-6 rounded-2xl w-full max-h-[500px] object-cover shadow-md" />`;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-accent font-semibold">${text}</a>`;
  });

  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-dark mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-black text-dark mt-8 mb-4">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black text-dark mt-8 mb-4">$1</h1>');

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-dark">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

  if (html.includes('<p>') || html.includes('<h2>') || html.includes('<div>')) {
    return html;
  }

  const paragraphs = html
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => {
      if (p.startsWith('<h') || p.startsWith('<img') || p.startsWith('<blockquote') || p.startsWith('<ul') || p.startsWith('<ol')) {
        return p;
      }
      return `<p class="mb-6 text-gray-600 leading-relaxed text-base sm:text-lg">${p}</p>`;
    });

  return paragraphs.join('\n');
}

const DOMAIN = 'vidigalbergue.com.br';

// limit evita trazer o acervo inteiro: o ORDER BY no banco estoura o
// statement_timeout do Postgres, e a ordenacao e feita em memoria.
// O banco nao tem indice em (domain, published_at) e satura com facilidade,
// entao a consulta tem timeout curto e o resultado fica em cache no edge.
const CACHE_TTL_SECONDS = 300;
const QUERY_TIMEOUT_MS = 9000;

interface CacheStorageLike {
  match: (req: Request) => Promise<Response | undefined>;
  put: (req: Request, res: Response) => Promise<void>;
}

function getEdgeCache(): CacheStorageLike | undefined {
  return (globalThis as unknown as { caches?: { default: CacheStorageLike } }).caches?.default;
}

export async function getPosts(limit = 100): Promise<Post[]> {
  const cache = getEdgeCache();
  const cacheKey = new Request('https://cache.local/posts?domain=' + DOMAIN + '&limit=' + limit);

  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return (await hit.json()) as Post[];
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);

    const { data, error } = await supabase
      .from('network_posts')
      .select('id,slug,title,meta_description,featured_image,published_at,domain')
      .eq('domain', DOMAIN)
      .limit(limit)
      .abortSignal(controller.signal);

    clearTimeout(timer);

    const posts =
      !error && data && data.length > 0
        ? (data as Post[]).sort(
            (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
          )
        : [];

    if (cache) {
      await cache.put(
        cacheKey,
        new Response(JSON.stringify(posts), {
          headers: {
            'Content-Type': 'application/json',
            // Resultado vazio (banco lento) dura menos, para nao servir
            // pagina sem artigo por muito tempo.
            'Cache-Control': 'public, max-age=' + (posts.length > 0 ? CACHE_TTL_SECONDS : 30),
          },
        })
      );
    }

    return posts;
  } catch (err) {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('network_posts')
      .select('*')
      .eq('domain', DOMAIN)
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      return data as Post;
    }

    const { data: fallbackData } = await supabase
      .from('network_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (fallbackData) {
      return fallbackData as Post;
    }

    return null;
  } catch (err) {
    return null;
  }
}