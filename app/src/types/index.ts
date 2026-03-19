export interface Escritorio {
  id: string
  user_id: string
  nome: string
  plano?: string
  email?: string
  telefone?: string
  cpf_cnpj?: string
  created_at?: string
  subscription_status?: 'trial' | 'active' | 'cancelled'
  subscription_id?: string
  abacatepay_customer_id?: string
  notif_email_ativo?: boolean
  notif_dias_antecedencia?: number
  notif_ultimo_envio?: string
}

export interface MembroEscritorio {
  id: string
  escritorio_id: string
  user_id?: string
  email: string
  role: 'admin' | 'contador' | 'assistente'
  status: 'pendente' | 'ativo'
  invited_by?: string
  created_at?: string
}

export interface Cliente {
  id: string
  escritorio_id?: string
  razao_social: string
  nome_fantasia?: string
  cnpj?: string
  regime?: string
  responsavel?: string
  telefone?: string
  email?: string
  honorarios?: number
  dia_vencimento?: number
  situacao?: 'em_dia' | 'pendente' | 'atrasado'
  ie?: string
  cnae?: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  complemento?: string
  municipio?: string
  estado?: string
  data_abertura?: string
  aliq_irpj?: number
  aliq_csll?: number
  aliq_pis?: number
  aliq_cofins?: number
  aliq_iss?: number
  observacoes?: string
  email_acesso?: string
  senha_acesso?: string
  created_at?: string
}

export interface Lancamento {
  id: string
  escritorio_id?: string
  cliente_id?: string
  data_lanc: string
  historico: string
  conta_debito?: string
  conta_credito?: string
  valor: number
  tipo?: 'debito' | 'credito'
  status?: 'pendente' | 'aprovado' | 'cancelado'
  numero_doc?: string
  centro_custo?: string
  created_at?: string
  clientes?: { razao_social: string }
}

export interface LancamentoModelo {
  id: string
  escritorio_id?: string
  nome: string
  historico?: string
  conta_debito?: string
  conta_credito?: string
  tipo?: 'debito' | 'credito'
  valor?: number
  centro_custo?: string
  cliente_id?: string
  created_at?: string
}

export interface ContaPlano {
  id: string
  escritorio_id?: string
  codigo: string
  descricao: string
  grupo?: string
  tipo?: 'Sintética' | 'Analítica'
  natureza?: 'Devedora' | 'Credora'
  demonstrativo?: string
  conta_pai?: string
  ativa?: boolean
  observacoes?: string
  saldo_atual?: number
  created_at?: string
}

export interface Colaborador {
  id: string
  escritorio_id?: string
  cliente_id?: string
  nome: string
  cpf?: string
  pis?: string
  data_nascimento?: string
  cargo?: string
  cbo?: string
  tipo_contrato?: 'CLT' | 'Temporário' | 'Aprendiz' | 'Estágio'
  status_colab?: 'ativo' | 'ferias' | 'afastado' | 'demitido'
  departamento?: string
  salario_bruto?: number
  dependentes?: number
  vale_transporte?: boolean
  vale_refeicao?: number
  email?: string
  telefone?: string
  ctps?: string
  banco?: string
  agencia?: string
  conta_bancaria?: string
  observacoes?: string
  created_at?: string
  clientes?: { razao_social: string }
}

export interface Obrigacao {
  id: string
  escritorio_id?: string
  cliente_id?: string
  tipo: string
  vencimento: string
  status?: 'pendente' | 'atrasado' | 'transmitido'
  clientes?: { razao_social: string }
  created_at?: string
}

export interface TransacaoBancaria {
  id: string
  escritorio_id?: string
  cliente_id?: string
  data_transacao: string
  descricao: string
  valor: number
  tipo?: 'credito' | 'debito'
  conciliada?: boolean
  lancamento_id?: string
  created_at?: string
}

export interface Tarefa {
  id: string
  escritorio_id?: string
  cliente_id?: string
  titulo: string
  descricao?: string
  status: 'aberta' | 'em_andamento' | 'concluida'
  prioridade: 'baixa' | 'media' | 'alta'
  responsavel?: string
  data_vencimento?: string
  created_at?: string
  clientes?: { razao_social: string }
}

export interface UserProfile {
  id: string
  email: string
  nome_completo?: string
  plano?: string
}

export interface Honorario {
  id: string
  escritorio_id?: string
  cliente_id: string
  mes_ref: string        // 'YYYY-MM'
  valor: number
  status: 'pendente' | 'pago' | 'atrasado'
  data_pagamento?: string
  observacoes?: string
  created_at?: string
  clientes?: { razao_social: string; honorarios?: number }
}

export interface Atendimento {
  id: string
  escritorio_id?: string
  cliente_id?: string
  tipo: 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'outro'
  assunto: string
  descricao?: string
  data_atendimento: string
  duracao_min?: number
  responsavel?: string
  created_at?: string
  clientes?: { razao_social: string }
}

export interface RegistroTempo {
  id: string
  escritorio_id?: string
  cliente_id?: string
  descricao: string
  inicio: string
  fim?: string
  minutos?: number
  responsavel?: string
  created_at?: string
  clientes?: { razao_social: string }
}

export interface Guia {
  id: string
  escritorio_id?: string
  cliente_id?: string
  tipo: string
  descricao?: string
  mes_ref: string
  valor?: number
  data_vencimento?: string
  status: 'pendente' | 'emitida' | 'paga'
  data_pagamento?: string
  observacoes?: string
  created_at?: string
  clientes?: { razao_social: string }
}

export interface ChecklistDocumento {
  id: string
  escritorio_id?: string
  cliente_id?: string
  mes_ref: string
  tipo_documento: string
  status: 'aguardando' | 'recebido'
  observacoes?: string
  data_recebimento?: string
  created_at?: string
  clientes?: { razao_social: string }
}

export interface NotaServico {
  id: string
  escritorio_id?: string
  cliente_id?: string
  numero: number
  data_emissao: string
  descricao_servico: string
  valor_servico: number
  aliquota_iss?: number
  valor_iss?: number
  aliquota_ir?: number
  valor_ir?: number
  valor_liquido?: number
  tomador_razao?: string
  tomador_cnpj?: string
  tomador_municipio?: string
  status: 'emitida' | 'cancelada'
  observacoes?: string
  created_at?: string
  clientes?: { razao_social: string }
}
