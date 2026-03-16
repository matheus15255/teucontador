-- Corrige registros antigos que possam ter 'concluida' (com acento) para 'concluido'
UPDATE obrigacoes SET status = 'concluido' WHERE status = 'concluida';
