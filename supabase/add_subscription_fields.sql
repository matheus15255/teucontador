-- Adicionar campos de assinatura na tabela escritorios
-- Rodar no Supabase Dashboard > SQL Editor

ALTER TABLE escritorios
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS abacatepay_customer_id TEXT;

-- subscription_status possíveis: 'trial' | 'active' | 'cancelled'
