import { useEffect, useState, useRef, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import {
  Plus, Search, X, Building2, User, Phone, MapPin, DollarSign,
  Edit2, Trash2, Eye, Download, Mail, Calendar, FileText, Hash,
  KeyRound, Lock, FolderOpen, Upload, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { usePermission } from '../../hooks/usePermission'
import type { Cliente } from '../../types'

// ─── Styled Components ───────────────────────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
`

const PageTitle = styled.h1`
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 400;
  letter-spacing: -0.5px;
  color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`

const PageSub = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.textDim};
  margin-top: 3px;
`

const HeaderActions = styled.div`display: flex; gap: 8px; align-items: center; flex-wrap: wrap;`

const AddBtn = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: ${({ theme }) => theme.green};
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 3px 15px rgba(26,122,74,0.25);
  transition: background 0.2s;
  &:hover { background: ${({ theme }) => theme.greenMid}; }
`

const ExportBtn = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px;
  background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.textMid};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.greenMid}; color: ${({ theme }) => theme.green}; }
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  padding: 8px 13px;
  width: 280px;
  transition: all 0.2s;
  &:focus-within {
    border-color: ${({ theme }) => theme.greenMid};
    box-shadow: 0 0 0 3px rgba(34,160,98,0.1);
  }
  input {
    border: none;
    background: none;
    font-size: 13px;
    color: ${({ theme }) => theme.text};
    outline: none;
    width: 100%;
    font-family: 'Inter', sans-serif;
    &::placeholder { color: ${({ theme }) => theme.textDim}; }
  }
  @media (max-width: 600px) { width: 100%; flex: 1; min-width: 0; }
`

const TabRow = styled.div`
  display: flex;
  gap: 4px;
  background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  padding: 3px;
`

const Tab = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  color: ${({ theme, $active }) => $active ? theme.green : theme.textDim};
  background: ${({ theme, $active }) => $active ? theme.surface : 'transparent'};
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  box-shadow: ${({ $active }) => $active ? '0 1px 4px rgba(0,0,0,0.07)' : 'none'};
`

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow};
`

const Table = styled.table`width: 100%; border-collapse: collapse;`

const Thead = styled.thead`
  th {
    padding: 10px 14px;
    text-align: left;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: ${({ theme }) => theme.textDim};
    background: ${({ theme }) => theme.surface2};
    border-bottom: 1px solid ${({ theme }) => theme.border};
    white-space: nowrap;
  }
`

const Tbody = styled.tbody`
  tr {
    border-bottom: 1px solid ${({ theme }) => theme.border};
    transition: background 0.15s;
    &:last-child { border-bottom: none; }
    &:hover { background: ${({ theme }) => theme.surface2}; }
  }
  td { padding: 11px 14px; font-size: 13px; }
`

const ClientName = styled.div`font-weight: 500; color: ${({ theme }) => theme.text};`
const ClientSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap;`
const ClientSubItem = styled.span`display: flex; align-items: center; gap: 3px;`

const Badge = styled.span<{ $type: 'ok' | 'pend' | 'late' | 'info' | 'warn' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 600;
  background: ${({ theme, $type }) => ({
    ok: theme.posBg, pend: theme.warnBg, late: theme.negBg, info: theme.infoBg, warn: theme.warnBg
  }[$type])};
  color: ${({ theme, $type }) => ({
    ok: theme.pos, pend: theme.warn, late: theme.neg, info: theme.info, warn: theme.warn
  }[$type])};
  &::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
`

const ActionRow = styled.div`display: flex; gap: 4px;`

const ActBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.textDim};
  transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green}; border-color: rgba(26,122,74,0.2); }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.textDim};
`

const EmptyIcon = styled.div`font-size: 40px; margin-bottom: 12px;`
const EmptyTitle = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  color: ${({ theme }) => theme.text};
  margin-bottom: 6px;
`

const overlayIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const modalIn = keyframes`from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); }`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${overlayIn} 0.18s ease;
  @media (max-width: 600px) { align-items: flex-end; padding: 0; }
`

const Modal = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${modalIn} 0.2s ease;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; }
`

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.surface};
  z-index: 1;
`

const ModalTitle = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
`

const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.textDim};
  transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.negBg}; color: ${({ theme }) => theme.neg}; }
