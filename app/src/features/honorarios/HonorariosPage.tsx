import { useState, useMemo, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import {
  DollarSign, Plus, Check, AlertCircle, Clock,
  RefreshCw, X, ChevronDown, Download,
} from 'lucide-react'
import { format, subMonths, addMonths } from 'date-fns'
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
const NavBtn = styled.button`
  width: 32px; height: 32px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; cursor: pointer; display: flex;
  align-items: center; justify-content: center; color: ${({ theme }) => theme.textMid};
  transition: all 0.2s; &:hover { background: ${({ theme }) => theme.surface2}; }
`
const MonthLabel = styled.div`
  font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 400;
  color: ${({ theme }) => theme.text}; min-width: 160px; text-align: center;
`
const Spacer = styled.div`flex: 1;`
const ActionBtn = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif;
  transition: all 0.2s; border: 1.5px solid;
  ${({ theme, $variant }) => {
    if ($variant === 'primary')   return `background:${theme.green};color:#fff;border-color:${theme.green};&:hover{opacity:0.87;}`
    if ($variant === 'danger')    return `background:transparent;color:#dc2626;border-color:#dc262633;&:hover{background:#dc262611;}`
    return `background:${theme.surface};color:${theme.textMid};border-color:${theme.border};&:hover{background:${theme.surface2};}`
  }}
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
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 130px;
  padding: 10px 18px; border-bottom: 1px solid ${({ theme }) => theme.border};
  @media (max-width: 700px) { grid-template-columns: 2fr 1fr 100px; }
`
const Th = styled.div`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};`
const Row = styled.div`
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 130px;
  padding: 13px 18px; border-bottom: 1px solid ${({ theme }) => theme.border};
  align-items: center; transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
  @media (max-width: 700px) { grid-template-columns: 2fr 1fr 100px; }
