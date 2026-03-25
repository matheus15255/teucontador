-- Fix: RLS policies com subquery retornando mais de 1 linha
-- Erro: "more than one row returned by a subquery used as an expression"
-- Causa: usuário possui escritórios duplicados na tabela escritorios
-- Solução: adicionar LIMIT 1 nas subqueries das policies

-- ─── guias ───────────────────────────────────────────────────────────────────
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'guias' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON guias', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "guias_escritorio" ON guias FOR ALL
  USING (escritorio_id = (SELECT id FROM escritorios WHERE user_id = auth.uid() LIMIT 1))
  WITH CHECK (escritorio_id = (SELECT id FROM escritorios WHERE user_id = auth.uid() LIMIT 1));

-- ─── checklist_documentos ────────────────────────────────────────────────────
DO $$ DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'checklist_documentos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON checklist_documentos', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "checklist_escritorio" ON checklist_documentos FOR ALL
  USING (escritorio_id = (SELECT id FROM escritorios WHERE user_id = auth.uid() LIMIT 1))
  WITH CHECK (escritorio_id = (SELECT id FROM escritorios WHERE user_id = auth.uid() LIMIT 1));

-- ─── Remover escritório duplicado (mantém o mais antigo) ─────────────────────
-- Roda APENAS se você tiver duplicados. Verifique antes:
-- SELECT user_id, COUNT(*) FROM escritorios GROUP BY user_id HAVING COUNT(*) > 1;
--
-- DELETE FROM escritorios
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
--     FROM escritorios
--   ) t WHERE rn > 1
-- );
