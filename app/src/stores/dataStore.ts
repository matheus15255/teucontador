import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface DataState {
  clientes: any[]
  lancamentos: any[]
  obrigacoes: any[]
  colaboradores: any[]
  planoContas: any[]
  transacoes: any[]
  tarefas: any[]
  honorarios: any[]
  atendimentos: any[]
  registrosTempo: any[]
  notasServico: any[]
  guias: any[]
  checklistDocumentos: any[]
  contasPagarReceber: any[]
  loadedEscId: string | null
  preloading: boolean
  realtimeChannel: RealtimeChannel | null

  preload: (escId: string) => Promise<void>
  subscribe: (escId: string) => void
  unsubscribe: () => void
  setClientes: (d: any[]) => void
  setLancamentos: (d: any[]) => void
  setObrigacoes: (d: any[]) => void
  setColaboradores: (d: any[]) => void
  setPlanoContas: (d: any[]) => void
  setTransacoes: (d: any[]) => void
  setTarefas: (d: any[]) => void
  setHonorarios: (d: any[]) => void
  setAtendimentos: (d: any[]) => void
  setRegistrosTempo: (d: any[]) => void
  setNotasServico: (d: any[]) => void
  setGuias: (d: any[]) => void
  setChecklistDocumentos: (d: any[]) => void
  setContasPagarReceber: (d: any[]) => void
  invalidate: () => void
}

async function fetchClientes(escId: string) {
  const { data, error } = await supabase.from('clientes').select('*').eq('escritorio_id', escId).order('created_at', { ascending: false }).limit(500)
  if (error) console.error('[dataStore] fetchClientes:', error.message)
  return data || []
}
async function fetchLancamentos(escId: string) {
  const { data, error } = await supabase.from('lancamentos').select('*,clientes(razao_social)').eq('escritorio_id', escId).order('data_lanc', { ascending: false }).limit(500)
  if (error) console.error('[dataStore] fetchLancamentos:', error.message)
  return data || []
}
async function fetchObrigacoes(escId: string) {
  const { data, error } = await supabase.from('obrigacoes').select('*,clientes(razao_social)').eq('escritorio_id', escId).order('vencimento').limit(300)
  if (error) console.error('[dataStore] fetchObrigacoes:', error.message)
  return data || []
}
async function fetchColaboradores(escId: string) {
  const { data, error } = await supabase.from('colaboradores').select('*,clientes(razao_social)').eq('escritorio_id', escId).order('nome').limit(300)
  if (error) console.error('[dataStore] fetchColaboradores:', error.message)
  return data || []
}
async function fetchPlanoContas(escId: string) {
  const { data, error } = await supabase.from('plano_contas').select('*').eq('escritorio_id', escId).order('codigo').limit(500)
  if (error) console.error('[dataStore] fetchPlanoContas:', error.message)
  return data || []
}
async function fetchTransacoes(escId: string) {
  const { data, error } = await supabase.from('transacoes_bancarias').select('*').eq('escritorio_id', escId).order('data_transacao', { ascending: false }).limit(300)
  if (error) console.error('[dataStore] fetchTransacoes:', error.message)
  return data || []
}
async function fetchTarefas(escId: string) {
  const { data, error } = await supabase
    .from('tarefas')
    .select('id,titulo,status,prioridade,data_vencimento,responsavel,cliente_id,clientes(razao_social)')
    .eq('escritorio_id', escId)
    .order('data_vencimento', { ascending: true, nullsFirst: false })
    .limit(100)
  if (error) console.error('[dataStore] fetchTarefas:', error.message)
  return data || []
}
async function fetchHonorarios(escId: string) {
  const { data, error } = await supabase
    .from('honorarios')
    .select('*,clientes(razao_social,honorarios)')
    .eq('escritorio_id', escId)
    .order('mes_ref', { ascending: false })
    .limit(500)
  if (error) console.error('[dataStore] fetchHonorarios:', error.message)
  return data || []
}
async function fetchAtendimentos(escId: string) {
  const { data, error } = await supabase
    .from('atendimentos')
    .select('*,clientes(razao_social)')
    .eq('escritorio_id', escId)
    .order('data_atendimento', { ascending: false })
    .limit(300)
  if (error) console.error('[dataStore] fetchAtendimentos:', error.message)
  return data || []
}
async function fetchRegistrosTempo(escId: string) {
  const { data, error } = await supabase
    .from('registros_tempo')
    .select('*,clientes(razao_social)')
    .eq('escritorio_id', escId)
    .order('inicio', { ascending: false })
    .limit(300)
  if (error) console.error('[dataStore] fetchRegistrosTempo:', error.message)
  return data || []
}
async function fetchNotasServico(escId: string) {
  const { data, error } = await supabase
    .from('notas_servico')
    .select('*,clientes(razao_social)')
    .eq('escritorio_id', escId)
    .order('data_emissao', { ascending: false })
    .limit(300)
  if (error) console.error('[dataStore] fetchNotasServico:', error.message)
  return data || []
}
async function fetchGuias(escId: string) {
  try {
    const { data, error } = await supabase
      .from('guias')
      .select('*')
      .eq('escritorio_id', escId)
      .order('data_vencimento', { ascending: true })
      .limit(300)
    if (error) console.error('[dataStore] fetchGuias:', error.message)
    return data || []
  } catch {
    return []
  }
}
async function fetchChecklistDocumentos(_escId: string) {
  // tabela ainda não criada no banco — retorna vazio sem query
  return []
}
async function fetchContasPagarReceber(escId: string) {
  try {
    const { data, error } = await supabase
      .from('contas_pagar_receber')
      .select('*,clientes(razao_social)')
      .eq('escritorio_id', escId)
      .order('data_vencimento', { ascending: true })
      .limit(500)
    if (error) console.error('[dataStore] fetchContasPagarReceber:', error.message)
    return data || []
  } catch {
    return []
  }
}

