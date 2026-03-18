-- Multi-usuário por escritório
-- Rodar no Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS membros_escritorio (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'contador'
                  CHECK (role IN ('admin', 'contador', 'assistente')),
  status        TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'ativo')),
  invited_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(escritorio_id, email)
);

ALTER TABLE membros_escritorio ENABLE ROW LEVEL SECURITY;

-- Dono do escritório tem acesso total
CREATE POLICY "owner_all" ON membros_escritorio
  USING (
    escritorio_id IN (SELECT id FROM escritorios WHERE user_id = auth.uid())
  )
  WITH CHECK (
    escritorio_id IN (SELECT id FROM escritorios WHERE user_id = auth.uid())
  );

-- Qualquer usuário pode ver seus próprios registros/convites (por user_id ou email)
CREATE POLICY "self_select" ON membros_escritorio
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = auth.jwt()->>'email'
  );

-- Usuário pode aceitar convite pendente (atualiza user_id e status)
CREATE POLICY "self_accept" ON membros_escritorio
  FOR UPDATE
  USING (email = auth.jwt()->>'email')
  WITH CHECK (email = auth.jwt()->>'email');
