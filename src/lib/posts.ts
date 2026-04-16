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

  // 2. Carregar posts do Supabase (Se configurado)
  const numericId = parseInt(networkId);
  if (supabase && !isNaN(numericId) && numericId > 0) {
    try {
      const { data: dbPosts, error: dbError } = await supabase
        .from('posts')
        .select('*')
        .eq('network_site_id', numericId)
        .eq('is_published', true);

      if (dbError) throw dbError;

      if (dbPosts) {
        dbPosts.forEach(p => {
          if (!posts.find(local => local.slug === p.slug)) {
            posts.push({
              slug: p.slug,
              title: p.title,
              description: p.description || '',
              pubDate: p.pub_date,
              heroImage: p.hero_image,
              category: p.category || 'Geral',
              author: 'Equipe',
              draft: false,
              tags: [],
            });
          }
        });
      }
    } catch (e) {
      console.error('[Scaffold Supabase Error]', e);
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

  // 2. Tentar Supabase
  if (supabase && networkId !== '0') {
    try {
      const { data: p } = await supabase
        .from('posts')
        .select('*')
        .eq('network_site_id', parseInt(networkId))
        .eq('slug', slug)
        .single();

      if (p) {
        return {
          slug: p.slug,
          title: p.title,
          description: p.description || '',
          pubDate: p.pub_date,
          heroImage: p.hero_image,
          category: p.category || 'Geral',
          author: 'Equipe',
          draft: false,
          tags: [],
          body: p.content || '',
        };
      }
    } catch (e) {
      return null;
    }
  }

  return null;
}
