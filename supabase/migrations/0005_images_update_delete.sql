-- Run in SQL editor or add as migration 0004
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can delete images" ON public.images;
CREATE POLICY "Anon can delete images"
  ON public.images
  FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Anon can update images" ON public.images;
CREATE POLICY "Anon can update images"
  ON public.images
  FOR UPDATE
  USING (true)
  WITH CHECK (true);