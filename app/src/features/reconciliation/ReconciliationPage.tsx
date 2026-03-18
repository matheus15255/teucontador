import { useEffect, useState, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { Upload, Search, Link, Plus, X, Trash2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import type { TransacaoBancaria, Cliente } from '../../types'
import { sugerirConciliacao } from '../../lib/aiHelper'

const AIBadge = styled.div`
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(26,122,74,0.1); border: 1px solid rgba(26,122,74,0.25);
  border-radius: 6px; padding: 2px 8px; font-size: 10px; font-weight: 700;
  color: ${({ theme }) => theme.green}; letter-spacing: .3px; white-space: nowrap;
`
const AISugestaoBar = styled.div`
  background: linear-gradient(135deg, rgba(26,122,74,0.07), rgba(26,122,74,0.03));
  border: 1px solid rgba(26,122,74,0.18); border-radius: 9px;
  padding: 10px 14px; margin-bottom: 10px; font-size: 12px;
  color: ${({ theme }) => theme.textDim}; font-style: italic;
`

const overlayIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const modalIn = keyframes`from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); }`

const PageHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;`
const PageTitle = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const StatsRow = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }`
const StatCard = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 16px; box-shadow: ${({ theme }) => theme.shadow};
`
const StatLabel = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-bottom: 4px;`
const StatValue = styled.div<{ $color?: string }>`
  font-family: 'Playfair Display', serif; font-size: 22px; letter-spacing: -0.5px;
  color: ${({ theme, $color }) => $color || theme.text};
`

const Toolbar = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;`

const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 8px 13px; width: 280px;
  &:focus-within { border-color: ${({ theme }) => theme.greenMid}; }
  input { border: none; background: none; font-size: 13px; color: ${({ theme }) => theme.text}; outline: none; width: 100%; font-family: 'Inter', sans-serif; &::placeholder { color: ${({ theme }) => theme.textDim}; } }
  @media (max-width: 600px) { width: 100%; flex: 1; min-width: 0; }
`

const ActionBtn = styled(motion.button)<{ $primary?: boolean; $danger?: boolean }>`
  display: flex; align-items: center; gap: 8px; padding: 9px 16px;
  background: ${({ theme, $primary, $danger }) => $danger ? '#fef2f2' : $primary ? theme.green : theme.surface};
  color: ${({ theme, $primary, $danger }) => $danger ? '#dc2626' : $primary ? '#fff' : theme.textMid};
  border: 1.5px solid ${({ theme, $primary, $danger }) => $danger ? '#fca5a5' : $primary ? theme.green : theme.border};
  border-radius: 9px; font-size: 13px; font-weight: 500;
  font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s;
  &:hover { opacity: 0.88; }
`

const FilterSelect = styled.select`
  padding: 8px 13px; border-radius: 9px;
  border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; outline: none; cursor: pointer;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; }
`

const ConfirmOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: ${overlayIn} 0.18s ease;
`
const ConfirmBox = styled.div`
  background: ${({ theme }) => theme.surface}; border-radius: 14px;
  padding: 28px; width: 100%; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  text-align: center; animation: ${modalIn} 0.2s ease;
`
const ConfirmIcon = styled.div`
  width: 52px; height: 52px; border-radius: 50%; background: #fee2e2;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
`
const ConfirmTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 20px; color: ${({ theme }) => theme.text};
  margin-bottom: 8px;
`
const ConfirmSub = styled.div`
  font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-bottom: 24px; line-height: 1.5;
`
const ConfirmBtns = styled.div`display: flex; gap: 10px;`
const ConfirmCancel = styled.button`
  flex: 1; padding: 11px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface2}; color: ${({ theme }) => theme.textMid};
  font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.border}; }
`
const ConfirmDelete = styled.button`
  flex: 1; padding: 11px; border-radius: 9px; border: none;
  background: #dc2626; color: #fff;
  font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s;
  &:hover { background: #b91c1c; }
  &:disabled { opacity: 0.6; pointer-events: none; }
`

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`

const CardHead = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 17px; border-bottom: 1px solid ${({ theme }) => theme.border};
`
const CardTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 400; color: ${({ theme }) => theme.text};
`

const Table = styled.table`width: 100%; border-collapse: collapse;`
const Thead = styled.thead`
  th { padding: 10px 14px; text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: ${({ theme }) => theme.textDim}; background: ${({ theme }) => theme.surface2};
    border-bottom: 1px solid ${({ theme }) => theme.border}; }
`
const Tbody = styled.tbody`
  tr { border-bottom: 1px solid ${({ theme }) => theme.border}; transition: background 0.15s; &:last-child { border-bottom: none; } &:hover { background: ${({ theme }) => theme.surface2}; } }
  td { padding: 11px 14px; font-size: 13px; }
`

const TypeBadge = styled.span<{ $credit?: boolean }>`
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 20px;
  font-size: 10.5px; font-weight: 600;
  background: ${({ theme, $credit }) => $credit ? theme.posBg : theme.negBg};
  color: ${({ theme, $credit }) => $credit ? theme.pos : theme.neg};
`

const ConciliarBtn = styled.button`
  padding: 4px 11px; border-radius: 7px; font-size: 11px; font-weight: 600; cursor: pointer;
  background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green};
  border: 1px solid rgba(26,122,74,0.2); font-family: 'Inter', sans-serif; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.green}; color: #fff; }