export const useDataStore = create<DataState>((set, get) => ({
  clientes: [],
  lancamentos: [],
  obrigacoes: [],
  colaboradores: [],
  planoContas: [],
  transacoes: [],
  tarefas: [],
  honorarios: [],
  atendimentos: [],
  registrosTempo: [],
  notasServico: [],
  guias: [],
  checklistDocumentos: [],
  contasPagarReceber: [],
  loadedEscId: null,
  preloading: false,
  realtimeChannel: null,

  preload: async (escId: string) => {
    if (get().preloading || get().loadedEscId === escId) return
    set({ preloading: true })
    try {
      const results = await Promise.allSettled([
        fetchClientes(escId),
        fetchLancamentos(escId),
        fetchObrigacoes(escId),
        fetchColaboradores(escId),
        fetchPlanoContas(escId),
        fetchTransacoes(escId),
        fetchTarefas(escId),
        fetchHonorarios(escId),
        fetchAtendimentos(escId),
        fetchRegistrosTempo(escId),
        fetchNotasServico(escId),
        fetchGuias(escId),
        fetchChecklistDocumentos(escId),
        fetchContasPagarReceber(escId),
      ])
      const [
        clientes, lancamentos, obrigacoes, colaboradores,
        planoContas, transacoes, tarefas,
        honorarios, atendimentos, registrosTempo, notasServico,
        guias, checklistDocumentos, contasPagarReceber,
      ] = results.map((r, i) => {
        if (r.status === 'rejected') {
          console.error(`[dataStore] fetch[${i}] rejeitado:`, r.reason)
          return []
        }
        return r.value
      })
      set({
        clientes, lancamentos, obrigacoes, colaboradores,
        planoContas, transacoes, tarefas,
        honorarios, atendimentos, registrosTempo, notasServico,
        guias, checklistDocumentos, contasPagarReceber,
        loadedEscId: escId,
      })
      get().subscribe(escId)
    } catch (err) {
      console.error('[dataStore] preload falhou:', err)
    } finally {
      set({ preloading: false })
    }
  },

  subscribe: (escId: string) => {
    get().unsubscribe()
    const channel = supabase
      .channel(`datastore-${escId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes',              filter: `escritorio_id=eq.${escId}` }, async () => { set({ clientes:        await fetchClientes(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos',           filter: `escritorio_id=eq.${escId}` }, async () => { set({ lancamentos:     await fetchLancamentos(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'obrigacoes',            filter: `escritorio_id=eq.${escId}` }, async () => { set({ obrigacoes:      await fetchObrigacoes(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'colaboradores',         filter: `escritorio_id=eq.${escId}` }, async () => { set({ colaboradores:   await fetchColaboradores(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plano_contas',          filter: `escritorio_id=eq.${escId}` }, async () => { set({ planoContas:     await fetchPlanoContas(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_bancarias',  filter: `escritorio_id=eq.${escId}` }, async () => { set({ transacoes:      await fetchTransacoes(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefas',               filter: `escritorio_id=eq.${escId}` }, async () => { set({ tarefas:         await fetchTarefas(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'honorarios',            filter: `escritorio_id=eq.${escId}` }, async () => { set({ honorarios:      await fetchHonorarios(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atendimentos',          filter: `escritorio_id=eq.${escId}` }, async () => { set({ atendimentos:    await fetchAtendimentos(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_tempo',       filter: `escritorio_id=eq.${escId}` }, async () => { set({ registrosTempo:  await fetchRegistrosTempo(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notas_servico',         filter: `escritorio_id=eq.${escId}` }, async () => { set({ notasServico:    await fetchNotasServico(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guias',                 filter: `escritorio_id=eq.${escId}` }, async () => { set({ guias:            await fetchGuias(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_documentos',  filter: `escritorio_id=eq.${escId}` }, async () => { set({ checklistDocumentos: await fetchChecklistDocumentos(escId) }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_pagar_receber',  filter: `escritorio_id=eq.${escId}` }, async () => { set({ contasPagarReceber: await fetchContasPagarReceber(escId) }) })
      .subscribe()
    set({ realtimeChannel: channel })
  },

  unsubscribe: () => {
    const ch = get().realtimeChannel
    if (ch) { supabase.removeChannel(ch); set({ realtimeChannel: null }) }
  },

  setClientes:       (d) => set({ clientes: d }),
  setLancamentos:    (d) => set({ lancamentos: d }),
  setObrigacoes:     (d) => set({ obrigacoes: d }),
  setColaboradores:  (d) => set({ colaboradores: d }),
  setPlanoContas:    (d) => set({ planoContas: d }),
  setTransacoes:     (d) => set({ transacoes: d }),
  setTarefas:        (d) => set({ tarefas: d }),
  setHonorarios:     (d) => set({ honorarios: d }),
  setAtendimentos:   (d) => set({ atendimentos: d }),
  setRegistrosTempo: (d) => set({ registrosTempo: d }),
  setNotasServico:        (d) => set({ notasServico: d }),
  setGuias:               (d) => set({ guias: d }),
  setChecklistDocumentos: (d) => set({ checklistDocumentos: d }),
  setContasPagarReceber:  (d) => set({ contasPagarReceber: d }),
  invalidate:        ()  => set({ loadedEscId: null }),
}))
