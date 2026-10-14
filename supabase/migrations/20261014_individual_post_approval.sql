-- Execute no SQL Editor do Supabase INSTA-IA antes de habilitar aprovação individual.
ALTER TABLE public.social_plan_items ADD COLUMN IF NOT EXISTS approved_at timestamptz;
CREATE INDEX IF NOT EXISTS social_plan_items_approved_queue_idx ON public.social_plan_items (scheduled_at) WHERE approved_at IS NOT NULL;
