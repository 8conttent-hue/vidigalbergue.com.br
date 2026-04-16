import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string().optional().default(''),
    pubDate:     z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage:   z.string().optional().default(''),
    category:    z.string().optional().default('Geral'),
    tags:        z.array(z.string()).optional().default([]),
    author:      z.string().optional().default('Equipe Editorial'),
    draft:       z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
