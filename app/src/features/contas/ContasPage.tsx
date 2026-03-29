import { useState, useMemo, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import {
  Plus, X, ChevronDown, Download, Check, AlertCircle,
  TrendingUp, TrendingDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { usePermission } from '../../hooks/usePermission'
import * as XLSX from 'xlsx'

// ─── Styled ────────────────────────────────────────────────────────────────────
const overlayIn = keyframes`from{opacity:0}to{opacity:1}`
const modalIn   = keyframes`from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}`

const PageHeader = styled.div`margin-bottom: 20px;`
const PageTitle  = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const Toolbar = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap;
`
const Spacer = styled.div`flex: 1;`
const ActionBtn = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' | 'pagar' | 'receber' }>`
  display: flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif;
  transition: all 0.2s; border: 1.5px solid;
  ${({ theme, $variant }) => {
    if ($variant === 'primary')  return `background:${theme.green};color:#fff;border-color:${theme.green};&:hover{opacity:0.87;}`
    if ($variant === 'pagar')    return `background:#dc2626;color:#fff;border-color:#dc2626;&:hover{opacity:0.87;}`
    if ($variant === 'receber')  return `background:#16a34a;color:#fff;border-color:#16a34a;&:hover{opacity:0.87;}`
    return `background:${theme.surface};color:${theme.textMid};border-color:${theme.border};&:hover{background:${theme.surface2};}`
  }}
`

const TabRow = styled.div`
  display: flex; gap: 6px; margin-bottom: 18px;
`
const Tab = styled.button<{ $active?: boolean }>`
  padding: 7px 16px; border-radius: 9px; font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
  border: 1.5px solid ${({ theme, $active }) => $active ? theme.greenMid : theme.border};
  background: ${({ theme, $active }) => $active ? theme.greenLight : theme.surface};
  color: ${({ theme, $active }) => $active ? theme.green : theme.textMid};
`

const StatsRow = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`
const StatCard = styled.div<{ $accent?: string }>`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 16px; box-shadow: ${({ theme }) => theme.shadow};
  border-left: 3px solid ${({ $accent }) => $accent || 'transparent'};
`
const StatLabel = styled.div`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};`
const StatValue = styled.div<{ $color?: string }>`
  font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400;
  color: ${({ theme, $color }) => $color || theme.text}; margin-top: 4px;
`

const Table = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`
const TableHead = styled.div`
  display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 120px;
  padding: 10px 18px; border-bottom: 1px solid ${({ theme }) => theme.border};
  @media (max-width: 800px) { grid-template-columns: 1.5fr 2fr 1fr 100px; }
`
const Th = styled.div`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};`
const Row = styled.div`
  display: grid; grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 120px;
  padding: 13px 18px; border-bottom: 1px solid ${({ theme }) => theme.border};
  align-items: center; transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
  @media (max-width: 800px) { grid-template-columns: 1.5fr 2fr 1fr 100px; }
`
const Td  = styled.div`font-size: 13px; color: ${({ theme }) => theme.text};`
const TdSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`
const TdHide = styled(Td)`@media (max-width: 800px) { display: none; }`

const TypeBadge = styled.span<{ $tipo: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 7px; font-size: 11px; font-weight: 600;
  ${({ $tipo }) =>
    $tipo === 'receber'
      ? 'background:#dcfce7;color:#16a34a;'
      : 'background:#fee2e2;color:#dc2626;'
  }
`
const Badge = styled.span<{ $status: string }>`
  padding: 3px 9px; border-radius: 7px; font-size: 11px; font-weight: 600;
  ${({ $status }) => {
    if ($status === 'pago')     return 'background:#dcfce7;color:#16a34a;'
    if ($status === 'atrasado') return 'background:#fee2e2;color:#dc2626;'
    return 'background:#fef3c7;color:#d97706;'
  }}
`

const BtnRow = styled.div`display: flex; gap: 6px; justify-content: flex-end;`
const SmBtn = styled.button<{ $variant?: string }>`
  padding: 5px 10px; border-radius: 7px; font-size: 11.5px; font-weight: 500;
  cursor: pointer; border: 1.5px solid; font-family: 'Inter', sans-serif; transition: all 0.2s;
  ${({ theme, $variant }) => {
    if ($variant === 'green') return `background:${theme.green};color:#fff;border-color:${theme.green};&:hover{opacity:0.85;}`
    if ($variant === 'red')   return `background:#dc2626;color:#fff;border-color:#dc2626;&:hover{opacity:0.85;}`
    return `background:${theme.surface};color:${theme.textMid};border-color:${theme.border};&:hover{background:${theme.surface2};}`
  }}
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

// Modal
const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: ${overlayIn} 0.2s ease;
  @media (max-width: 600px) { align-items: flex-end; padding: 0; }
`
const Modal = styled.div`
  background: ${({ theme }) => theme.surface}; border-radius: 16px;
  width: 100%; max-width: 520px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${modalIn} 0.22s ease; overflow: hidden;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; overflow-y: auto; }
`
const ModalHead = styled.div`
  padding: 18px 20px 14px; border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex; align-items: center; justify-content: space-between;
`
const ModalTitle = styled.div`font-family: 'Playfair Display', serif; font-size: 18px; color: ${({ theme }) => theme.text};`
const CloseBtn   = styled.button`
  width: 28px; height: 28px; border-radius: 7px; border: none; background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: ${({ theme }) => theme.textDim}; &:hover { background: ${({ theme }) => theme.surface2}; }
`
const ModalBody = styled.div`padding: 18px 20px 20px;`
const FormGrid  = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 14px; @media(max-width:480px){grid-template-columns:1fr;}`
const Field     = styled.div`display: flex; flex-direction: column; gap: 5px;`
const Label     = styled.label`font-size: 11.5px; font-weight: 600; color: ${({ theme }) => theme.textMid}; text-transform: uppercase; letter-spacing: 0.5px;`
const Input     = styled.input`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13.5px; font-family: 'Inter', sans-serif; transition: border 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
`
const Select = styled.select`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13.5px; font-family: 'Inter', sans-serif;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; }
`
const Textarea = styled.textarea`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; resize: vertical; min-height: 70px;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; }
`
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px;
  border-top: 1px solid ${({ theme }) => theme.border};
`
const SaveBtn = styled.button`
  padding: 9px 22px; border-radius: 10px; background: ${({ theme }) => theme.green};
  color: #fff; border: none; font-size: 13.5px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity 0.2s;
  &:hover { opacity: 0.87; } &:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
`
const CancelBtn = styled.button`
  padding: 9px 18px; border-radius: 10px; background: transparent;
  color: ${({ theme }) => theme.textMid}; border: 1.5px solid ${({ theme }) => theme.border};
  font-size: 13.5px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.surface2}; }
