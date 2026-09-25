import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const robots = `User-agent: *
Allow: /

Sitemap: https://vidigalbergue.com.br/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};