-- ─── 1. Storage Bucket ────────────────────────────────────────────────────────
-- Execute no Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('cliente-arquivos', 'cliente-arquivos', true, 52428800)  -- 50 MB max
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Storage RLS Policies ──────────────────────────────────────────────────

-- Escritórios autenticados podem fazer upload
DROP POLICY IF EXISTS "authenticated_upload_cliente_arquivos" ON storage.objects;
CREATE POLICY "authenticated_upload_cliente_arquivos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cliente-arquivos');

-- Qualquer um pode ler (URLs públicas para download pelo cliente)
DROP POLICY IF EXISTS "public_read_cliente_arquivos" ON storage.objects;
CREATE POLICY "public_read_cliente_arquivos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cliente-arquivos');

-- Escritórios autenticados podem deletar
DROP POLICY IF EXISTS "authenticated_delete_cliente_arquivos" ON storage.objects;
CREATE POLICY "authenticated_delete_cliente_arquivos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cliente-arquivos');

-- ─── 3. Tabela cliente_arquivos ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cliente_arquivos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  cliente_id    uuid NOT NULL REFERENCES clientes(id)    ON DELETE CASCADE,
  nome_arquivo  text NOT NULL,
  storage_path  text NOT NULL,
  size_bytes    bigint,
  mimetype      text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE cliente_arquivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escritorios_manage_cliente_arquivos" ON cliente_arquivos;
CREATE POLICY "escritorios_manage_cliente_arquivos" ON cliente_arquivos
  FOR ALL
  USING (escritorio_id IN (SELECT id FROM escritorios WHERE user_id = auth.uid()));

-- ─── 4. Atualizar get_cliente_dados para incluir arquivos ─────────────────────
-- (Substitui a versão anterior do cliente_portal.sql)

CREATE OR REPLACE FUNCTION get_cliente_dados(p_id uuid, p_senha text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cliente RECORD;
  v_lancamentos json;
  v_obrigacoes  json;
  v_transacoes  json;
  v_arquivos    json;
BEGIN
  SELECT * INTO v_cliente
  FROM clientes
  WHERE id = p_id AND senha_acesso = p_senha;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT json_agg(l ORDER BY l.data_lanc DESC) INTO v_lancamentos
  FROM (
    SELECT id, historico, valor, tipo, data_lanc
    FROM lancamentos
    WHERE escritorio_id = v_cliente.escritorio_id
      AND cliente_id = p_id
    ORDER BY data_lanc DESC
    LIMIT 100
  ) l;

  SELECT json_agg(o ORDER BY o.vencimento) INTO v_obrigacoes
  FROM (
    SELECT id, tipo, vencimento, status
    FROM obrigacoes
    WHERE escritorio_id = v_cliente.escritorio_id
      AND cliente_id = p_id
    ORDER BY vencimento
    LIMIT 50
  ) o;

  SELECT json_agg(t ORDER BY t.data_transacao DESC) INTO v_transacoes
  FROM (
    SELECT id, descricao, valor, tipo, data_transacao, lancamento_id
    FROM transacoes_bancarias
    WHERE escritorio_id = v_cliente.escritorio_id
      AND cliente_id = p_id
    ORDER BY data_transacao DESC
    LIMIT 50
  ) t;

  SELECT json_agg(a ORDER BY a.created_at DESC) INTO v_arquivos
  FROM (
    SELECT id, nome_arquivo, storage_path, size_bytes, mimetype, created_at
    FROM cliente_arquivos
    WHERE escritorio_id = v_cliente.escritorio_id
      AND cliente_id = p_id
    ORDER BY created_at DESC
  ) a;

  RETURN json_build_object(
    'cliente',     row_to_json(v_cliente),
    'lancamentos', COALESCE(v_lancamentos, '[]'::json),
    'obrigacoes',  COALESCE(v_obrigacoes,  '[]'::json),
    'transacoes',  COALESCE(v_transacoes,  '[]'::json),
    'arquivos',    COALESCE(v_arquivos,    '[]'::json)
  );
END;
$$;