`
const Td  = styled.div`font-size: 13px; color: ${({ theme }) => theme.text};`
const TdSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`
const TdHide = styled(Td)`@media (max-width: 700px) { display: none; }`

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
  width: 100%; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
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
const mesLabel = (mes: string) => {
  const [y, m] = mes.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return format(d, 'MMMM yyyy', { locale: ptBR })
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function HonorariosPage() {
  const { canEdit } = usePermission()
  const { escritorio } = useAuthStore()
  const { clientes, honorarios, setHonorarios } = useDataStore()
  const escId = escritorio?.id

  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const blank = () => ({
    cliente_id: '',
    valor: '',
    status: 'pendente' as 'pendente' | 'pago' | 'atrasado',
    data_pagamento: '',
    observacoes: '',
  })
  const [form, setForm] = useState(blank())

  const monthHonorarios = useMemo(() =>
    honorarios.filter((h: any) => h.mes_ref === currentMonth),
    [honorarios, currentMonth]
  )

  const stats = useMemo(() => {
    const total    = monthHonorarios.reduce((s: number, h: any) => s + (h.valor || 0), 0)
    const recebido = monthHonorarios.filter((h: any) => h.status === 'pago').reduce((s: number, h: any) => s + h.valor, 0)
    const pendente = monthHonorarios.filter((h: any) => h.status === 'pendente').reduce((s: number, h: any) => s + h.valor, 0)
    const atrasado = monthHonorarios.filter((h: any) => h.status === 'atrasado').reduce((s: number, h: any) => s + h.valor, 0)
    return { total, recebido, pendente, atrasado }
  }, [monthHonorarios])

  // Gerar honorários para o mês a partir dos honorarios padrão dos clientes
  async function gerarMes() {
    if (!escId) return
    const clientesSemHon = clientes.filter((c: any) =>
      c.honorarios && c.honorarios > 0 &&
      !monthHonorarios.find((h: any) => h.cliente_id === c.id)
    )
    if (clientesSemHon.length === 0) {
      toast.info('Todos os clientes já têm honorário gerado para este mês')
      return
    }
    const inserts = clientesSemHon.map((c: any) => ({
      escritorio_id: escId,
      cliente_id: c.id,
      mes_ref: currentMonth,
      valor: c.honorarios,
      status: 'pendente',
    }))
    const { error } = await supabase.from('honorarios').insert(inserts)
    if (error) { toast.error('Erro ao gerar honorários'); return }
    const { data: fresh } = await supabase
      .from('honorarios').select('*,clientes(razao_social,honorarios)')
      .eq('escritorio_id', escId).order('mes_ref', { ascending: false }).limit(500)
    setHonorarios(fresh || [])
    toast.success(`${inserts.length} honorário(s) gerado(s)`)
  }

  async function handleSave() {
    if (savingRef.current) return
    if (!form.cliente_id) { toast.error('Selecione o cliente', { duration: 4000 }); return }
    const valorNum = parseFloat(String(form.valor).replace(',', '.'))
    if (!valorNum || valorNum <= 0) { toast.error('Informe um valor válido', { duration: 4000 }); return }
    if (!escId) { toast.error('Escritório não identificado'); return }
    savingRef.current = true; setSaving(true)
    try {
      const payload = {
        escritorio_id: escId,
        cliente_id: form.cliente_id,
        mes_ref: currentMonth,
        valor: valorNum,
        status: form.status,
        data_pagamento: form.data_pagamento || null,
        observacoes: form.observacoes || null,
      }
      const { error } = await supabase.from('honorarios').insert(payload)
      if (error) throw error
      const { data: fresh } = await supabase
        .from('honorarios').select('*,clientes(razao_social,honorarios)')
        .eq('escritorio_id', escId).order('mes_ref', { ascending: false }).limit(500)
      setHonorarios(fresh || [])
      toast.success('Honorário adicionado')
      setShowModal(false); setForm(blank())
    } catch (e: any) {
      const msg = e?.message || 'Erro ao salvar'
      if (msg.includes('duplicate') || msg.includes('unique')) {
        toast.error('Este cliente já tem honorário neste mês', { duration: 5000 })
      } else if (msg.includes('does not exist') || msg.includes('relation')) {
        toast.error('Tabela não encontrada — rode o SQL no Supabase primeiro', { duration: 6000 })
      } else {
        toast.error(msg, { duration: 5000 })
      }
    } finally {
      savingRef.current = false; setSaving(false)
    }
  }

  async function marcarPago(h: any) {
    if (!escId) return
    setUpdatingId(h.id)
    try {
      const { error } = await supabase
        .from('honorarios')
        .update({ status: 'pago', data_pagamento: format(new Date(), 'yyyy-MM-dd') })
        .eq('id', h.id).eq('escritorio_id', escId)
      if (error) throw error
      const { data: fresh } = await supabase
        .from('honorarios').select('*,clientes(razao_social,honorarios)')
        .eq('escritorio_id', escId).order('mes_ref', { ascending: false }).limit(500)
      setHonorarios(fresh || [])
      toast.success('Marcado como pago')
    } catch { toast.error('Erro ao atualizar') }
    finally { setUpdatingId(null) }
  }

  async function marcarAtrasado(h: any) {
    if (!escId) return
    setUpdatingId(h.id)
    try {
      const { error } = await supabase
        .from('honorarios')
        .update({ status: 'atrasado' })
        .eq('id', h.id).eq('escritorio_id', escId)
      if (error) throw error
      const { data: fresh } = await supabase
        .from('honorarios').select('*,clientes(razao_social,honorarios)')
        .eq('escritorio_id', escId).order('mes_ref', { ascending: false }).limit(500)
      setHonorarios(fresh || [])
      toast.success('Marcado como atrasado')
    } catch { toast.error('Erro ao atualizar') }
    finally { setUpdatingId(null) }
  }

  function exportExcel() {
    const rows = monthHonorarios.map((h: any) => ({
      Cliente: h.clientes?.razao_social || '',
      Mês: mesLabel(h.mes_ref),
      Valor: h.valor,
      Status: h.status,
      'Data Pagamento': h.data_pagamento || '',
      Observações: h.observacoes || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Honorários')
    XLSX.writeFile(wb, `honorarios_${currentMonth}.xlsx`)
  }

  const prevMonth = () => {
    const d = new Date(currentMonth + '-01')
    setCurrentMonth(format(subMonths(d, 1), 'yyyy-MM'))
  }
  const nextMonth = () => {
    const d = new Date(currentMonth + '-01')
    setCurrentMonth(format(addMonths(d, 1), 'yyyy-MM'))
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Honorários <em>Contábeis</em></PageTitle>
        <PageSub>Gerencie cobranças mensais e pagamentos dos clientes</PageSub>
      </PageHeader>

      <Toolbar>
        <NavBtn onClick={prevMonth}><ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} /></NavBtn>
        <MonthLabel>{mesLabel(currentMonth)}</MonthLabel>
        <NavBtn onClick={nextMonth}><ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} /></NavBtn>
        <Spacer />
        <ActionBtn onClick={exportExcel}><Download size={13} />Excel</ActionBtn>
        <ActionBtn onClick={gerarMes}><RefreshCw size={13} />Gerar Mês</ActionBtn>
        <ActionBtn $variant="primary" onClick={() => setShowModal(true)} disabled={!canEdit} style={{ opacity: !canEdit ? 0.4 : 1, cursor: !canEdit ? 'not-allowed' : 'pointer' }}><Plus size={14} />Novo</ActionBtn>
      </Toolbar>

      <StatsRow>
        <StatCard $accent="#1a7a4a">
          <StatLabel>Total do Mês</StatLabel>
          <StatValue>{fmt(stats.total)}</StatValue>
        </StatCard>
        <StatCard $accent="#16a34a">
          <StatLabel>Recebido</StatLabel>
          <StatValue $color="#16a34a">{fmt(stats.recebido)}</StatValue>
        </StatCard>
        <StatCard $accent="#d97706">
          <StatLabel>Pendente</StatLabel>
          <StatValue $color="#d97706">{fmt(stats.pendente)}</StatValue>
        </StatCard>
        <StatCard $accent="#dc2626">
          <StatLabel>Atrasado</StatLabel>
          <StatValue $color="#dc2626">{fmt(stats.atrasado)}</StatValue>
        </StatCard>
      </StatsRow>

      <Table>
        <TableHead>
          <Th>Cliente</Th>
          <TdHide as="div" style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--textDim)' }}>Valor</TdHide>
          <TdHide as="div" style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--textDim)' }}>Pgto</TdHide>
          <Th>Status</Th>
          <Th style={{ textAlign: 'right' }}>Ações</Th>
        </TableHead>
        {monthHonorarios.length === 0 ? (
          <EmptyState>
            Nenhum honorário para {mesLabel(currentMonth)}.<br />
            Clique em "Gerar Mês" para criar automaticamente a partir dos honorários dos clientes.
          </EmptyState>
        ) : monthHonorarios.map((h: any) => (
          <Row key={h.id}>
            <Td>
              {h.clientes?.razao_social || '—'}
              {h.observacoes && <TdSub>{h.observacoes}</TdSub>}
            </Td>
            <TdHide>{fmt(h.valor)}</TdHide>
            <TdHide>{h.data_pagamento ? format(new Date(h.data_pagamento + 'T00:00'), 'dd/MM/yyyy') : '—'}</TdHide>
            <Td><Badge $status={h.status}>{h.status === 'pago' ? 'Pago' : h.status === 'atrasado' ? 'Atrasado' : 'Pendente'}</Badge></Td>
            <Td>
              <BtnRow>
                {h.status !== 'pago' && (
                  <SmBtn $variant="green" disabled={updatingId === h.id || !canEdit} onClick={() => marcarPago(h)}>
                    {updatingId === h.id ? '...' : '✓ Pago'}
                  </SmBtn>
                )}
                {h.status === 'pendente' && (
                  <SmBtn disabled={updatingId === h.id || !canEdit} onClick={() => marcarAtrasado(h)}>
                    Atrasado
                  </SmBtn>
                )}
              </BtnRow>
            </Td>
          </Row>
        ))}
      </Table>

      {showModal && (
        <Overlay onClick={() => setShowModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Novo Honorário</ModalTitle>
              <CloseBtn onClick={() => setShowModal(false)}><X size={14} /></CloseBtn>
            </ModalHead>
            <ModalBody>
              <FormGrid>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Cliente *</Label>
                  <Select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">Selecione o cliente</option>
                    {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </Select>
                </Field>
                <Field>
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0,00"
                    value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Status</Label>
                  <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="atrasado">Atrasado</option>
                  </Select>
                </Field>
                {form.status === 'pago' && (
                  <Field>
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
              <CancelBtn onClick={() => setShowModal(false)}>Cancelar</CancelBtn>
              <SaveBtn disabled={saving || !canEdit} onClick={handleSave}>{saving ? 'Salvando...' : 'Salvar'}</SaveBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </>
  )
}
