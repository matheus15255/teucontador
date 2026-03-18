-- Adicionar campos de perfil na tabela escritorios
-- Rodar no Supabase Dashboard > SQL Editor

ALTER TABLE escritorios
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
