import { supabase } from './supabase'

async function callAI(system: string, userMessage: string, maxTokens = 400): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Não autenticado')

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Erro na IA (${res.status})`)
  return data.content?.[0]?.text ?? ''
}

// ─── Classificação de lançamento ────────────────────────────────────────────
export interface AISugestaoLancamento {
  conta_debito: string
  conta_credito: string
  explicacao: string
}

export async function sugerirContasLancamento(
  historico: string,
  contas: { codigo: string; descricao: string }[]
): Promise<AISugestaoLancamento | null> {
  if (!historico || historico.trim().length < 8) return null

  const contasList = contas
    .slice(0, 80)
    .map(c => `${c.codigo} — ${c.descricao}`)
    .join('\n')

  const system = `Você é um especialista em contabilidade brasileira com profundo conhecimento do plano de contas CFC.
Dado o histórico de um lançamento, sugira as contas de débito e crédito mais adequadas.
Responda APENAS com JSON válido, sem texto adicional, no formato:
{"conta_debito":"código","conta_credito":"código","explicacao":"motivo em 1 frase"}
Se não tiver contas suficientes para sugerir com segurança, retorne {"conta_debito":"","conta_credito":"","explicacao":"Contas insuficientes no plano"}`

  const userMessage = `Histórico do lançamento: "${historico}"

Plano de contas disponível:
${contasList || 'Nenhuma conta cadastrada ainda.'}`

  const text = await callAI(system, userMessage, 200)
  const json = JSON.parse(text.trim())
  if (!json.conta_debito && !json.conta_credito) return null
  return json as AISugestaoLancamento
}

// ─── Sugestões de conciliação ────────────────────────────────────────────────
export interface AISugestaoConc {
  ids: string[]
  explicacao: string
}

export async function sugerirConciliacao(
  transacao: { descricao: string; valor: number; tipo: string; data_transacao: string },
  lancamentos: { id: string; historico: string; valor: number; tipo: string; data_lanc: string }[]
): Promise<AISugestaoConc | null> {
  if (lancamentos.length === 0) return null

  const lancList = lancamentos
    .slice(0, 50)
    .map(l => `ID:${l.id} | ${l.data_lanc} | ${l.historico} | R$${l.valor} | ${l.tipo}`)
    .join('\n')

  const system = `Você é especialista em conciliação bancária brasileira.
Dada uma transação bancária, identifique os lançamentos contábeis mais prováveis de serem o par correto.
Considere: similaridade de descrição, valor próximo, data próxima e tipo compatível.
Responda APENAS com JSON válido:
{"ids":["id_mais_provavel","segundo","terceiro"],"explicacao":"motivo do primeiro em 1 frase"}`

  const userMessage = `Transação bancária:
- Descrição: "${transacao.descricao}"
- Valor: R$ ${transacao.valor}
- Data: ${transacao.data_transacao}
- Tipo: ${transacao.tipo}

Lançamentos disponíveis:
${lancList}`

  const text = await callAI(system, userMessage, 300)
  const json = JSON.parse(text.trim())
  if (!Array.isArray(json.ids) || json.ids.length === 0) return null
  return { ids: json.ids.slice(0, 3), explicacao: json.explicacao }
}