`

const DesfazerBtn = styled.button`
  padding: 4px 11px; border-radius: 7px; font-size: 11px; font-weight: 600; cursor: pointer;
  background: transparent; color: ${({ theme }) => theme.textDim};
  border: 1px solid ${({ theme }) => theme.border}; font-family: 'Inter', sans-serif; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.negBg}; color: ${({ theme }) => theme.neg}; border-color: ${({ theme }) => theme.neg}; }
`

const EmptyState = styled.div`text-align: center; padding: 60px 20px; color: ${({ theme }) => theme.textDim};`

const DropZone = styled.div`
  border: 2px dashed ${({ theme }) => theme.border2}; border-radius: 12px; padding: 40px;
  text-align: center; cursor: pointer; transition: all 0.3s; margin-bottom: 20px;
  background: ${({ theme }) => theme.surface2};
  &:hover { border-color: ${({ theme }) => theme.greenMid}; background: ${({ theme }) => theme.greenLight}; }
`

// ─── Modal ────────────────────────────────────────────────────────────────────
const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: ${overlayIn} 0.18s ease;
  @media (max-width: 600px) { align-items: flex-end; padding: 0; }
`
const Modal = styled.div`
  background: ${({ theme }) => theme.surface}; border-radius: 16px;
  padding: 28px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${modalIn} 0.2s ease;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; overflow-y: auto; }
`
const ModalTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 20px; color: ${({ theme }) => theme.text};
  margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;
`
const Field = styled.div`display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px;`
const Label = styled.label`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${({ theme }) => theme.textDim};`
const Input = styled.input`
  padding: 9px 12px; border-radius: 8px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface2}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; outline: none;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; }
`
const Select = styled.select`
  padding: 9px 12px; border-radius: 8px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface2}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; outline: none;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; }
`
const SaveBtn = styled.button`
  width: 100%; padding: 11px; border-radius: 9px; background: ${({ theme }) => theme.green};
  color: #fff; border: none; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;
  cursor: pointer; margin-top: 4px; &:hover { opacity: 0.88; } &:disabled { opacity: 0.55; cursor: not-allowed; pointer-events: none; }
`

// ─── OFX Parser ───────────────────────────────────────────────────────────────
function extractOFXField(block: string, field: string): string | null {
  const xml = block.match(new RegExp(`<${field}[^>]*>([^<]+)<\\/${field}>`, 'i'))
  if (xml) return xml[1].trim()
  const sgml = block.match(new RegExp(`<${field}>([^\\n<]+)`, 'i'))
  if (sgml) return sgml[1].trim()
  return null
}

function formatOFXDate(d: string): string {
  const s = d.replace(/[^\d]/g, '').substring(0, 8)
  if (s.length >= 8) return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`
  return new Date().toISOString().split('T')[0]
}

