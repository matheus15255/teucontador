-- Atualiza get_cliente_dados para incluir detalhes do lançamento conciliado em cada transação
-- Rodar no Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_cliente_dados(p_id uuid, p_senha text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cliente     RECORD;
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

  -- Transações com JOIN nos dados do lançamento conciliado
  SELECT json_agg(t ORDER BY t.data_transacao DESC) INTO v_transacoes
  FROM (
    SELECT
      tb.id,
      tb.descricao,
      tb.valor,
      tb.tipo,
      tb.data_transacao,
      tb.lancamento_id,
      l.historico   AS lanc_historico,
      l.valor       AS lanc_valor,
      l.data_lanc   AS lanc_data,
      l.conta_debito,
      l.conta_credito
    FROM transacoes_bancarias tb
    LEFT JOIN lancamentos l ON l.id = tb.lancamento_id
    WHERE tb.escritorio_id = v_cliente.escritorio_id
      AND tb.cliente_id = p_id
    ORDER BY tb.data_transacao DESC
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