`
const EmptyState = styled.div`
  padding: 50px 20px; text-align: center; color: ${({ theme }) => theme.textDim}; font-size: 14px;
`

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (s?: string) => s ? format(new Date(s + 'T00:00'), 'dd/MM/yyyy') : '—'

const CATEGORIAS_PAGAR = ['Fornecedor', 'Aluguel', 'Salário', 'Impostos', 'Serviços', 'Outros']
const CATEGORIAS_RECEBER = ['Cliente', 'Honorários', 'Serviços', 'Outros']

type Tab = 'todos' | 'pagar' | 'receber'
type Status = 'pendente' | 'pago' | 'atrasado'

// ─── Component ─────────────────────────────────────────────────────────────────
export function ContasPage() {
  const { canEdit } = usePermission()
  const { escritorio } = useAuthStore()
  const { clientes, contasPagarReceber, setContasPagarReceber } = useDataStore()
  const escId = escritorio?.id

  const [tab, setTab] = useState<Tab>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const blank = () => ({
    tipo: 'receber' as 'pagar' | 'receber',
    cliente_id: '',
    descricao: '',
    valor: '',
    data_vencimento: '',
    status: 'pendente' as Status,
    data_pagamento: '',
    categoria: '',
    observacoes: '',
  })
  const [form, setForm] = useState(blank())

  // ── Dados filtrados ────────────────────────────────────────────────────────
  const lista = useMemo(() => {
    let rows = [...contasPagarReceber]
    if (tab !== 'todos') rows = rows.filter((c: any) => c.tipo === tab)
    if (filterStatus !== 'todos') rows = rows.filter((c: any) => c.status === filterStatus)
    return rows.sort((a: any, b: any) =>
      new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
    )
  }, [contasPagarReceber, tab, filterStatus])

  const stats = useMemo(() => {
    const pagar    = contasPagarReceber.filter((c: any) => c.tipo === 'pagar' && c.status !== 'pago').reduce((s: number, c: any) => s + (c.valor || 0), 0)
    const receber  = contasPagarReceber.filter((c: any) => c.tipo === 'receber' && c.status !== 'pago').reduce((s: number, c: any) => s + (c.valor || 0), 0)
    const atrasado = contasPagarReceber.filter((c: any) => c.status === 'atrasado').reduce((s: number, c: any) => s + (c.valor || 0), 0)
    const saldo    = receber - pagar
    return { pagar, receber, atrasado, saldo }
  }, [contasPagarReceber])

  // ── Refresh ────────────────────────────────────────────────────────────────
  async function refresh() {
    if (!escId) return
    const { data } = await supabase
      .from('contas_pagar_receber')
      .select('*,clientes(razao_social)')
      .eq('escritorio_id', escId)
      .order('data_vencimento', { ascending: true })
      .limit(500)
    setContasPagarReceber(data || [])
  }

  // ── Salvar ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (savingRef.current) return
    if (!form.descricao.trim()) { toast.error('Informe a descrição'); return }
    const valorNum = parseFloat(String(form.valor).replace(',', '.'))
    if (!valorNum || valorNum <= 0) { toast.error('Informe um valor válido'); return }
    if (!form.data_vencimento) { toast.error('Informe a data de vencimento'); return }
    if (!escId) { toast.error('Escritório não identificado'); return }

    savingRef.current = true; setSaving(true)
    try {
      const payload = {
        escritorio_id: escId,
        tipo: form.tipo,
        cliente_id: form.cliente_id || null,
        descricao: form.descricao.trim(),
        valor: valorNum,
        data_vencimento: form.data_vencimento,
        status: form.status,
        data_pagamento: form.data_pagamento || null,
        categoria: form.categoria || null,
        observacoes: form.observacoes || null,
      }

      if (editingId) {
        const { error } = await supabase.from('contas_pagar_receber').update(payload).eq('id', editingId).eq('escritorio_id', escId)
        if (error) throw error
        toast.success('Conta atualizada')
      } else {
        const { error } = await supabase.from('contas_pagar_receber').insert(payload)
        if (error) throw error
        toast.success('Conta adicionada')
      }

      await refresh()
      setShowModal(false)
      setEditingId(null)
      setForm(blank())
    } catch (e: any) {
      const msg = e?.message || 'Erro ao salvar'
      if (msg.includes('does not exist') || msg.includes('relation')) {
        toast.error('Tabela não encontrada — rode o SQL no Supabase primeiro', { duration: 6000 })
      } else {
        toast.error(msg, { duration: 5000 })
      }
    } finally {
      savingRef.current = false; setSaving(false)
    }
  }

  // ── Marcar pago ────────────────────────────────────────────────────────────
  async function marcarPago(conta: any) {
    if (!escId) return
    setUpdatingId(conta.id)
    try {
      const { error } = await supabase
        .from('contas_pagar_receber')
        .update({ status: 'pago', data_pagamento: format(new Date(), 'yyyy-MM-dd') })
        .eq('id', conta.id).eq('escritorio_id', escId)
      if (error) throw error
      await refresh()
      toast.success('Marcado como pago')
    } catch { toast.error('Erro ao atualizar') }
    finally { setUpdatingId(null) }
  }

  // ── Marcar atrasado ────────────────────────────────────────────────────────
  async function marcarAtrasado(conta: any) {
    if (!escId) return
    setUpdatingId(conta.id)
    try {
      const { error } = await supabase
        .from('contas_pagar_receber')
        .update({ status: 'atrasado' })
        .eq('id', conta.id).eq('escritorio_id', escId)
      if (error) throw error
      await refresh()
      toast.success('Marcado como atrasado')
    } catch { toast.error('Erro ao atualizar') }
    finally { setUpdatingId(null) }
  }

  // ── Excluir ────────────────────────────────────────────────────────────────
  async function handleDelete(conta: any) {
    if (!escId) return
    if (!confirm(`Excluir "${conta.descricao}"?`)) return
    try {
      const { error } = await supabase.from('contas_pagar_receber').delete().eq('id', conta.id).eq('escritorio_id', escId)
      if (error) throw error
      await refresh()
      toast.success('Conta excluída')
    } catch { toast.error('Erro ao excluir') }
  }

  // ── Editar ─────────────────────────────────────────────────────────────────
  function openEdit(conta: any) {
    setForm({
      tipo: conta.tipo,
      cliente_id: conta.cliente_id || '',
      descricao: conta.descricao,
      valor: String(conta.valor),
      data_vencimento: conta.data_vencimento,
      status: conta.status,
      data_pagamento: conta.data_pagamento || '',
      categoria: conta.categoria || '',
      observacoes: conta.observacoes || '',
    })
    setEditingId(conta.id)
    setShowModal(true)
  }

  // ── Excel ──────────────────────────────────────────────────────────────────
  function exportExcel() {
    const rows = lista.map((c: any) => ({
      Tipo: c.tipo === 'pagar' ? 'A Pagar' : 'A Receber',
      Cliente: c.clientes?.razao_social || '',
      Descrição: c.descricao,
      Categoria: c.categoria || '',
      Valor: c.valor,
      Vencimento: fmtDate(c.data_vencimento),
      Status: c.status,
      'Data Pagamento': fmtDate(c.data_pagamento),
      Observações: c.observacoes || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contas')
    XLSX.writeFile(wb, `contas_pagar_receber_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  const categorias = form.tipo === 'pagar' ? CATEGORIAS_PAGAR : CATEGORIAS_RECEBER

  return (
    <>
      <PageHeader>
        <PageTitle>Contas a <em>Pagar / Receber</em></PageTitle>
        <PageSub>Gerencie vencimentos, pagamentos e recebimentos do escritório</PageSub>
      </PageHeader>

      <StatsRow>
        <StatCard $accent="#dc2626">
          <StatLabel><TrendingDown size={11} style={{ display:'inline', marginRight:4 }} />A Pagar</StatLabel>
          <StatValue $color="#dc2626">{fmt(stats.pagar)}</StatValue>
        </StatCard>
        <StatCard $accent="#16a34a">
          <StatLabel><TrendingUp size={11} style={{ display:'inline', marginRight:4 }} />A Receber</StatLabel>
          <StatValue $color="#16a34a">{fmt(stats.receber)}</StatValue>
        </StatCard>
        <StatCard $accent={stats.saldo >= 0 ? '#16a34a' : '#dc2626'}>
          <StatLabel>Saldo Previsto</StatLabel>
          <StatValue $color={stats.saldo >= 0 ? '#16a34a' : '#dc2626'}>{fmt(stats.saldo)}</StatValue>
        </StatCard>
        <StatCard $accent="#d97706">
          <StatLabel>Em Atraso</StatLabel>
          <StatValue $color="#d97706">{fmt(stats.atrasado)}</StatValue>
        </StatCard>
      </StatsRow>

      <Toolbar>
        <TabRow style={{ margin: 0 }}>
          <Tab $active={tab === 'todos'}   onClick={() => setTab('todos')}>Todos</Tab>
          <Tab $active={tab === 'pagar'}   onClick={() => setTab('pagar')}>A Pagar</Tab>
          <Tab $active={tab === 'receber'} onClick={() => setTab('receber')}>A Receber</Tab>
        </TabRow>
        <Select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '7px 12px', fontSize: 13, maxWidth: 140 }}
        >
          <option value="todos">Todos status</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
          <option value="pago">Pago</option>
        </Select>
        <Spacer />
        <ActionBtn onClick={exportExcel}><Download size={13} />Excel</ActionBtn>
        <ActionBtn $variant="primary" onClick={() => { setForm(blank()); setEditingId(null); setShowModal(true) }} disabled={!canEdit} style={{ opacity: !canEdit ? 0.4 : 1 }}>
          <Plus size={14} />Nova Conta
        </ActionBtn>
      </Toolbar>

      <Table>
        <TableHead>
          <Th>Tipo</Th>
          <Th>Descrição / Cliente</Th>
          <Th>Valor</Th>
          <TdHide as="div" style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px', color:'inherit', opacity:0.6 }}>Vencimento</TdHide>
          <Th>Status</Th>
          <Th style={{ textAlign: 'right' }}>Ações</Th>
        </TableHead>
        {lista.length === 0 ? (
          <EmptyState>
            Nenhuma conta encontrada.<br />
            Clique em "Nova Conta" para adicionar.
          </EmptyState>
        ) : lista.map((c: any) => (
          <Row key={c.id}>
            <Td>
              <TypeBadge $tipo={c.tipo}>
                {c.tipo === 'receber' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {c.tipo === 'receber' ? 'Receber' : 'Pagar'}
              </TypeBadge>
            </Td>
            <Td>
              {c.descricao}
              {c.clientes?.razao_social && <TdSub>{c.clientes.razao_social}</TdSub>}
              {c.categoria && <TdSub>{c.categoria}</TdSub>}
            </Td>
            <Td>{fmt(c.valor)}</Td>
            <TdHide>
              {fmtDate(c.data_vencimento)}
              {c.data_pagamento && <TdSub>Pago: {fmtDate(c.data_pagamento)}</TdSub>}
            </TdHide>
            <Td><Badge $status={c.status}>{c.status === 'pago' ? 'Pago' : c.status === 'atrasado' ? 'Atrasado' : 'Pendente'}</Badge></Td>
            <Td>
              <BtnRow>
                {c.status !== 'pago' && (
                  <SmBtn $variant="green" disabled={updatingId === c.id || !canEdit} onClick={() => marcarPago(c)}>
                    {updatingId === c.id ? '...' : <Check size={11} />}
                  </SmBtn>
                )}
                {c.status === 'pendente' && (
                  <SmBtn disabled={updatingId === c.id || !canEdit} onClick={() => marcarAtrasado(c)}>
                    <AlertCircle size={11} />
                  </SmBtn>
                )}
                <SmBtn disabled={!canEdit} onClick={() => openEdit(c)}>
                  ✏
                </SmBtn>
                <SmBtn $variant="red" disabled={!canEdit} onClick={() => handleDelete(c)}>
                  <X size={11} />
                </SmBtn>
              </BtnRow>
            </Td>
          </Row>
        ))}
      </Table>

      {showModal && (
        <Overlay onClick={() => { setShowModal(false); setEditingId(null) }}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>{editingId ? 'Editar Conta' : 'Nova Conta'}</ModalTitle>
              <CloseBtn onClick={() => { setShowModal(false); setEditingId(null) }}><X size={14} /></CloseBtn>
            </ModalHead>
            <ModalBody>
              <FormGrid>
                <Field>
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any, categoria: '' }))}>
                    <option value="receber">A Receber</option>
                    <option value="pagar">A Pagar</option>
                  </Select>
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="atrasado">Atrasado</option>
                  </Select>
                </Field>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Descrição *</Label>
                  <Input placeholder="Ex: Fatura do fornecedor X" value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0,00"
                    value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Data Vencimento *</Label>
                  <Input type="date" value={form.data_vencimento}
                    onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Cliente / Fornecedor</Label>
                  <Select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">Nenhum</option>
                    {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </Select>
                </Field>
                <Field>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                    <option value="">Sem categoria</option>
                    {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </Select>
                </Field>
                {form.status === 'pago' && (
                  <Field style={{ gridColumn: '1/-1' }}>
                    <Label>Data de Pagamento</Label>
                    <Input type="date" value={form.data_pagamento}
                      onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))} />
                  </Field>
                )}
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Observações</Label>
                  <Textarea placeholder="Opcional..." value={form.observacoes}
                    onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
                </Field>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={() => { setShowModal(false); setEditingId(null) }}>Cancelar</CancelBtn>
              <SaveBtn disabled={saving || !canEdit} onClick={handleSave}>{saving ? 'Salvando...' : 'Salvar'}</SaveBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </>
  )
}
