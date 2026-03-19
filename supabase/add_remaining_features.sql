-- ─── Centros de Custo ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS centros_custo (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "centros_escritorio" ON centros_custo FOR ALL
  USING (escritorio_id = (SELECT id FROM escritorios WHERE user_id = auth.uid() LIMIT 1));

-- ─── Audit Log ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  tabela text NOT NULL,
  registro_id text,
  acao text NOT NULL,
  dados_antes jsonb,
  dados_depois jsonb,
  usuario_email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "audit_escritorio" ON audit_log FOR ALL
  USING (escritorio_id = (SELECT id FROM escritorios WHERE user_id = auth.uid() LIMIT 1));

-- ─── Webhooks ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  url text NOT NULL,
  evento text NOT NULL,
  ativo boolean DEFAULT true,
  secret text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "webhooks_escritorio" ON webhooks FOR ALL
  USING (escritorio_id = (SELECT id FROM escritorios WHERE user_id = auth.uid() LIMIT 1));
