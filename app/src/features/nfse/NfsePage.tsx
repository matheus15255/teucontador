import { useState, useMemo, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { FileText, Plus, Download, X, Printer, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'

// ─── Styled ─────────────────────────────────────────────────────────────────
const overlayIn = keyframes`from{opacity:0}to{opacity:1}`
const modalIn   = keyframes`from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}`

const PageHeader = styled.div`margin-bottom: 20px;`
const PageTitle  = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const Toolbar = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap;`
const Spacer  = styled.div`flex: 1;`
const AddBtn  = styled.button`
  display: flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 10px;
  background: ${({ theme }) => theme.green}; color: #fff; border: none; font-size: 13px;
  font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity 0.2s;
  &:hover { opacity: 0.87; }
`

const StatsRow = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`
const StatCard = styled.div<{ $accent: string }>`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 16px; box-shadow: ${({ theme }) => theme.shadow};
  border-left: 3px solid ${({ $accent }) => $accent};
`
const StatLabel = styled.div`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};`
const StatValue = styled.div`font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400; color: ${({ theme }) => theme.text}; margin-top: 4px;`

const Table = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`
const TableHead = styled.div`
  display: grid; grid-template-columns: 60px 2fr 1.5fr 1fr 1fr 120px;
  padding: 10px 18px; border-bottom: 1px solid ${({ theme }) => theme.border};
  @media (max-width: 800px) { grid-template-columns: 60px 2fr 1fr 120px; }
`
const Th = styled.div`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};`
const Row = styled.div`
  display: grid; grid-template-columns: 60px 2fr 1.5fr 1fr 1fr 120px;
  padding: 12px 18px; border-bottom: 1px solid ${({ theme }) => theme.border};
  align-items: center;
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
  @media (max-width: 800px) { grid-template-columns: 60px 2fr 1fr 120px; }
`
const Td     = styled.div`font-size: 13px; color: ${({ theme }) => theme.text};`
const TdSub  = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`
const TdHide = styled(Td)`@media (max-width: 800px) { display: none; }`
const BtnRow = styled.div`display: flex; gap: 5px; justify-content: flex-end;`
const SmBtn  = styled.button<{ $danger?: boolean }>`
  width: 28px; height: 28px; border-radius: 7px;
  border: 1.5px solid ${({ theme, $danger }) => $danger ? '#dc262633' : theme.border};
  background: ${({ $danger }) => $danger ? '#dc262611' : 'transparent'};
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: ${({ theme, $danger }) => $danger ? '#dc2626' : theme.textDim}; transition: all 0.2s;
  &:hover { opacity: 0.75; }
`

const Badge = styled.span<{ $emitida: boolean }>`
  padding: 3px 9px; border-radius: 7px; font-size: 11px; font-weight: 600;
  background: ${({ $emitida }) => $emitida ? '#dcfce7' : '#fee2e2'};
  color: ${({ $emitida }) => $emitida ? '#16a34a' : '#dc2626'};
`

const EmptyState = styled.div`
  padding: 50px 20px; text-align: center; color: ${({ theme }) => theme.textDim}; font-size: 14px;
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
  width: 100%; max-width: 560px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${modalIn} 0.22s ease; overflow: hidden; max-height: 90vh; overflow-y: auto;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; }
`
const ModalHead = styled.div`
  padding: 18px 20px 14px; border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; background: ${({ theme }) => theme.surface}; z-index: 1;
`
const ModalTitle = styled.div`font-family: 'Playfair Display', serif; font-size: 18px; color: ${({ theme }) => theme.text};`
const CloseBtn   = styled.button`
  width: 28px; height: 28px; border-radius: 7px; border: none; background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: ${({ theme }) => theme.textDim}; &:hover { background: ${({ theme }) => theme.surface2}; }
`
const ModalBody = styled.div`padding: 18px 20px 20px;`
const SectionTitle = styled.div`
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
  color: ${({ theme }) => theme.textDim}; margin: 16px 0 8px;
  &:first-child { margin-top: 0; }
`
const FormGrid  = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px; @media(max-width:480px){grid-template-columns:1fr;}`
const Field     = styled.div`display: flex; flex-direction: column; gap: 5px;`
const Label     = styled.label`font-size: 11.5px; font-weight: 600; color: ${({ theme }) => theme.textMid}; text-transform: uppercase; letter-spacing: 0.5px;`
const Input     = styled.input`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13.5px; font-family: 'Inter', sans-serif;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
`
const ModalSelect = styled.select`
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
const CalcRow = styled.div`
  background: ${({ theme }) => theme.surface2}; border-radius: 10px; padding: 12px 14px;
  margin-top: 12px; display: flex; flex-direction: column; gap: 6px;
`
const CalcItem = styled.div`display: flex; justify-content: space-between; font-size: 13px; color: ${({ theme }) => theme.textMid};`
const CalcTotal = styled(CalcItem)`font-weight: 700; font-size: 15px; color: ${({ theme }) => theme.text}; border-top: 1px solid ${({ theme }) => theme.border}; padding-top: 8px; margin-top: 2px;`
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px;
  border-top: 1px solid ${({ theme }) => theme.border}; position: sticky; bottom: 0;
  background: ${({ theme }) => theme.surface};
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
  font-size: 13.5px; cursor: pointer; font-family: 'Inter', sans-serif;
  &:hover { background: ${({ theme }) => theme.surface2}; }
`

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function gerarPDF(nota: any, escritorio: any) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const M = 15

  // Header
  doc.setFillColor(26, 122, 74)
  doc.rect(0, 0, W, 28, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16); doc.setTextColor(255, 255, 255)
  doc.text('NOTA DE SERVIÇO', M, 13)
  doc.setFontSize(10)
  doc.text(`Nº ${String(nota.numero).padStart(6, '0')}`, W - M, 13, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(`Emitida em ${format(new Date(nota.data_emissao + 'T00:00'), 'dd/MM/yyyy')}`, W - M, 20, { align: 'right' })

  let y = 38

  // Prestador
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(26, 122, 74)
  doc.text('PRESTADOR DE SERVIÇOS', M, y)
  y += 5
  doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40); doc.setFontSize(10)
  doc.text(escritorio?.nome || 'TEUcontador', M, y); y += 5

  // Tomador
  if (nota.tomador_razao || nota.clientes?.razao_social) {
    y += 5
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(26, 122, 74)
    doc.text('TOMADOR DE SERVIÇOS', M, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40)
    doc.text(nota.tomador_razao || nota.clientes?.razao_social || '', M, y); y += 5
    if (nota.tomador_cnpj) { doc.text(`CNPJ: ${nota.tomador_cnpj}`, M, y); y += 5 }
    if (nota.tomador_municipio) { doc.text(`Município: ${nota.tomador_municipio}`, M, y); y += 5 }
  }

  // Serviço
  y += 5
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(26, 122, 74)
  doc.text('DESCRIÇÃO DO SERVIÇO', M, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40)
  const lines = doc.splitTextToSize(nota.descricao_servico, W - 2 * M)
  doc.text(lines, M, y); y += lines.length * 5 + 5

  // Valores
  autoTable(doc, {
    startY: y,
    head: [['Descrição', 'Valor']],
    body: [
      ['Valor do Serviço', fmt(nota.valor_servico)],
      [`ISS (${nota.aliquota_iss ?? 2}%)`, `- ${fmt(nota.valor_iss || 0)}`],
      ...(nota.aliquota_ir > 0 ? [[`IRRF (${nota.aliquota_ir}%)`, `- ${fmt(nota.valor_ir || 0)}`]] : []),
      ['Valor Líquido', fmt(nota.valor_liquido || nota.valor_servico)],
    ],
    headStyles: { fillColor: [26, 122, 74], textColor: 255 },
    alternateRowStyles: { fillColor: [247, 245, 240] },
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
  })

  if (nota.observacoes) {
    const finalY = (doc as any).lastAutoTable.finalY + 8
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(100)
    doc.text('OBSERVAÇÕES:', M, finalY)
    doc.setFont('helvetica', 'normal')
    doc.text(nota.observacoes, M, finalY + 5)
  }

  // Footer
  doc.setFontSize(8); doc.setTextColor(150)
  doc.text('Documento gerado pelo TEUcontador — sistema de gestão contábil', W / 2, 287, { align: 'center' })

  doc.save(`NFS-e_${String(nota.numero).padStart(6, '0')}.pdf`)
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function NfsePage() {
  const { escritorio } = useAuthStore()
  const { clientes, notasServico, setNotasServico } = useDataStore()
  const escId = escritorio?.id

  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const savingRef = useRef(false)

  const blank = () => ({
    cliente_id: '',
    data_emissao: format(new Date(), 'yyyy-MM-dd'),
    descricao_servico: '',
    valor_servico: '',
    aliquota_iss: '2',
    aliquota_ir: '0',
    tomador_razao: '',
    tomador_cnpj: '',
    tomador_municipio: '',
    observacoes: '',
  })
  const [form, setForm] = useState(blank())

  const calc = useMemo(() => {
    const valor  = parseFloat(String(form.valor_servico).replace(',', '.')) || 0
    const iss    = (parseFloat(String(form.aliquota_iss)) || 0) / 100
    const ir     = (parseFloat(String(form.aliquota_ir))  || 0) / 100
    const vlIss  = valor * iss
    const vlIr   = valor * ir
    const liquido = valor - vlIss - vlIr
    return { valor, vlIss, vlIr, liquido }
  }, [form.valor_servico, form.aliquota_iss, form.aliquota_ir])

  const stats = useMemo(() => {
    const emitidas  = notasServico.filter((n: any) => n.status === 'emitida')
    const total     = emitidas.reduce((s: number, n: any) => s + (n.valor_servico || 0), 0)
    const totalLiq  = emitidas.reduce((s: number, n: any) => s + (n.valor_liquido || 0), 0)
    return { qtd: emitidas.length, total, totalLiq }
  }, [notasServico])

  async function handleSave() {
    if (savingRef.current) return
    if (!form.descricao_servico || !form.valor_servico) {
      toast.error('Preencha descrição e valor'); return
    }
    if (!escId) return
    savingRef.current = true; setSaving(true)
    try {
      const clienteSelecionado = clientes.find((c: any) => c.id === form.cliente_id)
      const payload = {
        escritorio_id: escId,
        cliente_id: form.cliente_id || null,
        data_emissao: form.data_emissao,
        descricao_servico: form.descricao_servico,
        valor_servico: calc.valor,
        aliquota_iss: parseFloat(String(form.aliquota_iss)) || 0,
        valor_iss: calc.vlIss,
        aliquota_ir: parseFloat(String(form.aliquota_ir)) || 0,
        valor_ir: calc.vlIr,
        valor_liquido: calc.liquido,
        tomador_razao: form.tomador_razao || clienteSelecionado?.razao_social || null,
        tomador_cnpj: form.tomador_cnpj || clienteSelecionado?.cnpj || null,
        tomador_municipio: form.tomador_municipio || clienteSelecionado?.municipio || null,
        status: 'emitida',
        observacoes: form.observacoes || null,
      }
      const { data: inserted, error } = await supabase
        .from('notas_servico').insert(payload).select('id')
      if (error) throw error
      const { data: fresh } = await supabase
        .from('notas_servico').select('*,clientes(razao_social)')
        .eq('escritorio_id', escId).order('data_emissao', { ascending: false }).limit(300)
      setNotasServico(fresh || [])
      toast.success('Nota emitida!')
      // Gerar PDF com a nota recém-inserida
      const nota = fresh?.find((n: any) => n.id === inserted?.[0]?.id)
      if (nota) gerarPDF(nota, escritorio)
      setShowModal(false); setForm(blank())
    } catch (e: any) {
      toast.error(e.message || 'Erro ao emitir')
    } finally {
      savingRef.current = false; setSaving(false)
    }
  }

  async function handleCancelar(id: string) {
    if (!escId || !confirm('Cancelar esta nota?')) return
    const { error } = await supabase
      .from('notas_servico').update({ status: 'cancelada' }).eq('id', id).eq('escritorio_id', escId)
    if (error) { toast.error('Erro ao cancelar'); return }
    const { data: fresh } = await supabase
      .from('notas_servico').select('*,clientes(razao_social)')
      .eq('escritorio_id', escId).order('data_emissao', { ascending: false }).limit(300)
    setNotasServico(fresh || [])
    toast.success('Nota cancelada')
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Notas de <em>Serviço</em></PageTitle>
        <PageSub>Emita e gerencie notas fiscais de serviço com geração de PDF</PageSub>
      </PageHeader>

      <StatsRow>
        <StatCard $accent="#1a7a4a">
          <StatLabel>Notas Emitidas</StatLabel>
          <StatValue>{stats.qtd}</StatValue>
        </StatCard>
        <StatCard $accent="#2563eb">
          <StatLabel>Valor Total Bruto</StatLabel>
          <StatValue style={{ fontSize: 18 }}>{fmt(stats.total)}</StatValue>
        </StatCard>
        <StatCard $accent="#16a34a">
          <StatLabel>Valor Líquido Total</StatLabel>
          <StatValue style={{ fontSize: 18 }}>{fmt(stats.totalLiq)}</StatValue>
        </StatCard>
      </StatsRow>

      <Toolbar>
        <Spacer />
        <AddBtn onClick={() => setShowModal(true)}><Plus size={14} />Emitir Nota</AddBtn>
      </Toolbar>

      <Table>
        <TableHead>
          <Th>Nº</Th>
          <Th>Tomador / Descrição</Th>
          <TdHide as="div" style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.7px',color:'var(--textDim)' }}>Data</TdHide>
          <Th>Valor</Th>
          <TdHide as="div" style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.7px',color:'var(--textDim)' }}>Status</TdHide>
          <Th style={{ textAlign: 'right' }}>Ações</Th>
        </TableHead>
        {notasServico.length === 0 ? (
          <EmptyState>Nenhuma nota emitida ainda.</EmptyState>
        ) : notasServico.map((n: any) => (
          <Row key={n.id}>
            <Td style={{ fontWeight: 600, color: 'var(--green)' }}>#{String(n.numero).padStart(4,'0')}</Td>
            <Td>
              {n.tomador_razao || n.clientes?.razao_social || '—'}
              <TdSub>{n.descricao_servico?.substring(0, 50)}{n.descricao_servico?.length > 50 ? '...' : ''}</TdSub>
            </Td>
            <TdHide>{format(new Date(n.data_emissao + 'T00:00'), 'dd/MM/yyyy')}</TdHide>
            <Td>{fmt(n.valor_servico)}</Td>
            <TdHide><Badge $emitida={n.status === 'emitida'}>{n.status === 'emitida' ? 'Emitida' : 'Cancelada'}</Badge></TdHide>
            <Td>
              <BtnRow>
                <SmBtn title="Baixar PDF" onClick={() => gerarPDF(n, escritorio)}><Download size={12} /></SmBtn>
                {n.status === 'emitida' && (
                  <SmBtn $danger title="Cancelar" onClick={() => handleCancelar(n.id)}><XCircle size={12} /></SmBtn>
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
              <ModalTitle>Emitir Nota de Serviço</ModalTitle>
              <CloseBtn onClick={() => setShowModal(false)}><X size={14} /></CloseBtn>
            </ModalHead>
            <ModalBody>
              <SectionTitle>Serviço</SectionTitle>
              <FormGrid>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Descrição do Serviço *</Label>
                  <Textarea placeholder="Serviços de contabilidade, assessoria fiscal..." value={form.descricao_servico}
                    onChange={e => setForm(f => ({ ...f, descricao_servico: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Valor do Serviço (R$) *</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0,00"
                    value={form.valor_servico} onChange={e => setForm(f => ({ ...f, valor_servico: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Data de Emissão</Label>
                  <Input type="date" value={form.data_emissao}
                    onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Alíquota ISS (%)</Label>
                  <Input type="number" step="0.01" min="0" max="5" value={form.aliquota_iss}
                    onChange={e => setForm(f => ({ ...f, aliquota_iss: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Alíquota IRRF (%)</Label>
                  <Input type="number" step="0.01" min="0" max="20" value={form.aliquota_ir}
                    onChange={e => setForm(f => ({ ...f, aliquota_ir: e.target.value }))} />
                </Field>
              </FormGrid>

              {calc.valor > 0 && (
                <CalcRow>
                  <CalcItem><span>Valor Bruto</span><span>{fmt(calc.valor)}</span></CalcItem>
                  <CalcItem><span>ISS ({form.aliquota_iss}%)</span><span>- {fmt(calc.vlIss)}</span></CalcItem>
                  {calc.vlIr > 0 && <CalcItem><span>IRRF ({form.aliquota_ir}%)</span><span>- {fmt(calc.vlIr)}</span></CalcItem>}
                  <CalcTotal><span>Valor Líquido</span><span style={{ color: '#1a7a4a' }}>{fmt(calc.liquido)}</span></CalcTotal>
                </CalcRow>
              )}

              <SectionTitle>Tomador</SectionTitle>
              <FormGrid>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Vincular a Cliente</Label>
                  <ModalSelect value={form.cliente_id} onChange={e => {
                    const c = clientes.find((x: any) => x.id === e.target.value)
                    setForm(f => ({
                      ...f, cliente_id: e.target.value,
                      tomador_razao: c?.razao_social || f.tomador_razao,
                      tomador_cnpj: c?.cnpj || f.tomador_cnpj,
                      tomador_municipio: c?.municipio || f.tomador_municipio,
                    }))
                  }}>
                    <option value="">— Preencher manualmente —</option>
                    {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </ModalSelect>
                </Field>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Razão Social do Tomador</Label>
                  <Input placeholder="Nome da empresa..." value={form.tomador_razao}
                    onChange={e => setForm(f => ({ ...f, tomador_razao: e.target.value }))} />
                </Field>
                <Field>
                  <Label>CNPJ do Tomador</Label>
                  <Input placeholder="00.000.000/0000-00" value={form.tomador_cnpj}
                    onChange={e => setForm(f => ({ ...f, tomador_cnpj: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Município</Label>
                  <Input placeholder="Ex: São Paulo/SP" value={form.tomador_municipio}
                    onChange={e => setForm(f => ({ ...f, tomador_municipio: e.target.value }))} />
                </Field>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Observações</Label>
                  <Textarea placeholder="Opcional..." value={form.observacoes}
                    onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
                </Field>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={() => setShowModal(false)}>Cancelar</CancelBtn>
              <SaveBtn disabled={saving} onClick={handleSave}>
                {saving ? 'Emitindo...' : '✓ Emitir e Baixar PDF'}
              </SaveBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </>
  )
}
