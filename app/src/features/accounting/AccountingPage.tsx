import { useEffect, useState, useMemo, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import {
  Plus, Search, X, BookOpen,
  Edit2, Trash2, Download, ChevronLeft, ChevronRight,
  Star, Copy, Filter, FileSpreadsheet, FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { usePermission } from '../../hooks/usePermission'
import type { Lancamento, Cliente, ContaPlano, LancamentoModelo } from '../../types'

// ─── Styled ─────────────────────────────────────────────────────────────────

const PageHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;`
const PageTitle = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const BtnRow = styled.div`display: flex; gap: 8px; align-items: center; flex-wrap: wrap;`

const Btn = styled(motion.button)<{ $variant?: 'primary' | 'outline' | 'ghost' }>`
  display: flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 9px;
  font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s;
  ${({ theme, $variant = 'primary' }) => ({
    primary: `background:${theme.green};color:#fff;border:none;box-shadow:0 3px 12px rgba(26,122,74,0.25);&:hover{background:${theme.greenMid}}`,
    outline: `background:${theme.surface};color:${theme.textMid};border:1.5px solid ${theme.border};&:hover{border-color:${theme.border2};color:${theme.text}}`,
    ghost: `background:transparent;color:${theme.textDim};border:none;&:hover{background:${theme.surface2};color:${theme.text}}`,
  }[$variant])}
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const StatsRow = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }`
const StatCard = styled(motion.div)<{ $accent?: string }>`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 16px 18px; box-shadow: ${({ theme }) => theme.shadow};
  position: relative; overflow: hidden;
  &::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:${({ $accent }) => $accent || 'transparent'}; }
`
const StatLabel = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.4px;`
const StatValue = styled.div<{ $color?: string }>`font-family: 'Playfair Display', serif; font-size: 22px; letter-spacing: -0.5px; color: ${({ theme, $color }) => $color || theme.text};`

const TabRow = styled.div`
  display: flex; gap: 2px; background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 3px; margin-bottom: 16px; width: fit-content;`
const Tab = styled.button<{ $active: boolean }>`
  padding: 7px 16px; border-radius: 7px; font-size: 12.5px; font-weight: ${({ $active }) => $active ? 600 : 400};
  color: ${({ theme, $active }) => $active ? theme.green : theme.textDim};
  background: ${({ theme, $active }) => $active ? theme.surface : 'transparent'};
  border: none; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
  box-shadow: ${({ $active }) => $active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'};`

const Filters = styled.div`display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;`
const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 8px 13px; width: 260px;
  transition: all 0.2s; &:focus-within { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
  input { border: none; background: none; font-size: 13px; color: ${({ theme }) => theme.text}; outline: none; width: 100%; font-family: 'Inter', sans-serif; &::placeholder { color: ${({ theme }) => theme.textDim}; } }
  @media (max-width: 600px) { width: 100%; flex: 1; min-width: 0; }`
const FilterSelect = styled.select`
  padding: 8px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text}; font-size: 12.5px;
  font-family: 'Inter', sans-serif; cursor: pointer; outline: none;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; }`
const FilterInput = styled.input`
  padding: 8px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text}; font-size: 12.5px;
  font-family: 'Inter', sans-serif; outline: none;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; }`

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};`

const Table = styled.table`width: 100%; border-collapse: collapse;`
const Thead = styled.thead`th {
  padding: 10px 14px; text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: 0.8px;
  text-transform: uppercase; color: ${({ theme }) => theme.textDim}; background: ${({ theme }) => theme.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.border}; white-space: nowrap; cursor: pointer; user-select: none;
  &:hover { color: ${({ theme }) => theme.text}; } }`
const Tbody = styled.tbody`
  tr { border-bottom: 1px solid ${({ theme }) => theme.border}; transition: background 0.15s; &:last-child { border-bottom: none; } &:hover { background: ${({ theme }) => theme.surface2}; } }
  td { padding: 10px 14px; font-size: 12.5px; }`

const TypeBadge = styled.span<{ $credit?: boolean }>`
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px;
  border-radius: 20px; font-size: 10.5px; font-weight: 600;
  background: ${({ theme, $credit }) => $credit ? theme.posBg : theme.negBg};
  color: ${({ theme, $credit }) => $credit ? theme.pos : theme.neg};`

const StatusBadge = styled.span<{ $s: string }>`
  display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600;
  background: ${({ theme, $s }) => $s === 'aprovado' ? theme.posBg : $s === 'cancelado' ? theme.negBg : theme.warnBg};
  color: ${({ theme, $s }) => $s === 'aprovado' ? theme.pos : $s === 'cancelado' ? theme.neg : theme.warn};`

