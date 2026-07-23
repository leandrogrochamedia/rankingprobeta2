-- ============================================================
-- PROOFLY — CRIAR COLUNAS (rode PRIMEIRO, sozinho)
-- Supabase → SQL Editor → Run
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'review_type'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN review_type TEXT DEFAULT 'client_to_professional';
    RAISE NOTICE 'Coluna review_type criada';
  ELSE
    RAISE NOTICE 'Coluna review_type já existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN user_id UUID;
    RAISE NOTICE 'Coluna user_id criada';
  ELSE
    RAISE NOTICE 'Coluna user_id já existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN source TEXT;
    RAISE NOTICE 'Coluna source criada';
  ELSE
    RAISE NOTICE 'Coluna source já existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna is_verified criada';
  ELSE
    RAISE NOTICE 'Coluna is_verified já existe';
  END IF;
END $$;

-- Confirme o resultado (deve listar 4 linhas):
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
  AND column_name IN ('review_type', 'user_id', 'source', 'is_verified')
ORDER BY column_name;-- ============================================================
-- PROOFLY — BACKFILL + CONSTRAINTS (rode SOMENTE DEPOIS do 009_fix_reviews_colunas.sql)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'is_verified'
  ) THEN
    RAISE EXCEPTION 'Coluna is_verified não existe. Rode 009_fix_reviews_colunas.sql primeiro.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'source'
  ) THEN
    RAISE EXCEPTION 'Coluna source não existe. Rode 009_fix_reviews_colunas.sql primeiro.';
  END IF;
END $$;

UPDATE public.reviews SET review_type = 'client_to_professional' WHERE review_type IS NULL;

UPDATE public.reviews
SET is_verified = COALESCE(verified, FALSE)
WHERE is_verified IS NULL;

ALTER TABLE public.reviews ALTER COLUMN is_verified SET DEFAULT FALSE;
ALTER TABLE public.reviews ALTER COLUMN is_verified SET NOT NULL;

UPDATE public.reviews
SET source = 'cliente'
WHERE source IS NULL
  AND COALESCE(review_type, 'client_to_professional') IN ('client_to_professional', 'client_to_establishment');

UPDATE public.reviews
SET source = 'estabelecimento'
WHERE source IS NULL AND review_type = 'establishment_to_professional';

UPDATE public.reviews
SET source = 'profissional'
WHERE source IS NULL AND review_type = 'professional_to_establishment';

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_review_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_review_type_check
  CHECK (review_type IN (
    'client_to_professional', 'establishment_to_professional',
    'client_to_establishment', 'professional_to_establishment', 'profile_like'
  ));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_source_check
  CHECK (source IS NULL OR source IN ('cliente', 'estabelecimento', 'profissional'));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_target_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_target_check
  CHECK (professional_id IS NOT NULL OR establishment_id IS NOT NULL);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_type ON public.reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON public.reviews(is_verified);

NOTIFY pgrst, 'reload schema';-- ============================================================
-- PROOFLY — Atualizar tabela reviews (RODE INTEIRO, 1x)
-- Supabase → SQL Editor → New query → Run
-- ============================================================

-- ETAPA 1: Criar colunas (sem UPDATE ainda)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_type TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN;

-- Defaults
ALTER TABLE public.reviews ALTER COLUMN review_type SET DEFAULT 'client_to_professional';
UPDATE public.reviews SET review_type = 'client_to_professional' WHERE review_type IS NULL;

ALTER TABLE public.reviews ALTER COLUMN is_verified SET DEFAULT FALSE;
UPDATE public.reviews SET is_verified = COALESCE(verified, FALSE) WHERE is_verified IS NULL;
ALTER TABLE public.reviews ALTER COLUMN is_verified SET NOT NULL;

-- ETAPA 2: Backfill source (só depois que a coluna existe)
UPDATE public.reviews
SET source = 'cliente'
WHERE source IS NULL
  AND COALESCE(review_type, 'client_to_professional') IN ('client_to_professional', 'client_to_establishment');

UPDATE public.reviews
SET source = 'estabelecimento'
WHERE source IS NULL
  AND review_type = 'establishment_to_professional';

UPDATE public.reviews
SET source = 'profissional'
WHERE source IS NULL
  AND review_type = 'professional_to_establishment';

-- ETAPA 3: Constraints
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_review_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_review_type_check
  CHECK (review_type IN (
    'client_to_professional',
    'establishment_to_professional',
    'client_to_establishment',
    'professional_to_establishment',
    'profile_like'
  ));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_source_check
  CHECK (source IS NULL OR source IN ('cliente', 'estabelecimento', 'profissional'));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_target_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_target_check
  CHECK (professional_id IS NOT NULL OR establishment_id IS NOT NULL);

-- ETAPA 4: FK + índices
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_type ON public.reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON public.reviews(is_verified);

NOTIFY pgrst, 'reload schema';--- Separador 009a ---
-- ============================================================
-- PROOFLY — PASSO 1 (se o script completo falhar)
-- Rode SOMENTE isto primeiro, depois rode 009b
-- ============================================================

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_type TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN;

ALTER TABLE public.reviews ALTER COLUMN review_type SET DEFAULT 'client_to_professional';
ALTER TABLE public.reviews ALTER COLUMN is_verified SET DEFAULT FALSE;--- Separador 009b ---
-- ============================================================
-- PROOFLY — PASSO 2 (rode DEPOIS do 009a)
-- ============================================================

UPDATE public.reviews SET review_type = 'client_to_professional' WHERE review_type IS NULL;
UPDATE public.reviews SET is_verified = COALESCE(verified, FALSE) WHERE is_verified IS NULL;
ALTER TABLE public.reviews ALTER COLUMN is_verified SET NOT NULL;

UPDATE public.reviews
SET source = 'cliente'
WHERE source IS NULL
  AND COALESCE(review_type, 'client_to_professional') IN ('client_to_professional', 'client_to_establishment');

UPDATE public.reviews
SET source = 'estabelecimento'
WHERE source IS NULL AND review_type = 'establishment_to_professional';

UPDATE public.reviews
SET source = 'profissional'
WHERE source IS NULL AND review_type = 'professional_to_establishment';

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_review_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_review_type_check
  CHECK (review_type IN (
    'client_to_professional', 'establishment_to_professional',
    'client_to_establishment', 'professional_to_establishment', 'profile_like'
  ));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_source_check
  CHECK (source IS NULL OR source IN ('cliente', 'estabelecimento', 'profissional'));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_target_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_target_check
  CHECK (professional_id IS NOT NULL OR establishment_id IS NOT NULL);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_type ON public.reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON public.reviews(is_verified);

NOTIFY pgrst, 'reload schema';