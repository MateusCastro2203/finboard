-- ============================================================
-- FinBoard - Adicionar email único em profiles
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar coluna email (sem constraint ainda, para permitir backfill)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill: copiar email de auth.users para profiles existentes
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

-- 3. Aplicar constraint NOT NULL + UNIQUE após backfill
ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 4. Atualizar o trigger para salvar o email no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Índice para buscas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