const ActBtn = styled.button`
  width: 28px; height: 28px; border-radius: 7px; background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border}; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: ${({ theme }) => theme.textDim}; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green}; border-color: rgba(26,122,74,0.2); }`
const ActBtnDanger = styled(ActBtn)`&:hover { background: ${({ theme }) => theme.negBg}; color: ${({ theme }) => theme.neg}; border-color: rgba(220,38,38,0.2); }`

const Pagination = styled.div`
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  padding: 12px 16px; border-top: 1px solid ${({ theme }) => theme.border};`
const PageInfo = styled.div`font-size: 12px; color: ${({ theme }) => theme.textDim};`
const PageBtns = styled.div`display: flex; gap: 4px;`
const PageBtn = styled.button<{ $active?: boolean }>`
  width: 30px; height: 30px; border-radius: 7px; font-size: 12px; font-weight: 500;
  border: 1px solid ${({ theme, $active }) => $active ? theme.green : theme.border};
  background: ${({ theme, $active }) => $active ? theme.green : theme.surface};
  color: ${({ theme, $active }) => $active ? '#fff' : theme.textMid};
  cursor: pointer; transition: all 0.15s; &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { border-color: ${({ theme }) => theme.green}; }`

const EmptyState = styled.div`text-align: center; padding: 60px 20px; color: ${({ theme }) => theme.textDim};`

// Modal
const overlayIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const modalIn = keyframes`from { opacity: 0; transform: scale(0.94) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); }`

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(5px);
  z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: ${overlayIn} 0.18s ease;
  @media (max-width: 600px) { align-items: flex-end; padding: 0; }`
const Modal = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px; width: 100%; max-width: 600px; max-height: 92vh; overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadowLg}; animation: ${modalIn} 0.22s ease;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; }`
const ModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid ${({ theme }) => theme.border}; position: sticky; top: 0;
  background: ${({ theme }) => theme.surface}; z-index: 1;`
const ModalTitle = styled.div`font-family: 'Playfair Display', serif; font-size: 21px; font-weight: 400; color: ${({ theme }) => theme.text};`
const ModalBody = styled.div`padding: 22px 24px;`
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 24px; border-top: 1px solid ${({ theme }) => theme.border};
  position: sticky; bottom: 0; background: ${({ theme }) => theme.surface};`

const FormGrid = styled.div<{ $cols?: number }>`
  display: grid; grid-template-columns: repeat(${({ $cols }) => $cols || 2}, 1fr); gap: 14px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }`
const Field = styled.div<{ $span?: number }>`grid-column: ${({ $span }) => $span ? `1 / span ${$span}` : 'auto'};`
const FieldLabel = styled.label`
  display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
  text-transform: uppercase; color: ${({ theme }) => theme.textDim}; margin-bottom: 6px;`
const Input = styled.input`
  width: 100%; padding: 10px 13px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; font-size: 13px;
  color: ${({ theme }) => theme.text}; outline: none; font-family: 'Inter', sans-serif; transition: all 0.2s;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
  &::placeholder { color: ${({ theme }) => theme.textDim}; }`
const Select = styled.select`
  width: 100%; padding: 10px 13px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; font-size: 13px;
  color: ${({ theme }) => theme.text}; outline: none; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }`
const CancelBtn = styled.button`
  padding: 10px 20px; border-radius: 9px; background: ${({ theme }) => theme.surface2};
  border: 1.5px solid ${({ theme }) => theme.border}; font-size: 13px; font-weight: 500;
  color: ${({ theme }) => theme.textMid}; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;`
const SaveBtn = styled.button`
  padding: 10px 22px; border-radius: 9px; background: ${({ theme }) => theme.green};
  color: #fff; border: none; font-size: 13px; font-weight: 600;
  font-family: 'Inter', sans-serif; cursor: pointer; box-shadow: 0 3px 12px rgba(26,122,74,0.25);
  transition: background 0.2s;
  &:hover:not(:disabled) { background: ${({ theme }) => theme.greenMid}; } &:disabled { opacity: 0.55; cursor: not-allowed; pointer-events: none; }`

const SectionDivider = styled.div`
  font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
  color: ${({ theme }) => theme.textDim}; margin: 18px 0 12px; display: flex; align-items: center; gap: 8px;
  &::after { content:''; flex:1; height:1px; background:${({ theme }) => theme.border}; }`

