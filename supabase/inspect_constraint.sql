-- Cole no SQL Editor do Supabase e execute para ver a definição exata do constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'obrigacoes'::regclass
  AND contype = 'c';
