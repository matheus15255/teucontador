-- Adiciona campos de configuração de notificações na tabela escritorios
-- Rodar no Supabase SQL Editor uma vez

ALTER TABLE escritorios
  ADD COLUMN IF NOT EXISTS notif_email_ativo       boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_dias_antecedencia integer   DEFAULT 7,
  ADD COLUMN IF NOT EXISTS notif_ultimo_envio      timestamptz;

-- pg_cron: agendar envio diário às 08:00 (horário UTC = 05:00 BRT)
-- Requer extensão pg_cron habilitada no Supabase (Dashboard → Database → Extensions)
-- Substitua <PROJECT_REF> e <ANON_KEY> pelos valores do seu projeto

-- SELECT cron.schedule(
--   'notify-obligations-daily',
--   '0 11 * * *',  -- 08:00 BRT (UTC-3) = 11:00 UTC
--   $$
--   SELECT net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/notify-obligations',
--     headers := '{"Content-Type":"application/json","x-notify-secret":"<NOTIFY_SECRET>"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- Para verificar jobs agendados:
-- SELECT * FROM cron.job;

-- Para remover:
-- SELECT cron.unschedule('notify-obligations-daily');
