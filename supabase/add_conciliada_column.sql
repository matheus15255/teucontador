-- Adiciona a coluna 'conciliada' na tabela transacoes_bancarias
ALTER TABLE transacoes_bancarias
  ADD COLUMN IF NOT EXISTS conciliada BOOLEAN NOT NULL DEFAULT FALSE;
