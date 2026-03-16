-- Portal do Cliente — rodar no Supabase SQL Editor

-- 1. Adicionar colunas de acesso na tabela clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email_acesso text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS senha_acesso text;

-- 2. RPC: autenticar cliente
CREATE OR REPLACE FUNCTION login_cliente(p_email text, p_senha text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT row_to_json(c) INTO v_result
  FROM clientes c
  WHERE lower(trim(c.email_acesso)) = lower(trim(p_email))
    AND c.senha_acesso = p_senha
  LIMIT 1;
  RETURN v_result;
END;
$$;

-- 3. RPC: buscar todos os dados do cliente para o portal
CREATE OR REPLACE FUNCTION get_cliente_dados(p_id uuid, p_senha text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid boolean;
  v_result json;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM clientes WHERE id = p_id AND senha_acesso = p_senha
  ) INTO v_valid;

  IF NOT v_valid THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'cliente',     (SELECT row_to_json(c) FROM clientes c WHERE c.id = p_id),
    'lancamentos', COALESCE((SELECT json_agg(l ORDER BY l.data_lanc DESC) FROM lancamentos l WHERE l.cliente_id = p_id LIMIT 50), '[]'::json),
    'obrigacoes',  COALESCE((SELECT json_agg(o ORDER BY o.vencimento DESC) FROM obrigacoes o WHERE o.cliente_id = p_id LIMIT 30), '[]'::json),
    'transacoes',  COALESCE((SELECT json_agg(t ORDER BY t.data_transacao DESC) FROM transacoes_bancarias t WHERE t.cliente_id = p_id LIMIT 50), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