// Modelos
const ModeloGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; padding: 14px 16px;`
const ModeloCard = styled(motion.div)`
  padding: 13px 14px; border-radius: 10px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface2}; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.greenMid}; background: ${({ theme }) => theme.greenLight}; }`
const ModeloName = styled.div`font-size: 12.5px; font-weight: 600; color: ${({ theme }) => theme.text}; margin-bottom: 3px;`
const ModeloSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim};`
const ModeloActions = styled.div`display: flex; gap: 4px; margin-top: 10px;`

const CloseBtn = styled.button`
  width: 32px; height: 32px; border-radius: 8px; background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border}; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: ${({ theme }) => theme.textDim}; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.negBg}; color: ${({ theme }) => theme.neg}; }`


// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 15
const fmt = (v: number) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

const blankForm = {
  data_lanc: new Date().toISOString().split('T')[0],
  historico: '',
  conta_debito: '',
  conta_credito: '',
  valor: '',
  tipo: 'credito' as 'credito' | 'debito',
  cliente_id: '',
  numero_doc: '',
}

const blankModelo = { nome: '', historico: '', conta_debito: '', conta_credito: '', tipo: 'credito' as 'credito' | 'debito', valor: '', cliente_id: '' }

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }
const modalAnim = { initial: { scale: 0.93, opacity: 0, y: 20 }, animate: { scale: 1, opacity: 1, y: 0 }, exit: { scale: 0.95, opacity: 0, y: 10 }, transition: { duration: 0.22 } }

// ─── Component ───────────────────────────────────────────────────────────────

