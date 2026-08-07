import { z } from "zod";

/** مخطط Zod لـ public/data/graph/links.json */
export const GraphNodeSchema = z.object({
  kind: z.string().min(1),
  slug: z.string().min(1),
  titleAr: z.string().optional(),
});

export const GraphLinkSchema = z.object({
  from: GraphNodeSchema,
  to: GraphNodeSchema,
  rel: z.string().min(1),
  labelAr: z.string().optional(),
  autoReverse: z.boolean().optional(),
});

export const KnowledgeGraphSchema = z.object({
  version: z.number().int().positive(),
  generatedAt: z.string().optional(),
  descriptionAr: z.string().optional(),
  nodes: z.array(GraphNodeSchema).min(1),
  links: z.array(GraphLinkSchema).min(1),
});

export type KnowledgeGraphParsed = z.infer<typeof KnowledgeGraphSchema>;
