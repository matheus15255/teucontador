-- Adiciona campo de data de expiração da assinatura paga
-- Rodar no Supabase SQL Editor uma vez

ALTER TABLE escritorios
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Quando o webhook do AbacatePay confirmar pagamento, setar:
--   subscription_status = 'active'
--   subscription_expires_at = now() + interval '30 days'  (ou a data real do próximo ciclo)
--
-- Quando cancelar ou não renovar:
--   subscription_status = 'cancelled'
