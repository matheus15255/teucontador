-- ============================================================
-- TEUcontador — Novas Funcionalidades 2026-03-15
-- Rodar no Supabase SQL Editor
-- ============================================================

-- ─── 1. HONORÁRIOS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS honorarios (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid REFERENCES escritorios(id) ON DELETE CASCADE NOT NULL,
  cliente_id    uuid REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  mes_ref       text NOT NULL,           -- 'YYYY-MM'
  valor         numeric(12,2) NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','pago','atrasado')),
  data_pagamento date,
  observacoes   text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (escritorio_id, cliente_id, mes_ref)
);

ALTER TABLE honorarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "honorarios_escritorio" ON honorarios
  FOR ALL USING (
    escritorio_id IN (SELECT id FROM escritorios WHERE user_id = auth.uid())
  );

-- ─── 2. ATENDIMENTOS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atendimentos (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id     uuid REFERENCES escritorios(id) ON DELETE CASCADE NOT NULL,
  cliente_id        uuid REFERENCES clientes(id) ON DELETE SET NULL,
  tipo              text NOT NULL DEFAULT 'outro'
                      CHECK (tipo IN ('ligacao','email','reuniao','whatsapp','outro')),
  assunto           text NOT NULL,
  descricao         text,
  data_atendimento  date NOT NULL DEFAULT CURRENT_DATE,
  duracao_min       integer,
  responsavel       text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "atendimentos_escritorio" ON atendimentos
  FOR ALL USING (
    escritorio_id IN (SELECT id FROM escritorios WHERE user_id = auth.uid())
  );

-- ─── 3. CONTROLE DE TEMPO ───────────────────────────────────
CREATE TABLE IF NOT EXISTS registros_tempo (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid REFERENCES escritorios(id) ON DELETE CASCADE NOT NULL,
  cliente_id    uuid REFERENCES clientes(id) ON DELETE SET NULL,
  descricao     text NOT NULL,
  inicio        timestamptz NOT NULL DEFAULT now(),
  fim           timestamptz,
  minutos       integer,
  responsavel   text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE registros_tempo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registros_tempo_escritorio" ON registros_tempo
  FOR ALL USING (
    escritorio_id IN (SELECT id FROM escritorios WHERE user_id = auth.uid())
  );

-- ─── 4. NOTAS DE SERVIÇO (NFS-e) ────────────────────────────
CREATE TABLE IF NOT EXISTS notas_servico (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id       uuid REFERENCES escritorios(id) ON DELETE CASCADE NOT NULL,
  cliente_id          uuid REFERENCES clientes(id) ON DELETE SET NULL,
  numero              serial,
  data_emissao        date NOT NULL DEFAULT CURRENT_DATE,
  descricao_servico   text NOT NULL,
  valor_servico       numeric(12,2) NOT NULL DEFAULT 0,
  aliquota_iss        numeric(5,2) DEFAULT 2,
  valor_iss           numeric(12,2) DEFAULT 0,
  aliquota_ir         numeric(5,2) DEFAULT 0,
  valor_ir            numeric(12,2) DEFAULT 0,
  valor_liquido       numeric(12,2) DEFAULT 0,
  tomador_razao       text,
  tomador_cnpj        text,
  tomador_municipio   text,
  status              text NOT NULL DEFAULT 'emitida'
                        CHECK (status IN ('emitida','cancelada')),
  observacoes         text,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE notas_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notas_servico_escritorio" ON notas_servico
  FOR ALL USING (
    escritorio_id IN (SELECT id FROM escritorios WHERE user_id = auth.uid())
  );