`

const ModalBody = styled.div`padding: 24px;`

const FormGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols || 2}, 1fr);
  gap: 14px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`

const Field = styled.div`margin-bottom: 0;`

const FieldLabel = styled.label`
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  margin-bottom: 6px;
`

const InputWrap = styled.div`position: relative;`

const InputIcon = styled.span`
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.textDim};
  display: flex;
  align-items: center;
`

const Input = styled.input<{ $hasIcon?: boolean }>`
  width: 100%;
  padding: ${({ $hasIcon }) => $hasIcon ? '10px 14px 10px 34px' : '10px 14px'};
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
  outline: none;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  box-sizing: border-box;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
  &::placeholder { color: ${({ theme }) => theme.textDim}; }
`

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 14px;
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
  outline: none;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
  &::placeholder { color: ${({ theme }) => theme.textDim}; }
`

const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
  outline: none;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  cursor: pointer;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
`

const CepRow = styled.div`display: flex; gap: 8px; align-items: flex-end;`

const CepBtn = styled.button`
  padding: 10px 14px;
  background: ${({ theme }) => theme.surface2};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.green};
  cursor: pointer;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.greenLight}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.border};
  position: sticky;
  bottom: 0;
  background: ${({ theme }) => theme.surface};
`

const CancelBtn = styled.button`
  padding: 10px 20px;
  border-radius: 9px;
  background: ${({ theme }) => theme.surface2};
  border: 1.5px solid ${({ theme }) => theme.border};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.textMid};
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.border2}; }
`

const SaveBtn = styled(motion.button)`
  padding: 10px 22px;
  border-radius: 9px;
  background: ${({ theme }) => theme.green};
  color: #fff;
  border: none;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(26,122,74,0.25);
  transition: background 0.2s;
  &:hover { background: ${({ theme }) => theme.greenMid}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  margin: 20px 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  &::after { content: ''; flex: 1; height: 1px; background: ${({ theme }) => theme.border}; }
`

const ViewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`

const ViewField = styled.div``
const ViewLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  margin-bottom: 3px;
`
const ViewValue = styled.div`font-size: 13px; color: ${({ theme }) => theme.text};`

const ObsBox = styled.div`
  background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  padding: 12px 14px;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
  white-space: pre-wrap;
  line-height: 1.5;
`

// ─── Animations ──────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ModalMode = 'add' | 'edit' | 'view' | null

const blankCliente: Partial<Cliente> = {
  razao_social: '', nome_fantasia: '', cnpj: '', regime: 'Simples Nacional',
  responsavel: '', telefone: '', email: '', honorarios: 0, dia_vencimento: undefined,
  situacao: 'em_dia', municipio: '', estado: '', ie: '', cnae: '',
  cep: '', logradouro: '', numero: '', bairro: '', complemento: '',
  data_abertura: '', observacoes: '',
  aliq_iss: undefined, aliq_pis: undefined, aliq_cofins: undefined,
  email_acesso: '', senha_acesso: '',
}

const regimes = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI', 'Lucro Arbitrado']

const maskCnpj = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 14)
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4')
    .replace(/^(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')
    .replace(/^(\d{2})(\d{3})/, '$1.$2')
}

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  if (d.length >= 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  return d
}

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.replace(/^(\d{5})(\d)/, '$1-$2')
}

const badgeType = (s?: string) => s === 'em_dia' ? 'ok' : s === 'pendente' ? 'pend' : 'late'
const badgeLabel = (s?: string) => s === 'em_dia' ? 'Em dia' : s === 'pendente' ? 'Pendente' : 'Atrasado'

const fmtMoney = (v?: number) =>
  v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'