function parseOFX(text: string): { date: string; amount: number; description: string }[] {
  const results: { date: string; amount: number; description: string }[] = []

  // XML format: closing tags present
  const xmlBlocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || []
  const blocks = xmlBlocks.length > 0
    ? xmlBlocks
    : text.split(/<STMTTRN>/i).slice(1)  // SGML: no closing tags

  for (const block of blocks) {
    const date = extractOFXField(block, 'DTPOSTED')
    const amount = extractOFXField(block, 'TRNAMT')
    const description = extractOFXField(block, 'MEMO') || extractOFXField(block, 'NAME') || ''
    if (date && amount) {
      results.push({
        date: formatOFXDate(date),
        amount: parseFloat(amount.replace(',', '.')),
        description: description.trim(),
      })
    }
  }
  return results
}

// ─── Constants ────────────────────────────────────────────────────────────────
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }
const fmt = (v: number) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

const blankForm = () => ({ descricao: '', valor: '', tipo: 'credito' as 'credito' | 'debito', data_transacao: new Date().toISOString().split('T')[0], cliente_id: '' })

// ─── Component ────────────────────────────────────────────────────────────────
export function ReconciliationPage() {
  const { escritorio } = useAuthStore()
  const escId = escritorio?.id
  const {
    transacoes: cachedTransacoes, setTransacoes: setCachedTransacoes,
    clientes: cachedClientes,
  } = useDataStore()

  const [transacoes, setTransacoes] = useState<TransacaoBancaria[]>(cachedTransacoes)
  const [filtered, setFiltered] = useState<TransacaoBancaria[]>([])
  const [search, setSearch] = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>(cachedClientes)
  const [loading, setLoading] = useState(cachedTransacoes.length === 0)
  const [importing, setImporting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState(blankForm())
  const [saving, setSaving] = useState(false)
  const [conciliarTransacao, setConciliarTransacao] = useState<TransacaoBancaria | null>(null)
  const [lancamentos, setLancamentos] = useState<{ id: string; historico: string; valor: number; tipo: string; data_lanc: string }[]>([])
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState('')
  const [conciliando, setConciliando] = useState(false)
  const [desfazendoId, setDesfazendoId] = useState<string | null>(null)
  const [aiSugestoesConc, setAiSugestoesConc] = useState<string[]>([])
  const [aiExplicacao, setAiExplicacao] = useState('')
  const [aiLoadingConc, setAiLoadingConc] = useState(false)
  const [ofxParsed, setOfxParsed] = useState<{ date: string; amount: number; description: string }[]>([])
  const [ofxClienteId, setOfxClienteId] = useState('')
  const [showOFXModal, setShowOFXModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importingRef = useRef(false)
  const savingRef = useRef(false)
  const conciliandoRef = useRef(false)

  const load = async () => {
    if (!escId) return
    if (transacoes.length === 0) setLoading(true)
    const [{ data: trans }, { data: cls }] = await Promise.all([
      supabase.from('transacoes_bancarias').select('*').eq('escritorio_id', escId).order('data_transacao', { ascending: false }),
      supabase.from('clientes').select('id,razao_social').eq('escritorio_id', escId).order('razao_social').limit(200),
    ])
    const result = (trans || []) as TransacaoBancaria[]
    setTransacoes(result)
    setCachedTransacoes(result)
    if (cls && cls.length > 0) setClientes(cls as Cliente[])
    setLoading(false)
  }

  useEffect(() => { load() }, [escId])

  useEffect(() => {
    let result = transacoes
    if (filterCliente) result = result.filter(t => t.cliente_id === filterCliente)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t => t.descricao?.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [transacoes, search, filterCliente])

  const handleApagarTudo = async () => {
    if (!escId) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('transacoes_bancarias')
        .delete()
        .eq('escritorio_id', escId)
      if (error) { toast.error(error.message); return }
      toast.success('Todas as transações foram apagadas.')
      setShowConfirmDelete(false)
      setFilterCliente('')
      setSearch('')
      load()
    } finally {
      setDeleting(false)
    }
  }

  const totalCredito = transacoes.filter(t => t.tipo === 'credito').reduce((s, t) => s + (Number(t.valor) || 0), 0)
  const totalDebito  = transacoes.filter(t => t.tipo === 'debito').reduce((s, t) => s + (Number(t.valor) || 0), 0)
  const conciliadas  = transacoes.filter(t => t.lancamento_id).length
  const pendentes    = transacoes.filter(t => !t.lancamento_id).length

  const abrirConciliar = async (t: TransacaoBancaria) => {
    setConciliarTransacao(t)
    setLancamentoSelecionado('')
    setAiSugestoesConc([])
    setAiExplicacao('')
    const cached = useDataStore.getState().lancamentos.map((l: any) => ({
      id: l.id,
      historico: l.historico,
      valor: l.valor,
      tipo: l.tipo,
      data_lanc: l.data_lanc,
    }))
    setLancamentos(cached)

    // Pede sugestões da IA em background
    if (cached.length > 0) {
      setAiLoadingConc(true)
      const sugestao = await sugerirConciliacao(
        { descricao: t.descricao, valor: t.valor, tipo: t.tipo ?? '', data_transacao: t.data_transacao },
        cached
      )
      if (sugestao) {
        setAiSugestoesConc(sugestao.ids)
        setAiExplicacao(sugestao.explicacao)
      }
      setAiLoadingConc(false)
    }
  }

  const confirmarConciliar = async () => {
    if (conciliandoRef.current) return
    if (!lancamentoSelecionado || !conciliarTransacao || !escId) return
    conciliandoRef.current = true
    setConciliando(true)
    try {
      const { error } = await supabase
        .from('transacoes_bancarias')
        .update({ lancamento_id: lancamentoSelecionado })
        .eq('id', conciliarTransacao.id)
        .eq('escritorio_id', escId)
      if (error) { toast.error(error.message); return }
      toast.success('Transação conciliada!')
      setConciliarTransacao(null)
      load()
    } finally {
      conciliandoRef.current = false
      setConciliando(false)
    }
  }

  const handleDesconciliar = async (id: string) => {
    if (!escId) return
    setDesfazendoId(id)
    try {
      const { error } = await supabase
        .from('transacoes_bancarias')
        .update({ lancamento_id: null })
        .eq('id', id)
        .eq('escritorio_id', escId)
      if (error) { toast.error(error.message); return }
      toast.info('Conciliação desfeita')
      load()
    } finally {
      setDesfazendoId(null)
    }
  }

  // ─── OFX Import ─────────────────────────────────────────────────────────────
  const handleImportOFX = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !escId) return
    e.target.value = ''
    try {
      const text = await file.text()
      const parsed = parseOFX(text)
      if (parsed.length === 0) { toast.error('Nenhuma transação encontrada no arquivo OFX'); return }
      setOfxParsed(parsed)
      setOfxClienteId('')
      setShowOFXModal(true)
    } catch {
      toast.error('Erro ao ler o arquivo OFX')
    }
  }

  const confirmarImportOFX = async () => {
    if (importingRef.current) return
    if (!escId || ofxParsed.length === 0) return
    importingRef.current = true
    setImporting(true)
    try {
      const rows = ofxParsed.map(t => ({
        escritorio_id: escId,
        descricao: t.description || 'Sem descrição',
        valor: Math.abs(t.amount),
        tipo: t.amount >= 0 ? 'credito' : 'debito',
        data_transacao: t.date,
        cliente_id: ofxClienteId || null,
      }))
      const { error } = await supabase.from('transacoes_bancarias').insert(rows)
      if (error) throw new Error(error.message)
      toast.success(`${rows.length} transações importadas com sucesso!`)
      setShowOFXModal(false)
      setOfxParsed([])
      load()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar transações')
    } finally {
      importingRef.current = false
      setImporting(false)
    }
  }

  // ─── Manual entry ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (savingRef.current) return
    if (!form.descricao || !form.valor) { toast.error('Preencha descrição e valor'); return }
    if (!escId) return
    savingRef.current = true
    setSaving(true)
    try {
      const { error } = await supabase.from('transacoes_bancarias').insert({
        escritorio_id: escId,
        descricao: form.descricao,
        valor: parseFloat(form.valor.replace(',', '.')),
        tipo: form.tipo,
        data_transacao: form.data_transacao,
        cliente_id: form.cliente_id || null,
      })
      if (error) { toast.error(error.message); return }
      toast.success('Transação adicionada!')
      setShowModal(false)
      setForm(blankForm())
      load()
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* hidden file input */}
      <input ref={fileInputRef} type="file" accept=".ofx,.qfx,.ofc" style={{ display: 'none' }} onChange={handleFileChange} />

      <motion.div variants={itemVariants}>
        <PageHeader>
          <div>
            <PageTitle>Conciliação <em>Bancária</em></PageTitle>
            <PageSub>Open Finance · {transacoes.length} transações importadas</PageSub>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ActionBtn onClick={handleImportOFX} disabled={importing} whileTap={{ scale: 0.97 }}>
              <Upload size={14} /> {importing ? 'Importando…' : 'Importar OFX'}
            </ActionBtn>
            <ActionBtn $primary onClick={() => setShowModal(true)} whileTap={{ scale: 0.97 }}>
              <Plus size={14} /> Nova Transação
            </ActionBtn>
            {transacoes.length > 0 && (
              <ActionBtn $danger onClick={() => setShowConfirmDelete(true)} whileTap={{ scale: 0.97 }}>
                <Trash2 size={14} /> Apagar Tudo
              </ActionBtn>
            )}
          </div>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatsRow>
          <StatCard whileHover={{ y: -2 }}>
            <StatLabel>Total Entradas</StatLabel>
            <StatValue $color="#1a7a4a">{fmt(totalCredito)}</StatValue>
          </StatCard>
          <StatCard whileHover={{ y: -2 }}>
            <StatLabel>Total Saídas</StatLabel>
            <StatValue $color="#c53030">{fmt(totalDebito)}</StatValue>
          </StatCard>
          <StatCard whileHover={{ y: -2 }}>
            <StatLabel>Conciliadas</StatLabel>
            <StatValue $color="#1a7a4a">{conciliadas}</StatValue>
          </StatCard>
          <StatCard whileHover={{ y: -2 }}>
            <StatLabel>Pendentes</StatLabel>
            <StatValue $color="#b45309">{pendentes}</StatValue>
          </StatCard>
        </StatsRow>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Toolbar>
          <SearchBox>
            <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
            <input placeholder="Buscar transação..." value={search} onChange={e => setSearch(e.target.value)} />
          </SearchBox>
          <FilterSelect value={filterCliente} onChange={e => setFilterCliente(e.target.value)}>
            <option value="">Todos os clientes</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.razao_social}</option>
            ))}
          </FilterSelect>
          {(filterCliente || search) && (
            <ActionBtn onClick={() => { setFilterCliente(''); setSearch('') }} whileTap={{ scale: 0.97 }}
              style={{ padding: '8px 12px' }}>
              <X size={13} /> Limpar filtros
            </ActionBtn>
          )}
        </Toolbar>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHead>
            <CardTitle>Extrato Bancário</CardTitle>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{pendentes} transações aguardando conciliação</div>
          </CardHead>
          {loading ? (
            <EmptyState>⏳ Carregando...</EmptyState>
          ) : transacoes.length === 0 ? (
            <div style={{ padding: '24px' }}>
              <DropZone onClick={handleImportOFX}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏦</div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 18, marginBottom: 6 }}>Nenhuma transação importada</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>Clique para importar um arquivo OFX ou use "Nova Transação" para lançar manualmente</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 6, background: '#e8f5ee', color: '#1a7a4a', fontSize: 11, fontWeight: 600 }}>OFX</span>
                  <span style={{ padding: '4px 10px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 600 }}>Open Banking</span>
                  <span style={{ padding: '4px 10px', borderRadius: 6, background: '#fef9e7', color: '#9a7c2a', fontSize: 11, fontWeight: 600 }}>CSV</span>
                </div>
              </DropZone>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <Thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </Thead>
                <Tbody>
                  {filtered.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {t.data_transacao ? new Date(t.data_transacao + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td>{t.descricao}</td>
                      <td><TypeBadge $credit={t.tipo === 'credito'}>{t.tipo === 'credito' ? '↑ Entrada' : '↓ Saída'}</TypeBadge></td>
                      <td style={{ fontWeight: 600, color: t.tipo === 'credito' ? '#1a7a4a' : '#c53030' }}>
                        {fmt(t.valor)}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px',
                          borderRadius: 20, fontSize: 10.5, fontWeight: 600,
                          background: t.lancamento_id ? '#dcfce7' : '#f3f4f6',
                          color: t.lancamento_id ? '#166534' : '#6b7280',
                        }}>
                          {t.lancamento_id ? '✓ Conciliada' : 'Pendente'}
                        </span>
                      </td>
                      <td>
                        {t.lancamento_id ? (
                          <DesfazerBtn
                            onClick={() => handleDesconciliar(t.id)}
                            disabled={desfazendoId === t.id}
                            style={{ opacity: desfazendoId === t.id ? 0.5 : 1, cursor: desfazendoId === t.id ? 'wait' : 'pointer' }}
                          >
                            {desfazendoId === t.id ? '...' : 'Desfazer'}
                          </DesfazerBtn>
                        ) : (
                          <ConciliarBtn onClick={() => abrirConciliar(t)}>
                            <Link size={11} style={{ marginRight: 4 }} />Conciliar
                          </ConciliarBtn>
                        )}
                      </td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ─── Modal Conciliar ─── */}
      {conciliarTransacao && (
        <Overlay onClick={() => setConciliarTransacao(null)}>
          <Modal onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <ModalTitle>
              Vincular Lançamento
              <X size={18} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setConciliarTransacao(null)} />
            </ModalTitle>
            <div style={{ fontSize: 12, marginBottom: 16, padding: '10px 14px', background: '#f3f4f6', borderRadius: 8 }}>
              <strong>{conciliarTransacao.descricao}</strong>
              <span style={{ float: 'right', fontWeight: 600, color: conciliarTransacao.tipo === 'credito' ? '#1a7a4a' : '#c53030' }}>
                {fmt(conciliarTransacao.valor)}
              </span>
            </div>
            {/* Sugestões da IA */}
            {aiLoadingConc && (
              <AISugestaoBar>
                <Sparkles size={12} style={{ display: 'inline', marginRight: 6 }} />
                IA analisando lançamentos mais prováveis...
              </AISugestaoBar>
            )}
            {!aiLoadingConc && aiSugestoesConc.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AIBadge><Sparkles size={10} /> Sugestões da IA</AIBadge>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{aiExplicacao}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aiSugestoesConc.map((id, idx) => {
                    const l = lancamentos.find(x => x.id === id)
                    if (!l) return null
                    return (
                      <div key={id}
                        onClick={() => setLancamentoSelecionado(id)}
                        style={{
                          padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                          background: lancamentoSelecionado === id ? 'rgba(26,122,74,0.12)' : 'rgba(26,122,74,0.05)',
                          border: `1.5px solid ${lancamentoSelecionado === id ? 'rgba(26,122,74,0.4)' : 'rgba(26,122,74,0.15)'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                        }}>
                        <span>
                          <span style={{ fontWeight: 700, marginRight: 6, color: '#1a7a4a' }}>#{idx + 1}</span>
                          {l.data_lanc ? new Date(l.data_lanc + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} · {l.historico}
                        </span>
                        <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(l.valor)}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, marginBottom: 4 }}>— ou escolha manualmente —</div>
              </div>
            )}

            <Field>
              <Label>Selecione o lançamento correspondente</Label>
              <Select value={lancamentoSelecionado} onChange={e => setLancamentoSelecionado(e.target.value)}>
                <option value="">— escolha um lançamento —</option>
                {lancamentos.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.data_lanc ? new Date(l.data_lanc + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} · {l.historico} · {fmt(l.valor)}
                  </option>
                ))}
              </Select>
            </Field>
            {lancamentos.length === 0 && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
                Nenhum lançamento do mesmo tipo encontrado. Crie o lançamento em Contabilidade primeiro.
              </div>
            )}
            <SaveBtn onClick={confirmarConciliar} disabled={!lancamentoSelecionado || conciliando}>
              {conciliando ? 'Salvando…' : 'Confirmar Conciliação'}
            </SaveBtn>
          </Modal>
        </Overlay>
      )}

      {/* ─── Modal Importar OFX ─── */}
      {showOFXModal && (
        <Overlay onClick={() => setShowOFXModal(false)}>
          <Modal onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <ModalTitle>
              Importar OFX
              <X size={18} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setShowOFXModal(false)} />
            </ModalTitle>

            {/* Resumo do arquivo */}
            <div style={{
              padding: '12px 14px', borderRadius: 9, marginBottom: 16,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Upload size={15} />
              <span><strong>{ofxParsed.length} transações</strong> encontradas no arquivo</span>
            </div>

            {/* Preview das primeiras 5 */}
            <div style={{ marginBottom: 16, maxHeight: 160, overflowY: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              {ofxParsed.slice(0, 5).map((t, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderBottom: i < 4 && i < ofxParsed.slice(0,5).length - 1 ? '1px solid #f3f4f6' : 'none',
                  fontSize: 12,
                }}>
                  <div style={{ color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 10 }}>
                    {t.description || 'Sem descrição'}
                  </div>
                  <div style={{ fontWeight: 600, flexShrink: 0, color: t.amount >= 0 ? '#16a34a' : '#dc2626' }}>
                    {t.amount >= 0 ? '+' : ''}{fmt(Math.abs(t.amount))}
                  </div>
                </div>
              ))}
              {ofxParsed.length > 5 && (
                <div style={{ padding: '7px 12px', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
                  + {ofxParsed.length - 5} transações adicionais
                </div>
              )}
            </div>

            {/* Seleção de cliente */}
            <Field>
              <Label>Vincular ao Cliente</Label>
              <Select value={ofxClienteId} onChange={e => setOfxClienteId(e.target.value)}>
                <option value="">— Sem cliente (extrato geral da empresa) —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.razao_social}</option>
                ))}
              </Select>
            </Field>

            <SaveBtn onClick={confirmarImportOFX} disabled={importing}>
              {importing ? 'Importando…' : `Importar ${ofxParsed.length} transações`}
            </SaveBtn>
          </Modal>
        </Overlay>
      )}

      {/* ─── Confirm Apagar Tudo ─── */}
      {showConfirmDelete && (
        <ConfirmOverlay onClick={() => setShowConfirmDelete(false)}>
          <ConfirmBox onClick={e => e.stopPropagation()}>
            <ConfirmIcon><Trash2 size={24} color="#dc2626" /></ConfirmIcon>
            <ConfirmTitle>Apagar tudo?</ConfirmTitle>
            <ConfirmSub>
              Esta ação vai remover <strong>{transacoes.length} transação{transacoes.length !== 1 ? 'ões' : ''}</strong> permanentemente.<br />
              Essa operação não pode ser desfeita.
            </ConfirmSub>
            <ConfirmBtns>
              <ConfirmCancel onClick={() => setShowConfirmDelete(false)}>Cancelar</ConfirmCancel>
              <ConfirmDelete onClick={handleApagarTudo} disabled={deleting}>
                {deleting ? 'Apagando…' : 'Sim, apagar tudo'}
              </ConfirmDelete>
            </ConfirmBtns>
          </ConfirmBox>
        </ConfirmOverlay>
      )}

      {/* ─── Modal Nova Transação ─── */}
      {showModal && (
        <Overlay onClick={() => setShowModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalTitle>
              Nova Transação
              <X size={18} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setShowModal(false)} />
            </ModalTitle>
            <Field>
              <Label>Descrição</Label>
              <Input placeholder="Ex: Pagamento fornecedor" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </Field>
            <Field>
              <Label>Valor (R$)</Label>
              <Input type="number" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
            </Field>
            <Field>
              <Label>Tipo</Label>
              <Select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'credito' | 'debito' }))}>
                <option value="credito">Entrada (Crédito)</option>
                <option value="debito">Saída (Débito)</option>
              </Select>
            </Field>
            <Field>
              <Label>Data</Label>
              <Input type="date" value={form.data_transacao} onChange={e => setForm(f => ({ ...f, data_transacao: e.target.value }))} />
            </Field>
            <Field>
              <Label>Cliente</Label>
              <Select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                <option value="">— Empresa (sem cliente vinculado) —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
              </Select>
            </Field>
            <SaveBtn onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : 'Salvar Transação'}</SaveBtn>
          </Modal>
        </Overlay>
      )}
    </motion.div>
  )
}