export function AccountingPage() {
  const { canEdit, canDelete } = usePermission()
  const { escritorio } = useAuthStore()
  const escId = escritorio?.id
  const {
    lancamentos: cachedLancamentos, setLancamentos: setCachedLancamentos,
    clientes: cachedClientes,
  } = useDataStore()

  const [lancamentos, setLancamentos] = useState<Lancamento[]>(cachedLancamentos)
  const [clientes, setClientes] = useState<Cliente[]>(cachedClientes)
  const [contas, setContas] = useState<ContaPlano[]>([])
  const [modelos, setModelos] = useState<LancamentoModelo[]>([])
  const [loading, setLoading] = useState(cachedLancamentos.length === 0)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  // tabs
  const [activeTab, setActiveTab] = useState<'lancamentos' | 'modelos'>('lancamentos')

  // filters
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [filterMes, setFilterMes] = useState('')
  const [filterAno, setFilterAno] = useState(String(new Date().getFullYear()))
  const [sortCol, setSortCol] = useState<'data_lanc' | 'valor' | 'historico'>('data_lanc')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // modals
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...blankForm })
  const [showModeloModal, setShowModeloModal] = useState(false)
  const [modeloForm, setModeloForm] = useState({ ...blankModelo })

  const load = async () => {
    if (!escId) return
    if (lancamentos.length === 0) setLoading(true)
    const [{ data: lancs }, { data: ctas }, { data: mods }, { data: cls }] = await Promise.all([
      supabase.from('lancamentos').select('*,clientes(razao_social)').eq('escritorio_id', escId).order('data_lanc', { ascending: false }).limit(500),
      supabase.from('plano_contas').select('id,codigo,descricao').eq('escritorio_id', escId).order('codigo'),
      supabase.from('lancamento_modelos').select('*').eq('escritorio_id', escId).order('nome'),
      supabase.from('clientes').select('id,razao_social').eq('escritorio_id', escId).order('razao_social').limit(200),
    ])
    const resultLancs = (lancs || []) as Lancamento[]
    setLancamentos(resultLancs)
    setCachedLancamentos(resultLancs)
    setContas((ctas || []) as ContaPlano[])
    setModelos((mods || []) as LancamentoModelo[])
    if (cls && cls.length > 0) setClientes(cls as Cliente[])
    setLoading(false)
  }

  useEffect(() => { load() }, [escId])

  // ── Filtered + sorted + paged ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...lancamentos]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        l.historico?.toLowerCase().includes(q) ||
        l.conta_debito?.includes(q) ||
        l.conta_credito?.includes(q) ||
        l.numero_doc?.includes(q) ||
        (l as any).clientes?.razao_social?.toLowerCase().includes(q)
      )
    }
    if (filterTipo) list = list.filter(l => l.tipo === filterTipo)
    if (filterCliente) list = list.filter(l => l.cliente_id === filterCliente)
    if (filterAno) list = list.filter(l => l.data_lanc?.startsWith(filterAno))
    if (filterMes) list = list.filter(l => l.data_lanc?.substring(5, 7) === filterMes)

    list.sort((a, b) => {
      let va: any = a[sortCol], vb: any = b[sortCol]
      if (sortCol === 'valor') { va = Number(va); vb = Number(vb) }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [lancamentos, search, filterTipo, filterCliente, filterAno, filterMes, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const { totalCredito, totalDebito, saldo } = useMemo(() => {
    const totalCredito = lancamentos.filter(l => l.tipo === 'credito').reduce((s, l) => s + (Number(l.valor) || 0), 0)
    const totalDebito  = lancamentos.filter(l => l.tipo === 'debito').reduce((s, l) => s + (Number(l.valor) || 0), 0)
    return { totalCredito, totalDebito, saldo: totalCredito - totalDebito }
  }, [lancamentos])

  // ── Sort toggle ───────────────────────────────────────────────────────────
  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
    setPage(1)
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const openAdd = () => { setForm({ ...blankForm }); setEditingId(null); setShowModal(true) }

  const openEdit = (l: Lancamento) => {
    setForm({
      data_lanc: l.data_lanc || blankForm.data_lanc,
      historico: l.historico || '',
      conta_debito: l.conta_debito || '',
      conta_credito: l.conta_credito || '',
      valor: String(l.valor || ''),
      tipo: l.tipo || 'credito',
      cliente_id: l.cliente_id || '',
      numero_doc: l.numero_doc || '',
    })
    setEditingId(l.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (savingRef.current) return
    if (!form.historico || !form.valor) { toast.error('Preencha histórico e valor'); return }
    if (!escId) { toast.error('Escritório não carregado'); return }
    savingRef.current = true
    setSaving(true)
    const payload = {
      escritorio_id: escId,
      data_lanc: form.data_lanc,
      historico: form.historico,
      conta_debito: form.conta_debito || null,
      conta_credito: form.conta_credito || null,
      valor: Number(form.valor),
      tipo: form.tipo,
      cliente_id: form.cliente_id || null,
      numero_doc: form.numero_doc || null,
    }
    try {
      let error
      if (editingId) {
        const { escritorio_id: _eid, ...updatePayload } = payload
        const res = await supabase.from('lancamentos').update(updatePayload).eq('id', editingId).eq('escritorio_id', escId!)
        error = res.error
      } else {
        const res = await supabase.from('lancamentos').insert(payload)
        error = res.error
      }
      if (error) { toast.error(error.message); return }
      toast.success(editingId ? 'Lançamento atualizado!' : 'Lançamento registrado!')
      setShowModal(false)
      load()
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const handleDelete = async (l: Lancamento) => {
    if (!confirm(`Excluir lançamento "${l.historico}"?`)) return
    const { error } = await supabase.from('lancamentos').delete().eq('id', l.id)
    if (error) { toast.error(error.message); return }
    toast.success('Lançamento excluído')
    load()
  }

  const handleDuplicate = (l: Lancamento) => {
    setForm({
      data_lanc: new Date().toISOString().split('T')[0],
      historico: l.historico || '',
      conta_debito: l.conta_debito || '',
      conta_credito: l.conta_credito || '',
      valor: String(l.valor || ''),
      tipo: l.tipo || 'credito',
      cliente_id: l.cliente_id || '',
      numero_doc: '',
    })
    setEditingId(null)
    setShowModal(true)
    toast.info('Lançamento duplicado — confirme os dados')
  }

  // ── Modelos ───────────────────────────────────────────────────────────────
  const saveModelo = async () => {
    if (savingRef.current) return
    if (!modeloForm.nome) { toast.error('Nome do modelo é obrigatório'); return }
    if (!escId) { toast.error('Escritório não carregado'); return }
    savingRef.current = true
    setSaving(true)
    try {
      const { error } = await supabase.from('lancamento_modelos').insert({
        ...modeloForm,
        escritorio_id: escId,
        valor: modeloForm.valor ? Number(modeloForm.valor) : null,
        cliente_id: modeloForm.cliente_id || null,
      })
      if (error) { toast.error(error.message); return }
      toast.success('Modelo salvo!')
      setShowModeloModal(false)
      setModeloForm({ ...blankModelo })
      load()
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const deleteModelo = async (id: string) => {
    if (!confirm('Excluir modelo?')) return
    await supabase.from('lancamento_modelos').delete().eq('id', id)
    load()
  }

  const useModelo = (m: LancamentoModelo) => {
    setForm({
      data_lanc: new Date().toISOString().split('T')[0],
      historico: m.historico || '',
      conta_debito: m.conta_debito || '',
      conta_credito: m.conta_credito || '',
      valor: String(m.valor || ''),
      tipo: m.tipo || 'credito',
      cliente_id: m.cliente_id || '',
      numero_doc: '',
    })
    setEditingId(null)
    setShowModal(true)
    setActiveTab('lancamentos')
  }

  const saveAsModelo = (l: Lancamento) => {
    setModeloForm({
      nome: l.historico?.substring(0, 40) || '',
      historico: l.historico || '',
      conta_debito: l.conta_debito || '',
      conta_credito: l.conta_credito || '',
      tipo: l.tipo || 'credito',
      valor: String(l.valor || ''),
      cliente_id: l.cliente_id || '',
    })
    setShowModeloModal(true)
  }

  // ── Export ────────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const data = [
      ['Data', 'Nº Doc', 'Histórico', 'Conta Débito', 'Conta Crédito', 'Tipo', 'Valor (R$)', 'Cliente'],
      ...filtered.map(l => [
        l.data_lanc ? format(new Date(l.data_lanc + 'T00:00:00'), 'dd/MM/yyyy') : '',
        l.numero_doc || '',
        l.historico || '',
        l.conta_debito || '',
        l.conta_credito || '',
        l.tipo === 'credito' ? 'Crédito' : 'Débito',
        Number(l.valor) || 0,
        (l as any).clientes?.razao_social || '',
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos')
    XLSX.writeFile(wb, `Lancamentos_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Exportado com sucesso!')
  }

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Lançamentos Contábeis', 14, 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const mesLabel = filterMes ? meses.find(m => m.v === filterMes)?.l || '' : 'Todos'
    doc.text(`Período: ${mesLabel} / ${filterAno || 'Todos'}   |   Total: ${filtered.length} lançamentos   |   Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 14, 25)

    autoTable(doc, {
      startY: 30,
      head: [['Data', 'Nº Doc', 'Histórico', 'Ct. Débito', 'Ct. Crédito', 'Tipo', 'Valor (R$)', 'Cliente']],
      body: filtered.map(l => [
        l.data_lanc ? format(new Date(l.data_lanc + 'T00:00:00'), 'dd/MM/yyyy') : '',
        l.numero_doc || '',
        l.historico || '',
        l.conta_debito || '',
        l.conta_credito || '',
        l.tipo === 'credito' ? 'Crédito' : 'Débito',
        Number(l.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        (l as any).clientes?.razao_social || '',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [26, 122, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 250, 247] },
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 20 }, 2: { cellWidth: 55 },
        3: { cellWidth: 22 }, 4: { cellWidth: 22 }, 5: { cellWidth: 18 },
        6: { cellWidth: 26, halign: 'right' }, 7: { cellWidth: 20 }, 8: { cellWidth: 40 },
      },
    })

    const totalCr = filtered.filter(l => l.tipo === 'credito').reduce((s, l) => s + Number(l.valor || 0), 0)
    const totalDb = filtered.filter(l => l.tipo === 'debito').reduce((s, l) => s + Number(l.valor || 0), 0)
    const y = (doc as any).lastAutoTable.finalY + 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`Total Créditos: R$ ${totalCr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}   |   Total Débitos: R$ ${totalDb.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}   |   Saldo: R$ ${(totalCr - totalDb).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, y)

    doc.save(`Lancamentos_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF gerado com sucesso!')
  }

  const upd = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
  }
  const updM = (k: string, v: any) => setModeloForm(p => ({ ...p, [k]: v }))

  const sortIcon = (col: string) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const anos = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))
  const meses = [
    { v: '', l: 'Todos os meses' },
    ...Array.from({ length: 12 }, (_, i) => ({
      v: String(i + 1).padStart(2, '0'),
      l: format(new Date(2024, i, 1), 'MMMM', { locale: ptBR }),
    })),
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <motion.div variants={itemVariants}>
        <PageHeader>
          <div>
            <PageTitle>Lançamentos <em>Contábeis</em></PageTitle>
            <PageSub>Partidas dobradas · {lancamentos.length} registros</PageSub>
          </div>
          <BtnRow>
            <Btn $variant="outline" onClick={exportPDF} whileTap={{ scale: 0.97 }}>
              <FileText size={14} /> Exportar PDF
            </Btn>
            <Btn $variant="outline" onClick={exportExcel} whileTap={{ scale: 0.97 }}>
              <FileSpreadsheet size={14} /> Exportar Excel
            </Btn>
            <Btn $variant="outline" onClick={() => { setModeloForm({ ...blankModelo }); setShowModeloModal(true) }} whileTap={{ scale: 0.97 }} disabled={!canEdit} style={{ opacity: !canEdit ? 0.4 : 1, cursor: !canEdit ? 'not-allowed' : 'pointer' }}>
              <Star size={14} /> Novo Modelo
            </Btn>
            <Btn $variant="primary" onClick={openAdd} whileTap={{ scale: 0.97 }} disabled={!canEdit} style={{ opacity: !canEdit ? 0.4 : 1, cursor: !canEdit ? 'not-allowed' : 'pointer' }}>
              <Plus size={15} /> Novo Lançamento
            </Btn>
          </BtnRow>
        </PageHeader>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <StatsRow>
          <StatCard $accent="linear-gradient(90deg,#059669,#34d399)" whileHover={{ y: -1 }}>
            <StatLabel>Total Créditos</StatLabel>
            <StatValue $color="#059669">{fmt(totalCredito)}</StatValue>
          </StatCard>
          <StatCard $accent="linear-gradient(90deg,#dc2626,#f87171)" whileHover={{ y: -1 }}>
            <StatLabel>Total Débitos</StatLabel>
            <StatValue $color="#dc2626">{fmt(totalDebito)}</StatValue>
          </StatCard>
          <StatCard $accent={saldo >= 0 ? 'linear-gradient(90deg,#059669,#34d399)' : 'linear-gradient(90deg,#dc2626,#f87171)'} whileHover={{ y: -1 }}>
            <StatLabel>Saldo Líquido</StatLabel>
            <StatValue $color={saldo >= 0 ? '#059669' : '#dc2626'}>{fmt(saldo)}</StatValue>
          </StatCard>
          <StatCard $accent="linear-gradient(90deg,#6366f1,#a5b4fc)" whileHover={{ y: -1 }}>
            <StatLabel>Lançamentos</StatLabel>
            <StatValue>{filtered.length}</StatValue>
          </StatCard>
        </StatsRow>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <TabRow>
          <Tab $active={activeTab === 'lancamentos'} onClick={() => setActiveTab('lancamentos')}>
            <BookOpen size={13} style={{ display: 'inline', marginRight: 5 }} />
            Lançamentos
          </Tab>
          <Tab $active={activeTab === 'modelos'} onClick={() => setActiveTab('modelos')}>
            <Star size={13} style={{ display: 'inline', marginRight: 5 }} />
            Modelos ({modelos.length})
          </Tab>
        </TabRow>
      </motion.div>

      {activeTab === 'lancamentos' && (
        <>
          {/* Filters */}
          <motion.div variants={itemVariants}>
            <Filters>
              <SearchBox>
                <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
                <input placeholder="Buscar histórico, conta, cliente..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
              </SearchBox>
              <FilterSelect value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setPage(1) }}>
                <option value="">Todos os tipos</option>
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
              </FilterSelect>
              <FilterSelect value={filterCliente} onChange={e => { setFilterCliente(e.target.value); setPage(1) }}>
                <option value="">Todos os clientes</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
              </FilterSelect>
              <FilterSelect value={filterMes} onChange={e => { setFilterMes(e.target.value); setPage(1) }}>
                {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </FilterSelect>
              <FilterSelect value={filterAno} onChange={e => { setFilterAno(e.target.value); setPage(1) }}>
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </FilterSelect>
              {(search || filterTipo || filterCliente || filterMes) && (
                <Btn $variant="ghost" onClick={() => { setSearch(''); setFilterTipo(''); setFilterCliente(''); setFilterMes(''); setPage(1) }}>
                  <Filter size={13} /> Limpar
                </Btn>
              )}
            </Filters>
          </motion.div>

          {/* Table */}
          <motion.div variants={itemVariants}>
            <Card>
              {loading ? (
                <EmptyState>⏳ Carregando...</EmptyState>
              ) : paged.length === 0 ? (
                <EmptyState>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📒</div>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: 20, marginBottom: 6 }}>Nenhum lançamento</div>
                  <div style={{ fontSize: 13 }}>
                    {filtered.length === 0 && lancamentos.length > 0 ? 'Nenhum resultado para os filtros aplicados' : 'Clique em "Novo Lançamento" para começar'}
                  </div>
                </EmptyState>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table>
                    <Thead>
                      <tr>
                        <th onClick={() => toggleSort('data_lanc')}>Data{sortIcon('data_lanc')}</th>
                        <th>Nº Doc</th>
                        <th onClick={() => toggleSort('historico')}>Histórico{sortIcon('historico')}</th>
                        <th>Ct. Débito</th>
                        <th>Ct. Crédito</th>
                        <th>Tipo</th>
                        <th onClick={() => toggleSort('valor')}>Valor{sortIcon('valor')}</th>
                        <th>Cliente</th>
                        <th>Ações</th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {paged.map(l => (
                        <tr key={l.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 11.5, whiteSpace: 'nowrap' }}>
                            {l.data_lanc ? format(new Date(l.data_lanc + 'T00:00:00'), 'dd/MM/yyyy') : '—'}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{l.numero_doc || '—'}</td>
                          <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.historico}>{l.historico}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{l.conta_debito || '—'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{l.conta_credito || '—'}</td>
                          <td><TypeBadge $credit={l.tipo === 'credito'}>{l.tipo === 'credito' ? '↑ Créd' : '↓ Déb'}</TypeBadge></td>
                          <td style={{ fontWeight: 600, color: l.tipo === 'credito' ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>{fmt(l.valor)}</td>
                          <td style={{ fontSize: 11.5 }}>{(l as any).clientes?.razao_social || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 3 }}>
                              <ActBtn onClick={() => openEdit(l)} title="Editar" disabled={!canEdit}><Edit2 size={12} /></ActBtn>
                              <ActBtn onClick={() => handleDuplicate(l)} title="Duplicar"><Copy size={12} /></ActBtn>
                              <ActBtn onClick={() => saveAsModelo(l)} title="Salvar como modelo"><Star size={12} /></ActBtn>
                              <ActBtnDanger onClick={() => handleDelete(l)} title="Excluir" disabled={!canDelete} style={{ opacity: !canDelete ? 0.4 : 1, cursor: !canDelete ? 'not-allowed' : 'pointer' }}><Trash2 size={12} /></ActBtnDanger>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Tbody>
                  </Table>
                  <Pagination>
                    <PageInfo>
                      Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} lançamentos
                    </PageInfo>
                    <PageBtns>
                      <PageBtn onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={14} /></PageBtn>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                        return <PageBtn key={p} $active={p === page} onClick={() => setPage(p)}>{p}</PageBtn>
                      })}
                      <PageBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight size={14} /></PageBtn>
                    </PageBtns>
                  </Pagination>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}

      {activeTab === 'modelos' && (
        <motion.div variants={itemVariants}>
          <Card>
            {modelos.length === 0 ? (
              <EmptyState>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: 20, marginBottom: 6 }}>Nenhum modelo salvo</div>
                <div style={{ fontSize: 13 }}>Salve lançamentos frequentes como modelos para reutilizar rapidamente</div>
              </EmptyState>
            ) : (
              <ModeloGrid>
                {modelos.map(m => (
                  <ModeloCard key={m.id} whileHover={{ y: -2 }}>
                    <ModeloName>{m.nome}</ModeloName>
                    <ModeloSub>{m.historico || '—'}</ModeloSub>
                    <ModeloSub style={{ marginTop: 4 }}>
                      {m.tipo === 'credito' ? '↑ Crédito' : '↓ Débito'} {m.valor ? `· ${fmt(Number(m.valor))}` : ''}
                    </ModeloSub>
                    <ModeloActions>
                      <ActBtn onClick={() => useModelo(m)} title="Usar modelo" style={{ width: 'auto', padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>
                        <Download size={11} /> Usar
                      </ActBtn>
                      <ActBtnDanger onClick={() => deleteModelo(m.id)} title="Excluir modelo" disabled={!canDelete} style={{ opacity: !canDelete ? 0.4 : 1, cursor: !canDelete ? 'not-allowed' : 'pointer' }}>
                        <Trash2 size={11} />
                      </ActBtnDanger>
                    </ModeloActions>
                  </ModeloCard>
                ))}
              </ModeloGrid>
            )}
          </Card>
        </motion.div>
      )}

      {/* Modal lançamento */}
      {showModal && (
          <Overlay onClick={() => setShowModal(false)}>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHead>
                <ModalTitle>{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</ModalTitle>
                <CloseBtn onClick={() => setShowModal(false)}><X size={14} /></CloseBtn>
              </ModalHead>
              <ModalBody>
                <FormGrid>
                  <Field>
                    <FieldLabel>Data *</FieldLabel>
                    <Input type="date" value={form.data_lanc} onChange={e => upd('data_lanc', e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Tipo</FieldLabel>
                    <Select value={form.tipo} onChange={e => upd('tipo', e.target.value)}>
                      <option value="credito">↑ Crédito</option>
                      <option value="debito">↓ Débito</option>
                    </Select>
                  </Field>
                  <Field $span={2}>
                    <FieldLabel>Histórico *</FieldLabel>
                    <Input placeholder="Descrição do lançamento" value={form.historico} onChange={e => upd('historico', e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Conta Débito</FieldLabel>
                    <Input placeholder="Ex: 1.1.1.01" value={form.conta_debito} onChange={e => upd('conta_debito', e.target.value)} list="contas-db" />
                  </Field>
                  <Field>
                    <FieldLabel>Conta Crédito</FieldLabel>
                    <Input placeholder="Ex: 4.1.1.01" value={form.conta_credito} onChange={e => upd('conta_credito', e.target.value)} list="contas-db" />
                  </Field>

                </FormGrid>

                <SectionDivider>Valores e Classificação</SectionDivider>

                <FormGrid>
                  <Field>
                    <FieldLabel>Valor (R$) *</FieldLabel>
                    <Input type="number" step="0.01" min="0" placeholder="0,00" value={form.valor} onChange={e => upd('valor', e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Nº Documento</FieldLabel>
                    <Input placeholder="NF, contrato, guia..." value={form.numero_doc} onChange={e => upd('numero_doc', e.target.value)} />
                  </Field>
                  <Field $span={2}>
                    <FieldLabel>Cliente</FieldLabel>
                    <Select value={form.cliente_id} onChange={e => upd('cliente_id', e.target.value)}>
                      <option value="">Sem cliente vinculado</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                    </Select>
                  </Field>
                </FormGrid>

                <datalist id="contas-db">
                  {contas.map(c => <option key={c.id} value={c.codigo}>{c.descricao}</option>)}
                </datalist>
              </ModalBody>
              <ModalFooter>
                <CancelBtn onClick={() => setShowModal(false)}>Cancelar</CancelBtn>
                <SaveBtn onClick={handleSave} disabled={saving || !canEdit}>
                  {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Registrar Lançamento'}
                </SaveBtn>
              </ModalFooter>
            </Modal>
          </Overlay>
        )}

      {/* Modal modelo */}
      {showModeloModal && (
          <Overlay onClick={() => setShowModeloModal(false)}>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHead>
                <ModalTitle>Salvar Modelo</ModalTitle>
                <CloseBtn onClick={() => setShowModeloModal(false)}><X size={14} /></CloseBtn>
              </ModalHead>
              <ModalBody>
                <FormGrid>
                  <Field $span={2}>
                    <FieldLabel>Nome do Modelo *</FieldLabel>
                    <Input placeholder="Ex: Pagamento de aluguel, Receita de honorários..." value={modeloForm.nome} onChange={e => updM('nome', e.target.value)} />
                  </Field>
                  <Field $span={2}>
                    <FieldLabel>Histórico padrão</FieldLabel>
                    <Input placeholder="Descrição que será preenchida automaticamente" value={modeloForm.historico} onChange={e => updM('historico', e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Conta Débito</FieldLabel>
                    <Input placeholder="Ex: 1.1.1.01" value={modeloForm.conta_debito} onChange={e => updM('conta_debito', e.target.value)} list="contas-db" />
                  </Field>
                  <Field>
                    <FieldLabel>Conta Crédito</FieldLabel>
                    <Input placeholder="Ex: 4.1.1.01" value={modeloForm.conta_credito} onChange={e => updM('conta_credito', e.target.value)} list="contas-db" />
                  </Field>
                  <Field>
                    <FieldLabel>Tipo</FieldLabel>
                    <Select value={modeloForm.tipo} onChange={e => updM('tipo', e.target.value)}>
                      <option value="credito">↑ Crédito</option>
                      <option value="debito">↓ Débito</option>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Valor padrão (R$)</FieldLabel>
                    <Input type="number" step="0.01" placeholder="Opcional" value={modeloForm.valor} onChange={e => updM('valor', e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Cliente padrão</FieldLabel>
                    <Select value={modeloForm.cliente_id} onChange={e => updM('cliente_id', e.target.value)}>
                      <option value="">Nenhum</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                    </Select>
                  </Field>
                </FormGrid>
              </ModalBody>
              <ModalFooter>
                <CancelBtn onClick={() => setShowModeloModal(false)}>Cancelar</CancelBtn>
                <SaveBtn onClick={saveModelo} disabled={saving || !canEdit}>
                  {saving ? 'Salvando...' : 'Salvar Modelo'}
                </SaveBtn>
              </ModalFooter>
            </Modal>
          </Overlay>
        )}
    </motion.div>
  )
}
