-- Prevenir trial abuse: garantir que cada CPF/CNPJ só possa ter uma conta
-- Rodar no Supabase Dashboard > SQL Editor

-- Remove duplicatas existentes antes de adicionar a constraint
-- (mantém o registro mais antigo de cada cpf_cnpj)
DELETE FROM escritorios
WHERE id NOT IN (
  SELECT DISTINCT ON (cpf_cnpj) id
  FROM escritorios
  WHERE cpf_cnpj IS NOT NULL
  ORDER BY cpf_cnpj, created_at ASC
)
AND cpf_cnpj IS NOT NULL;

-- Adiciona constraint de unicidade
ALTER TABLE escritorios
  ADD CONSTRAINT escritorios_cpf_cnpj_unique UNIQUE (cpf_cnpj);