function exportCsv(clients: Cliente[]) {
  const cols = [
    'Razão Social', 'Nome Fantasia', 'CNPJ', 'Regime', 'Responsável',
    'Telefone', 'Email', 'Honorários', 'Situação',
    'Município', 'Estado', 'CEP', 'Logradouro', 'Número', 'Bairro',
    'Data Abertura', 'CNAE', 'IE', 'Observações'
  ]
  const rows = clients.map(c => [
    c.razao_social, c.nome_fantasia, c.cnpj, c.regime, c.responsavel,
    c.telefone, c.email,
    c.honorarios ? String(c.honorarios) : '',
    badgeLabel(c.situacao),
    c.municipio, c.estado, c.cep, c.logradouro, c.numero, c.bairro,
    c.data_abertura, c.cnae, c.ie, c.observacoes
  ].map(v => `"${(v || '').replace(/"/g, '""')}"`))

  const csv = [cols.map(c => `"${c}"`).join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClientsPage() {
  const { canEdit, canDelete } = usePermission()
  const { escritorio } = useAuthStore()
  const { clientes: cachedClientes, setClientes: setCachedClientes } = useDataStore()
  const [clientes, setClientes] = useState<Cliente[]>(cachedClientes)
  const [loading, setLoading] = useState(cachedClientes.length === 0)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('todos')
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Partial<Cliente>>(blankCliente)
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const cepInputRef = useRef<HTMLInputElement>(null)

  // Arquivos
  const [arquivosModal, setArquivosModal] = useState<{ id: string; razao_social: string } | null>(null)
  const [arquivos, setArquivos] = useState<{ id: string; nome_arquivo: string; storage_path: string; size_bytes: number; mimetype: string; created_at: string }[]>([])
  const [loadingArquivos, setLoadingArquivos] = useState(false)
  const [uploadingArquivo, setUploadingArquivo] = useState(false)
  const arquivoInputRef = useRef<HTMLInputElement>(null)

  const escId = escritorio?.id

  const load = async () => {
    if (!escId) return
    if (clientes.length === 0) setLoading(true)
    const { data } = await supabase.from('clientes').select('*')
      .eq('escritorio_id', escId)
      .order('created_at', { ascending: false })
      .limit(500)
    const result = (data || []) as Cliente[]
    setClientes(result)
    setCachedClientes(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [escId])

  // ── Arquivos ──────────────────────────────────────────────────────────────
  const openArquivos = async (c: { id: string; razao_social: string }) => {
    setArquivosModal(c)
    setLoadingArquivos(true)
    const { data } = await supabase.from('cliente_arquivos').select('*')
      .eq('cliente_id', c.id).order('created_at', { ascending: false })
    setArquivos(data || [])
    setLoadingArquivos(false)
  }

  const handleArquivoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !arquivosModal || !escId) return
    setUploadingArquivo(true)
    const ext = file.name.split('.').pop()
    const path = `${escId}/${arquivosModal.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error: upErr } = await supabase.storage.from('cliente-arquivos').upload(path, file)
    if (upErr) { toast.error(upErr.message); setUploadingArquivo(false); return }
    const { error: dbErr } = await supabase.from('cliente_arquivos').insert({
      escritorio_id: escId,
      cliente_id: arquivosModal.id,
      nome_arquivo: file.name,
      storage_path: path,
      size_bytes: file.size,
      mimetype: file.type || `application/${ext}`,
    })
    if (dbErr) { toast.error(dbErr.message); setUploadingArquivo(false); return }
    toast.success('Arquivo enviado!')
    const { data } = await supabase.from('cliente_arquivos').select('*')
      .eq('cliente_id', arquivosModal.id).order('created_at', { ascending: false })
    setArquivos(data || [])
    setUploadingArquivo(false)
  }

  const handleArquivoDelete = async (arqId: string, storagePath: string) => {
    if (!confirm('Remover este arquivo?')) return
    await supabase.storage.from('cliente-arquivos').remove([storagePath])
    await supabase.from('cliente_arquivos').delete().eq('id', arqId)
    setArquivos(prev => prev.filter(a => a.id !== arqId))
    toast.info('Arquivo removido')
  }

  const downloadArquivo = (storagePath: string) => {
    const { data } = supabase.storage.from('cliente-arquivos').getPublicUrl(storagePath)
    window.open(data.publicUrl, '_blank')
  }

  const fmtFileSize = (bytes: number) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filtered = useMemo(() => {
    let list = clientes
    if (tab === 'pendente') list = list.filter(c => c.situacao === 'pendente')
    else if (tab === 'em_dia') list = list.filter(c => c.situacao === 'em_dia')
    else if (tab === 'atrasado') list = list.filter(c => c.situacao === 'atrasado')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.razao_social?.toLowerCase().includes(q) ||
        c.nome_fantasia?.toLowerCase().includes(q) ||
        c.cnpj?.includes(q) ||
        c.regime?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.responsavel?.toLowerCase().includes(q) ||
        c.municipio?.toLowerCase().includes(q)
      )
    }
    return list
  }, [clientes, search, tab])

  const openAdd = () => { setSelected({ ...blankCliente }); setModal('add') }
  const openEdit = (c: Cliente) => { setSelected({ ...c }); setModal('edit') }
  const openView = (c: Cliente) => { setSelected({ ...c }); setModal('view') }
  const closeModal = () => { setModal(null); setSelected(blankCliente) }

  const update = (key: keyof Cliente, val: any) => setSelected(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    if (!selected.razao_social) { toast.error('Razão Social é obrigatória'); return }
    setSaving(true)
    if (modal === 'add') {
      const payload = escritorio?.id ? { ...selected, escritorio_id: escritorio.id } : selected
      const { error } = await supabase.from('clientes').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Cliente cadastrado com sucesso!')
    } else if (modal === 'edit' && selected.id) {
      const { id, created_at, ...rest } = selected as any
      const { error } = await supabase.from('clientes').update(rest).eq('id', id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Cliente atualizado!')
    }
    setSaving(false)
    closeModal()
    load()
  }

  const handleDelete = async (c: Cliente) => {
    if (!confirm(`Excluir ${c.razao_social}?`)) return
    const { error } = await supabase.from('clientes').delete().eq('id', c.id)
    if (error) { toast.error(error.message); return }
    toast.success('Cliente excluído')
    load()
  }

  const lookupCep = async () => {
    const cep = (selected.cep || '').replace(/\D/g, '')
    if (cep.length !== 8) { toast.error('CEP inválido'); return }
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) { toast.error('CEP não encontrado'); return }
      setSelected(p => ({
        ...p,
        logradouro: data.logradouro || p.logradouro,
        bairro: data.bairro || p.bairro,
        municipio: data.localidade || p.municipio,
        estado: data.uf || p.estado,
        complemento: data.complemento || p.complemento,
      }))
      toast.success('Endereço preenchido!')
    } catch {
      toast.error('Erro ao buscar CEP')
    } finally {
      setCepLoading(false)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader>
          <div>
            <PageTitle>Clientes <em>&</em> Empresas</PageTitle>
            <PageSub>{clientes.length} clientes cadastrados</PageSub>
          </div>
          <HeaderActions>
            <ExportBtn onClick={() => exportCsv(filtered)} whileTap={{ scale: 0.97 }} title="Exportar CSV">
              <Download size={14} /> Exportar CSV
            </ExportBtn>
            <AddBtn onClick={openAdd} whileTap={{ scale: 0.97 }} disabled={!canEdit} style={{ opacity: !canEdit ? 0.4 : 1, cursor: !canEdit ? 'not-allowed' : 'pointer' }}>
              <Plus size={15} /> Novo Cliente
            </AddBtn>
          </HeaderActions>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Toolbar>
          <SearchBox>
            <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
            <input
              placeholder="Buscar por nome, CNPJ, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchBox>
          <TabRow>
            {[['todos', 'Todos'], ['em_dia', 'Em Dia'], ['pendente', 'Pendentes'], ['atrasado', 'Atrasados']].map(([val, label]) => (
              <Tab key={val} $active={tab === val} onClick={() => setTab(val)}>{label}</Tab>
            ))}
          </TabRow>
        </Toolbar>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          {loading ? (
            <EmptyState>
              <EmptyIcon>⏳</EmptyIcon>
              <EmptyTitle>Carregando...</EmptyTitle>
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState>
              <EmptyIcon>🏢</EmptyIcon>
              <EmptyTitle>Nenhum cliente encontrado</EmptyTitle>
              <div style={{ fontSize: 13 }}>Clique em "Novo Cliente" para começar</div>
            </EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <Thead>
                  <tr>
                    <th>Cliente / Empresa</th>
                    <th>CNPJ</th>
                    <th>Regime</th>
                    <th>Responsável</th>
                    <th>Honorários</th>
                    <th>Situação</th>
                    <th>Ações</th>
                  </tr>
                </Thead>
                <Tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td>
                        <ClientName>{c.razao_social}</ClientName>
                        <ClientSub>
                          {c.nome_fantasia && <ClientSubItem>{c.nome_fantasia}</ClientSubItem>}
                          {c.telefone && <ClientSubItem><Phone size={9} />{c.telefone}</ClientSubItem>}
                          {c.email && <ClientSubItem><Mail size={9} />{c.email}</ClientSubItem>}
                          {!c.nome_fantasia && !c.telefone && !c.email && c.municipio && (
                            <ClientSubItem><MapPin size={9} />{c.municipio}{c.estado ? ` / ${c.estado}` : ''}</ClientSubItem>
                          )}
                        </ClientSub>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.cnpj || '—'}</td>
                      <td><Badge $type="info">{c.regime || '—'}</Badge></td>
                      <td>{c.responsavel || '—'}</td>
                      <td style={{ fontWeight: 500 }}>{fmtMoney(c.honorarios)}</td>
                      <td><Badge $type={badgeType(c.situacao) as any}>{badgeLabel(c.situacao)}</Badge></td>
                      <td>
                        <ActionRow>
                          <ActBtn onClick={() => openView(c)} title="Visualizar"><Eye size={13} /></ActBtn>
                          <ActBtn onClick={() => openEdit(c)} title="Editar" disabled={!canEdit}><Edit2 size={13} /></ActBtn>
                          <ActBtn onClick={() => openArquivos(c)} title="Arquivos do cliente"><FolderOpen size={13} /></ActBtn>
                          <ActBtn
                            onClick={() => handleDelete(c)}
                            title="Excluir"
                            disabled={!canDelete}
                            style={{ opacity: !canDelete ? 0.4 : undefined, cursor: !canDelete ? 'not-allowed' : undefined }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fdf0f0'; (e.currentTarget as HTMLButtonElement).style.color = '#c53030' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ''; (e.currentTarget as HTMLButtonElement).style.color = '' }}
                          ><Trash2 size={13} /></ActBtn>
                        </ActionRow>
                      </td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── Modal ── */}
      {modal && (
          <Overlay
            onClick={closeModal}
          >
            <Modal
              onClick={e => e.stopPropagation()}
            >
              <ModalHead>
                <ModalTitle>
                  {modal === 'add' ? 'Novo Cliente' : modal === 'edit' ? 'Editar Cliente' : 'Detalhes do Cliente'}
                </ModalTitle>
                <CloseBtn onClick={closeModal}><X size={14} /></CloseBtn>
              </ModalHead>

              <ModalBody>
                {modal === 'view' ? (
                  /* ── VIEW MODE ── */
                  <>
                    <SectionTitle><Building2 size={12} /> Dados da Empresa</SectionTitle>
                    <ViewGrid>
                      <ViewField style={{ gridColumn: '1 / -1' }}>
                        <ViewLabel>Razão Social</ViewLabel>
                        <ViewValue style={{ fontWeight: 500, fontSize: 15 }}>{selected.razao_social || '—'}</ViewValue>
                      </ViewField>
                      {selected.nome_fantasia && (
                        <ViewField style={{ gridColumn: '1 / -1' }}>
                          <ViewLabel>Nome Fantasia</ViewLabel>
                          <ViewValue>{selected.nome_fantasia}</ViewValue>
                        </ViewField>
                      )}
                      <ViewField>
                        <ViewLabel>CNPJ</ViewLabel>
                        <ViewValue style={{ fontFamily: 'monospace' }}>{selected.cnpj || '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Regime Tributário</ViewLabel>
                        <ViewValue><Badge $type="info">{selected.regime || '—'}</Badge></ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Situação</ViewLabel>
                        <ViewValue><Badge $type={badgeType(selected.situacao) as any}>{badgeLabel(selected.situacao)}</Badge></ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Data de Abertura</ViewLabel>
                        <ViewValue>{selected.data_abertura ? new Date(selected.data_abertura + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>CNAE</ViewLabel>
                        <ViewValue>{selected.cnae || '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Inscrição Estadual</ViewLabel>
                        <ViewValue>{selected.ie || '—'}</ViewValue>
                      </ViewField>
                    </ViewGrid>

                    <SectionTitle><User size={12} /> Contato</SectionTitle>
                    <ViewGrid>
                      <ViewField>
                        <ViewLabel>Responsável</ViewLabel>
                        <ViewValue>{selected.responsavel || '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Telefone</ViewLabel>
                        <ViewValue>{selected.telefone || '—'}</ViewValue>
                      </ViewField>
                      <ViewField style={{ gridColumn: '1 / -1' }}>
                        <ViewLabel>Email</ViewLabel>
                        <ViewValue>{selected.email || '—'}</ViewValue>
                      </ViewField>
                    </ViewGrid>

                    <SectionTitle><MapPin size={12} /> Endereço</SectionTitle>
                    <ViewGrid>
                      <ViewField>
                        <ViewLabel>CEP</ViewLabel>
                        <ViewValue>{selected.cep || '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Logradouro</ViewLabel>
                        <ViewValue>{selected.logradouro ? `${selected.logradouro}${selected.numero ? `, ${selected.numero}` : ''}` : '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Bairro</ViewLabel>
                        <ViewValue>{selected.bairro || '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Complemento</ViewLabel>
                        <ViewValue>{selected.complemento || '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Município / UF</ViewLabel>
                        <ViewValue>{selected.municipio ? `${selected.municipio}${selected.estado ? ` / ${selected.estado}` : ''}` : '—'}</ViewValue>
                      </ViewField>
                    </ViewGrid>

                    <SectionTitle><DollarSign size={12} /> Honorários & Alíquotas</SectionTitle>
                    <ViewGrid>
                      <ViewField>
                        <ViewLabel>Honorários Mensais</ViewLabel>
                        <ViewValue style={{ fontWeight: 600, color: '#1a7a4a' }}>{fmtMoney(selected.honorarios)}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Dia de Vencimento</ViewLabel>
                        <ViewValue>{selected.dia_vencimento ? `Todo dia ${selected.dia_vencimento}` : '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Alíq. ISS</ViewLabel>
                        <ViewValue>{selected.aliq_iss ? `${selected.aliq_iss}%` : '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Alíq. PIS</ViewLabel>
                        <ViewValue>{selected.aliq_pis ? `${selected.aliq_pis}%` : '—'}</ViewValue>
                      </ViewField>
                      <ViewField>
                        <ViewLabel>Alíq. COFINS</ViewLabel>
                        <ViewValue>{selected.aliq_cofins ? `${selected.aliq_cofins}%` : '—'}</ViewValue>
                      </ViewField>
                    </ViewGrid>

                    {selected.observacoes && (
                      <>
                        <SectionTitle><FileText size={12} /> Observações</SectionTitle>
                        <ObsBox>{selected.observacoes}</ObsBox>
                      </>
                    )}
                  </>
                ) : (
                  /* ── FORM MODE ── */
                  <>
                    <SectionTitle><Building2 size={12} /> Dados da Empresa</SectionTitle>
                    <FormGrid>
                      <Field style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel>Razão Social *</FieldLabel>
                        <Input
                          placeholder="Nome completo da empresa"
                          value={selected.razao_social || ''}
                          onChange={e => update('razao_social', e.target.value)}
                        />
                      </Field>
                      <Field style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel>Nome Fantasia</FieldLabel>
                        <Input
                          placeholder="Nome comercial / fantasia"
                          value={selected.nome_fantasia || ''}
                          onChange={e => update('nome_fantasia', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>CNPJ</FieldLabel>
                        <Input
                          placeholder="00.000.000/0001-00"
                          value={selected.cnpj || ''}
                          onChange={e => update('cnpj', maskCnpj(e.target.value))}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Inscrição Estadual</FieldLabel>
                        <Input
                          placeholder="IE"
                          value={selected.ie || ''}
                          onChange={e => update('ie', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Regime Tributário</FieldLabel>
                        <Select value={selected.regime || ''} onChange={e => update('regime', e.target.value)}>
                          {regimes.map(r => <option key={r} value={r}>{r}</option>)}
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Situação</FieldLabel>
                        <Select value={selected.situacao || 'em_dia'} onChange={e => update('situacao', e.target.value)}>
                          <option value="em_dia">Em Dia</option>
                          <option value="pendente">Pendente</option>
                          <option value="atrasado">Atrasado</option>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>CNAE</FieldLabel>
                        <Input
                          placeholder="0000-0/00"
                          value={selected.cnae || ''}
                          onChange={e => update('cnae', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Data de Abertura</FieldLabel>
                        <InputWrap>
                          <InputIcon><Calendar size={13} /></InputIcon>
                          <Input
                            $hasIcon
                            type="date"
                            value={selected.data_abertura || ''}
                            onChange={e => update('data_abertura', e.target.value)}
                          />
                        </InputWrap>
                      </Field>
                    </FormGrid>

                    <SectionTitle><User size={12} /> Contato</SectionTitle>
                    <FormGrid>
                      <Field>
                        <FieldLabel>Responsável</FieldLabel>
                        <Input
                          placeholder="Nome do responsável"
                          value={selected.responsavel || ''}
                          onChange={e => update('responsavel', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Telefone</FieldLabel>
                        <InputWrap>
                          <InputIcon><Phone size={13} /></InputIcon>
                          <Input
                            $hasIcon
                            placeholder="(00) 00000-0000"
                            value={selected.telefone || ''}
                            onChange={e => update('telefone', maskPhone(e.target.value))}
                          />
                        </InputWrap>
                      </Field>
                      <Field style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel>Email</FieldLabel>
                        <InputWrap>
                          <InputIcon><Mail size={13} /></InputIcon>
                          <Input
                            $hasIcon
                            type="email"
                            placeholder="email@empresa.com.br"
                            value={selected.email || ''}
                            onChange={e => update('email', e.target.value)}
                          />
                        </InputWrap>
                      </Field>
                    </FormGrid>

                    <SectionTitle><MapPin size={12} /> Endereço</SectionTitle>
                    <FormGrid>
                      <Field>
                        <FieldLabel>CEP</FieldLabel>
                        <CepRow>
                          <Input
                            ref={cepInputRef}
                            placeholder="00000-000"
                            value={selected.cep || ''}
                            onChange={e => update('cep', maskCep(e.target.value))}
                            style={{ flex: 1 }}
                          />
                          <CepBtn onClick={lookupCep} disabled={cepLoading} type="button">
                            {cepLoading ? '...' : 'Buscar'}
                          </CepBtn>
                        </CepRow>
                      </Field>
                      <Field>
                        <FieldLabel>Número</FieldLabel>
                        <InputWrap>
                          <InputIcon><Hash size={13} /></InputIcon>
                          <Input
                            $hasIcon
                            placeholder="123"
                            value={selected.numero || ''}
                            onChange={e => update('numero', e.target.value)}
                          />
                        </InputWrap>
                      </Field>
                      <Field style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel>Logradouro</FieldLabel>
                        <Input
                          placeholder="Rua, Avenida..."
                          value={selected.logradouro || ''}
                          onChange={e => update('logradouro', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Bairro</FieldLabel>
                        <Input
                          placeholder="Bairro"
                          value={selected.bairro || ''}
                          onChange={e => update('bairro', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Complemento</FieldLabel>
                        <Input
                          placeholder="Sala, Andar..."
                          value={selected.complemento || ''}
                          onChange={e => update('complemento', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Município</FieldLabel>
                        <Input
                          placeholder="Cidade"
                          value={selected.municipio || ''}
                          onChange={e => update('municipio', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Estado (UF)</FieldLabel>
                        <Input
                          placeholder="SP"
                          maxLength={2}
                          value={selected.estado || ''}
                          onChange={e => update('estado', e.target.value.toUpperCase())}
                        />
                      </Field>
                    </FormGrid>

                    <SectionTitle><DollarSign size={12} /> Honorários & Alíquotas</SectionTitle>
                    <FormGrid>
                      <Field>
                        <FieldLabel>Honorários Mensais (R$)</FieldLabel>
                        <Input
                          type="number"
                          placeholder="0,00"
                          value={selected.honorarios || ''}
                          onChange={e => update('honorarios', Number(e.target.value))}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Dia de Vencimento</FieldLabel>
                        <Input
                          type="number"
                          placeholder="10"
                          min={1}
                          max={31}
                          value={selected.dia_vencimento || ''}
                          onChange={e => update('dia_vencimento', Number(e.target.value))}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Alíq. ISS (%)</FieldLabel>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="5.00"
                          value={selected.aliq_iss || ''}
                          onChange={e => update('aliq_iss', Number(e.target.value))}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Alíq. PIS (%)</FieldLabel>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.65"
                          value={selected.aliq_pis || ''}
                          onChange={e => update('aliq_pis', Number(e.target.value))}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Alíq. COFINS (%)</FieldLabel>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="3.00"
                          value={selected.aliq_cofins || ''}
                          onChange={e => update('aliq_cofins', Number(e.target.value))}
                        />
                      </Field>
                    </FormGrid>

                    <SectionTitle><KeyRound size={12} /> Acesso ao Portal do Cliente</SectionTitle>
                    <FormGrid>
                      <Field>
                        <FieldLabel>Email de Acesso</FieldLabel>
                        <InputWrap>
                          <InputIcon><Mail size={13} /></InputIcon>
                          <Input
                            $hasIcon
                            type="email"
                            placeholder="cliente@empresa.com"
                            value={selected.email_acesso || ''}
                            onChange={e => update('email_acesso', e.target.value)}
                          />
                        </InputWrap>
                      </Field>
                      <Field>
                        <FieldLabel>Senha de Acesso</FieldLabel>
                        <InputWrap>
                          <InputIcon><Lock size={13} /></InputIcon>
                          <Input
                            $hasIcon
                            type="password"
                            placeholder="Senha para o cliente acessar o portal"
                            value={selected.senha_acesso || ''}
                            onChange={e => update('senha_acesso', e.target.value)}
                          />
                        </InputWrap>
                      </Field>
                    </FormGrid>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 16, marginTop: 4, padding: '0 2px' }}>
                      O cliente acessa o portal em{' '}
                      <a
                        href="/portal"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1a7a4a', fontWeight: 600, textDecoration: 'underline' }}
                      >
                        {window.location.origin}/portal
                      </a>
                    </div>

                    <SectionTitle><FileText size={12} /> Observações</SectionTitle>
                    <Textarea
                      placeholder="Notas internas sobre o cliente, histórico relevante..."
                      value={selected.observacoes || ''}
                      onChange={e => update('observacoes', e.target.value)}
                    />
                  </>
                )}
              </ModalBody>

              <ModalFooter>
                <CancelBtn onClick={closeModal}>{modal === 'view' ? 'Fechar' : 'Cancelar'}</CancelBtn>
                {modal !== 'view' && (
                  <SaveBtn onClick={handleSave} whileTap={{ scale: 0.97 }} disabled={saving || !canEdit}>
                    {saving ? 'Salvando...' : modal === 'add' ? 'Cadastrar Cliente' : 'Salvar Alterações'}
                  </SaveBtn>
                )}
              </ModalFooter>
            </Modal>
          </Overlay>
        )}

      {/* ── Modal Arquivos ── */}
      <input ref={arquivoInputRef} type="file" style={{ display: 'none' }} onChange={handleArquivoUpload} />
      {arquivosModal && (
          <Overlay
            onClick={() => setArquivosModal(null)}>
            <Modal
              onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <ModalHead>
                <ModalTitle><FolderOpen size={16} style={{ marginRight: 8, verticalAlign: 'middle', opacity: 0.6 }} />
                  Arquivos — {arquivosModal.razao_social}
                </ModalTitle>
                <CloseBtn onClick={() => setArquivosModal(null)}><X size={14} /></CloseBtn>
              </ModalHead>
              <ModalBody>
                <div style={{ marginBottom: 16 }}>
                  <button
                    onClick={() => arquivoInputRef.current?.click()}
                    disabled={uploadingArquivo}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
                      background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 9,
                      fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                      cursor: uploadingArquivo ? 'not-allowed' : 'pointer', opacity: uploadingArquivo ? 0.7 : 1,
                    }}
                  >
                    <Upload size={14} />
                    {uploadingArquivo ? 'Enviando...' : 'Enviar Arquivo'}
                  </button>
                </div>

                {loadingArquivos ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Carregando...</div>
                ) : arquivos.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    Nenhum arquivo enviado para este cliente ainda.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {arquivos.map(a => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 9,
                      }}>
                        <FileText size={16} style={{ flexShrink: 0, color: '#6b7280' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.nome_arquivo}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                            {fmtFileSize(a.size_bytes)} · {a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '—'}
                          </div>
                        </div>
                        <button onClick={() => downloadArquivo(a.storage_path)} title="Baixar"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a7a4a', padding: 4 }}>
                          <ExternalLink size={15} />
                        </button>
                        <button onClick={() => handleArquivoDelete(a.id, a.storage_path)} title="Remover"
                          disabled={!canDelete}
                          style={{ background: 'none', border: 'none', cursor: !canDelete ? 'not-allowed' : 'pointer', color: '#9ca3af', padding: 4, opacity: !canDelete ? 0.4 : 1 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ModalBody>
            </Modal>
          </Overlay>
        )}
    </motion.div>
  )
}
