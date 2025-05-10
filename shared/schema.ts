import { z } from 'zod';

// ---------------------------------------------
// Shared data model for Assemblage
// ---------------------------------------------

// 1) Template family enum – expand as new families are added
export enum TemplateFamily {
  ScrambledMosaic = 'scrambledMosaic',
  PairedForms = 'pairedForms',
  Tiling = 'tiling',
  Crystal = 'crystal',
  // Add additional template families below as they are introduced
  // Example: Flowline = 'flowline',
}

// 2) Image --------------------------------------------------
export const imageSchema = z.object({
  id: z.string(),
  src: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(), // ISO date string
});
export type Image = z.infer<typeof imageSchema>;

// 3) Mask ---------------------------------------------------
export const maskSchema = z.object({
  id: z.string(),
  key: z.string(),
  family: z.enum([
    'basic',
    'abstract',
    'architectural',
    'sliced',
    'narrative',
    'altar',
    'tangram',
  ]),
  svg: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type Mask = z.infer<typeof maskSchema>;

// 4) Template ----------------------------------------------
export const templateSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  family: z.nativeEnum(TemplateFamily),
  description: z.string().optional(),
  params: z.unknown(), // free-form for now
});
export type Template = z.infer<typeof templateSchema>;

// 5) Collage -----------------------------------------------
export const collageSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  imageIds: z.array(z.string()),
  paramOverrides: z.record(z.any()),
  createdAt: z.string(),
});
export type Collage = z.infer<typeof collageSchema>;

// 6) Convenience helper: full schema bundle -----------------
export const schema = {
  image: imageSchema,
  mask: maskSchema,
  template: templateSchema,
  collage: collageSchema,
};

// Default export is the bundle so consumers can `import schema from '@shared/schema'`
export default schema; 