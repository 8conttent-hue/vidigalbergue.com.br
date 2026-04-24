/**
 * Motor de Posts Híbrido:
 * Carrega posts locais (Markdown) e posts remotos (Supabase).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const BLOG_DIR = resolve(process.cwd(), 'src/content/blog');

// ENVs injetadas pela Vercel/Deploy
const supabaseUrl = import.meta.env.SUPABASE_URL || '';
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY || '';
const networkId  = import.meta.env.NETWORK_SITE_ID || '0';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
const CACHE_TTL_MS = 60_000;

type CacheEntry = { at: number; posts: any[] };
const POSTS_CACHE = ((globalThis as any).__SF_POSTS_CACHE ||= new Map<string, CacheEntry>()) as Map<string, CacheEntry>;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  heroImage: string;
  category: string;
  author: string;
  draft: boolean;
  tags: string[];
}

export interface Post extends PostMeta {
  body: string;
}

async function fetchDbPostsWithRetry(siteId: string, maxAttempts = 3): Promise<any[]> {
  if (!supabase) return [];
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 7000);
    try {
      const { data: dbPosts, error: dbError } = await supabase
        .from('network_posts')
        .select('slug,title,meta_description,published_at,featured_image')
        .eq('network_site_id', parseInt(siteId) || 0)
        .order('published_at', { ascending: false })
        .abortSignal(ctrl.signal);
      if (!dbError) return dbPosts || [];
      lastError = dbError;
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < maxAttempts) await sleep(250 * attempt);
  }
  throw lastError;
}

function parseFrontmatter(raw: string): { meta: Record<string, any>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, any> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === 'true') meta[key] = true;
    else if (val === 'false') meta[key] = false;
    else meta[key] = val;
  }

  return { meta, body: match[2].trim() };
}

export async function getAllPosts(includeDrafts = false): Promise<PostMeta[]> {
  const posts: PostMeta[] = [];

  // 1. Carregar posts locais (.md)
  try {
    if (existsSync(BLOG_DIR)) {
      const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
      for (const file of files) {
        try {
          const raw = readFileSync(resolve(BLOG_DIR, file), 'utf-8');
          const { meta } = parseFrontmatter(raw);
          const slug = file.replace('.md', '');
          if (!includeDrafts && meta.draft === true) continue;
          posts.push({
            slug,
            title: meta.title || slug,
            description: meta.description || '',
            pubDate: meta.pubDate || '',
            heroImage: meta.heroImage || '',
            category: meta.category || 'Geral',
            author: meta.author || '',
            draft: meta.draft === true,
            tags: [],
          });
        } catch { /* pula */ }
      }
    }
  } catch { /* ignore list error */ }

  // 2. Carregar posts do Supabase (network_posts)
  if (supabase && networkId && networkId !== '0') {
    const cacheKey = `all:${networkId}`;
    try {
      const dbPosts = await fetchDbPostsWithRetry(networkId, 3);
      POSTS_CACHE.set(cacheKey, { at: Date.now(), posts: dbPosts });

      if (dbPosts) {
        dbPosts.forEach((p: any) => {
          if (!posts.find(local => local.slug === p.slug)) {
            posts.push({
              slug: p.slug,
              title: p.title,
              description: p.meta_description || '',
              pubDate: p.published_at,
              heroImage: p.featured_image || '',
              category: 'Geral',
              author: 'Equipe',
              draft: false,
              tags: [],
            });
          }
        });
      }
    } catch (e) {
      console.error('[8links Supabase Error]', e);
      const cached = POSTS_CACHE.get(cacheKey);
      if (cached && (Date.now() - cached.at) <= CACHE_TTL_MS) {
        cached.posts.forEach((p: any) => {
          if (!posts.find(local => local.slug === p.slug)) {
            posts.push({
              slug: p.slug,
              title: p.title,
              description: p.meta_description || '',
              pubDate: p.published_at,
              heroImage: p.featured_image || '',
              category: 'Geral',
              author: 'Equipe',
              draft: false,
              tags: [],
            });
          }
        });
      }
    }
  }

  return posts.sort((a, b) =>
    new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
  );
}

export async function getPost(slug: string): Promise<Post | null> {
  // 1. Tentar local
  try {
    const localPath = resolve(BLOG_DIR, `${slug}.md`);
    if (existsSync(localPath)) {
      const raw = readFileSync(localPath, 'utf-8');
      const { meta, body } = parseFrontmatter(raw);
      return {
        slug,
        title: meta.title || slug,
        description: meta.description || '',
        pubDate: meta.pubDate || '',
        heroImage: meta.heroImage || '',
        category: meta.category || 'Geral',
        author: meta.author || '',
        draft: meta.draft === true,
        tags: [],
        body,
      };
    }
  } catch { /* pula para o banco */ }

  // 2. Tentar Supabase (network_posts)
  if (supabase && networkId && networkId !== '0') {
    const cacheKey = `all:${networkId}`;
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 7000);
      const { data: p, error } = await supabase
        .from('network_posts')
        .select('*')
        .eq('network_site_id', parseInt(networkId) || 0)
        .eq('slug', slug)
        .abortSignal(ctrl.signal)
        .single();
      clearTimeout(timeout);
      if (error) throw error;

      if (p) {
        return {
          slug: p.slug,
          title: p.title,
          description: p.meta_description || '',
          pubDate: p.published_at,
          heroImage: p.featured_image || '',
          category: 'Geral',
          author: 'Equipe',
          draft: false,
          tags: [],
          body: p.content || '',
        };
      }
    } catch (e) {
      const cached = POSTS_CACHE.get(cacheKey);
      if (cached && (Date.now() - cached.at) <= CACHE_TTL_MS) {
        const p = cached.posts.find((x: any) => x.slug === slug);
        if (p) {
          return {
            slug: p.slug,
            title: p.title,
            description: p.meta_description || '',
            pubDate: p.published_at,
            heroImage: p.featured_image || '',
            category: 'Geral',
            author: 'Equipe',
            draft: false,
            tags: [],
            body: p.content || '',
          };
        }
      }
      return null;
    }
  }

  return null;
}
