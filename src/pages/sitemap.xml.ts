import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';

export const GET: APIRoute = async () => {
  const siteUrl = 'https://vidigalbergue.com.br';
  const staticPages = [
    '',
    '/blog',
    '/sobre',
    '/contato',
    '/privacidade',
    '/termos'
  ];

  const posts = await getPosts();

  const staticXml = staticPages.map(page => `
    <url>
      <loc>${siteUrl}${page}</loc>
      <changefreq>weekly</changefreq>
      <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>
  `).join('');

  const postsXml = posts.map(post => `
    <url>
      <loc>${siteUrl}/${post.slug}</loc>
      <lastmod>${new Date(post.published_at).toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
  `).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticXml}
  ${postsXml}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};