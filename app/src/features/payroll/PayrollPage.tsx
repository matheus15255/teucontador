import { useEffect, useState, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import {
  Plus, Search, X, FileText, Edit2, Trash2, Eye,
  Download, User, Briefcase, DollarSign, Building2, Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { usePermission } from '../../hooks/usePermission'
import type { Colaborador } from '../../types'

// ─── Cálculos Trabalhistas 2024 ───────────────────────────────────────────────

// Tabela progressiva INSS 2024
const calcInss = (sal: number): number => {
  if (sal <= 0) return 0
  const faixas = [
    { ate: 1412.00, aliq: 0.075 },
    { ate: 2666.68, aliq: 0.09 },
    { ate: 4000.03, aliq: 0.12 },
    { ate: 7786.02, aliq: 0.14 },
  ]
  let inss = 0
  let anterior = 0
  for (const f of faixas) {
    if (sal <= anterior) break
    const base = Math.min(sal, f.ate) - anterior
    inss += base * f.aliq
    anterior = f.ate
    if (sal <= f.ate) break
  }
  return Math.round(inss * 100) / 100
}

// Tabela IRRF 2024 (MP 1.206 — vigente desde abril/2024)
const calcIrrf = (baseIrrf: number): number => {
  if (baseIrrf <= 2259.20) return 0
  if (baseIrrf <= 2826.65) return Math.max(0, baseIrrf * 0.075 - 169.44)
  if (baseIrrf <= 3751.05) return Math.max(0, baseIrrf * 0.15 - 381.44)
  if (baseIrrf <= 4664.68) return Math.max(0, baseIrrf * 0.225 - 662.77)
  return Math.max(0, baseIrrf * 0.275 - 896.00)
}

const DEDUCAO_DEPENDENTE = 189.59  // 2024
const FGTS_ALIQ = 0.08

const calcColaborador = (c: Colaborador) => {
  const bruto = Number(c.salario_bruto) || 0
  const inss = calcInss(bruto)
  const dep = Number(c.dependentes) || 0
  const baseIrrf = Math.max(0, bruto - inss - dep * DEDUCAO_DEPENDENTE)
  const irrf = calcIrrf(baseIrrf)
  const vt = c.vale_transporte ? Math.min(bruto * 0.06, bruto) : 0
  const liquido = bruto - inss - irrf - vt
  const fgts = bruto * FGTS_ALIQ
  return { bruto, inss, irrf, vt, liquido, fgts }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
const maskCpf = (v: string) => v.replace(/\D/g, '').slice(0, 11)
  .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  .replace(/^(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
  .replace(/^(\d{3})(\d{3})/, '$1.$2')
const maskPis = (v: string) => v.replace(/\D/g, '').slice(0, 11)
  .replace(/^(\d{3})(\d{5})(\d{2})(\d)$/, '$1.$2.$3-$4')

const statusLabel: Record<string, string> = { ativo: 'Ativo', ferias: 'Férias', afastado: 'Afastado', demitido: 'Demitido' }
const statusColor: Record<string, 'ok' | 'info' | 'warn' | 'late'> = { ativo: 'ok', ferias: 'info', afastado: 'warn', demitido: 'late' }

// ─── Holerite PDF ─────────────────────────────────────────────────────────────

function gerarHolerite(c: Colaborador, escritorioNome: string, clienteNome: string) {
  const { bruto, inss, irrf, vt, liquido, fgts } = calcColaborador(c)
  const mes = format(new Date(), 'MMMM/yyyy')
  const doc = new jsPDF()
  const w = doc.internal.pageSize.getWidth()

  doc.setFillColor(26, 122, 74)
  doc.rect(0, 0, w, 24, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text('HOLERITE / RECIBO DE PAGAMENTO', w / 2, 11, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(`${escritorioNome}  ·  Referência: ${mes}`, w / 2, 18, { align: 'center' })

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO COLABORADOR', 14, 34)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text(`Nome: ${c.nome}`, 14, 41)
  doc.text(`CPF: ${c.cpf || '—'}   PIS: ${c.pis || '—'}`, 14, 47)
  doc.text(`Cargo: ${c.cargo || '—'}   CBO: ${c.cbo || '—'}`, 14, 53)
  doc.text(`Tipo: ${c.tipo_contrato || 'CLT'}`, 14, 59)
  doc.text(`Empresa: ${clienteNome}   Depto: ${c.departamento || '—'}`, 14, 65)

  autoTable(doc, {
    startY: 72,
    head: [['PROVENTOS', 'Valor (R$)']],
    body: [
      ['Salário Base', fmt(bruto)],
    ],
    foot: [['TOTAL PROVENTOS', fmt(bruto)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [26, 122, 74], textColor: 255 },
    footStyles: { fillColor: [240, 248, 244], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: w / 2 + 4 },
  })

  const proventosY = (doc as any).lastAutoTable.finalY

  autoTable(doc, {
    startY: 72,
    head: [['DESCONTOS', 'Valor (R$)']],
    body: [
      ['INSS (tabela progressiva)', fmt(inss)],
      ['IRRF (tabela 2024)', fmt(irrf)],
      ...(vt > 0 ? [['Vale Transporte (6%)', fmt(vt)]] : []),
    ],
    foot: [['TOTAL DESCONTOS', fmt(inss + irrf + vt)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [197, 48, 48], textColor: 255 },
    footStyles: { fillColor: [253, 240, 240], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: w / 2 + 4, right: 14 },
  })

  const finalY = Math.max(proventosY, (doc as any).lastAutoTable.finalY) + 6

  doc.setFillColor(26, 122, 74)
  doc.rect(14, finalY, w - 28, 12, 'F')
  doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('SALÁRIO LÍQUIDO', 18, finalY + 8)
  doc.text(fmt(liquido), w - 16, finalY + 8, { align: 'right' })

  doc.setTextColor(80); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text(`FGTS do mês (encargo patronal 8%): ${fmt(fgts)}  |  Base INSS: ${fmt(bruto)}  |  Dependentes p/ IRRF: ${c.dependentes || 0}`, 14, finalY + 22)

  const assinY = finalY + 40
  doc.setDrawColor(180)
  doc.line(14, assinY, 90, assinY)
  doc.line(w - 90, assinY, w - 14, assinY)
  doc.setFontSize(8)
  doc.text('Assinatura do Colaborador', 14, assinY + 5)
  doc.text('Responsável / Escritório', w - 90, assinY + 5)

  doc.save(`Holerite_${c.nome.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM')}.pdf`)
}

// ─── Exportar Folha Excel ─────────────────────────────────────────────────────

function exportarFolha(colaboradores: Colaborador[]) {
  const mes = format(new Date(), 'MM/yyyy')
  const rows = colaboradores.map(c => {
    const { bruto, inss, irrf, vt, liquido, fgts } = calcColaborador(c)
    return [
      c.nome, c.cpf, c.cargo, c.tipo_contrato, c.status_colab,
      bruto, inss, irrf, vt, fgts, liquido,
      c.dependentes || 0, c.banco, c.agencia, c.conta_bancaria,
    ]
  })
  const data = [
    ['FOLHA DE PAGAMENTO', `Referência: ${mes}`],
    [],
    ['Nome', 'CPF', 'Cargo', 'Contrato', 'Status',
      'Sal. Bruto', 'INSS', 'IRRF', 'VT', 'FGTS', 'Sal. Líquido',
      'Dep.', 'Banco', 'Agência', 'Conta'],
    ...rows,
    [],
    ['TOTAIS', '', '', '', '',
      rows.reduce((s, r) => s + (r[5] as number), 0),
      rows.reduce((s, r) => s + (r[6] as number), 0),
      rows.reduce((s, r) => s + (r[7] as number), 0),
      rows.reduce((s, r) => s + (r[8] as number), 0),
      rows.reduce((s, r) => s + (r[9] as number), 0),
      rows.reduce((s, r) => s + (r[10] as number), 0),
    ],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 6 }, { wch: 14 }, { wch: 10 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Folha')
  XLSX.writeFile(wb, `Folha_${format(new Date(), 'yyyy-MM')}.xlsx`)
}

// ─── Styled Components ────────────────────────────────────────────────────────

const PageHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;`
const PageTitle = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`
const HeaderActions = styled.div`display: flex; gap: 8px; align-items: center; flex-wrap: wrap;`

const AddBtn = styled(motion.button)`
  display: flex; align-items: center; gap: 8px; padding: 10px 18px;
  background: ${({ theme }) => theme.green}; color: #fff; border: none; border-radius: 10px;
  font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
  box-shadow: 0 3px 15px rgba(26,122,74,0.25); transition: background 0.2s;
  &:hover { background: ${({ theme }) => theme.greenMid}; }
`
const SecBtn = styled(motion.button)`
  display: flex; align-items: center; gap: 7px; padding: 10px 16px;
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.textMid};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 10px;
  font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif; cursor: pointer;
  transition: all 0.2s; &:hover { border-color: ${({ theme }) => theme.greenMid}; color: ${({ theme }) => theme.green}; }
`

const StatsRow = styled.div`display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }`
const StatCard = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 16px; box-shadow: ${({ theme }) => theme.shadow};
`
const StatLabel = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-bottom: 4px;`
const StatSub = styled.div`font-size: 10px; color: ${({ theme }) => theme.textDim}; margin-top: 2px; opacity: 0.7;`
const StatValue = styled.div<{ $color?: string }>`
  font-family: 'Playfair Display', serif; font-size: 22px; letter-spacing: -0.5px;
  color: ${({ theme, $color }) => $color || theme.text};
`

const Toolbar = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;`
const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 8px 13px; width: 240px;
  &:focus-within { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
  input { border: none; background: none; font-size: 13px; color: ${({ theme }) => theme.text};
    outline: none; width: 100%; font-family: 'Inter', sans-serif;
    &::placeholder { color: ${({ theme }) => theme.textDim}; } }
  @media (max-width: 600px) { width: 100%; flex: 1; min-width: 0; }
`
const TabRow = styled.div`
  display: flex; gap: 4px; background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 3px;
`
const Tab = styled.button<{ $active: boolean }>`
  padding: 6px 12px; border-radius: 7px; font-size: 12px;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  color: ${({ theme, $active }) => $active ? theme.green : theme.textDim};
  background: ${({ theme, $active }) => $active ? theme.surface : 'transparent'};
  border: none; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
  box-shadow: ${({ $active }) => $active ? '0 1px 4px rgba(0,0,0,0.07)' : 'none'};
`
const ClienteSelect = styled.select`
  padding: 8px 12px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; font-size: 13px;
  color: ${({ theme }) => theme.text}; outline: none; font-family: 'Inter', sans-serif; cursor: pointer;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; }
`

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`
const Table = styled.table`width: 100%; border-collapse: collapse;`
const Thead = styled.thead`
  th { padding: 10px 14px; text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: ${({ theme }) => theme.textDim}; background: ${({ theme }) => theme.surface2};
    border-bottom: 1px solid ${({ theme }) => theme.border}; white-space: nowrap; }
`
const Tbody = styled.tbody`
  tr { border-bottom: 1px solid ${({ theme }) => theme.border}; transition: background 0.15s;
    &:last-child { border-bottom: none; } &:hover { background: ${({ theme }) => theme.surface2}; } }
  td { padding: 10px 14px; font-size: 13px; }
`
const Avatar = styled.div`
  width: 32px; height: 32px; border-radius: 50%; background: ${({ theme }) => theme.green};
  display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
`
const CellRow = styled.div`display: flex; align-items: center; gap: 10px;`
const ActionRow = styled.div`display: flex; gap: 4px;`
const ActBtn = styled.button`
  width: 28px; height: 28px; border-radius: 7px; background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border}; display: flex; align-items: center;
  justify-content: center; cursor: pointer; color: ${({ theme }) => theme.textDim}; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green}; border-color: rgba(26,122,74,0.2); }
`
const Badge = styled.span<{ $type: 'ok' | 'info' | 'warn' | 'late' }>`
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 20px;
  font-size: 10.5px; font-weight: 600;
  background: ${({ theme, $type }) => ({ ok: theme.posBg, info: theme.infoBg, warn: theme.warnBg, late: theme.negBg }[$type])};
  color: ${({ theme, $type }) => ({ ok: theme.pos, info: theme.info, warn: theme.warn, late: theme.neg }[$type])};
  &::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
`
const EmptyState = styled.div`text-align: center; padding: 60px 20px; color: ${({ theme }) => theme.textDim};`

// ─── DP Tabs ──────────────────────────────────────────────────────────────────
const DpTabBar = styled.div`
  display: flex; gap: 4px; background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border}; border-radius: 12px;
  padding: 5px; margin-bottom: 20px; width: fit-content;
`
const DpTab = styled.button<{ $active: boolean }>`
  padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: ${({ $active }) => $active ? 600 : 400};
  color: ${({ theme, $active }) => $active ? theme.green : theme.textMid};
  background: ${({ theme, $active }) => $active ? theme.greenLight : 'transparent'};
  border: 1px solid ${({ theme, $active }) => $active ? 'rgba(26,122,74,0.2)' : 'transparent'};
  cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.18s;
  &:hover { background: ${({ theme, $active }) => $active ? theme.greenLight : theme.surface2}; }
`
const DpPanel = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; padding: 22px 24px; box-shadow: ${({ theme }) => theme.shadow};
`
const DpTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 400;
  color: ${({ theme }) => theme.text}; margin-bottom: 16px;
`
const DpGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 14px; @media(max-width:600px){grid-template-columns:1fr;}`
const DpField = styled.div`display: flex; flex-direction: column; gap: 5px;`
const DpLabel = styled.label`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};`
const DpInput = styled.input`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13.5px; font-family: 'Inter', sans-serif;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
`
const DpSelect = styled.select`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13.5px; font-family: 'Inter', sans-serif;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; }
`
const DpResult = styled.div`
  background: ${({ theme }) => theme.greenLight}; border: 1px solid rgba(26,122,74,0.2);
  border-radius: 12px; padding: 16px; margin-top: 16px;
`
const DpResultRow = styled.div<{ $bold?: boolean }>`
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; font-size: ${({ $bold }) => $bold ? '15px' : '13px'};
  font-weight: ${({ $bold }) => $bold ? '700' : '400'};
  color: ${({ theme, $bold }) => $bold ? theme.green : theme.textMid};
  border-top: ${({ $bold, theme }) => $bold ? `1px solid ${theme.border}` : 'none'};
  margin-top: ${({ $bold }) => $bold ? '8px' : '0'};
  padding-top: ${({ $bold }) => $bold ? '10px' : '6px'};
`

const overlayIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const modalIn = keyframes`from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); }`

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: ${overlayIn} 0.18s ease;
  @media (max-width: 600px) { align-items: flex-end; padding: 0; }
`
const Modal = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px; width: 100%; max-width: 660px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${modalIn} 0.2s ease;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; }
`
const ModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between; padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  position: sticky; top: 0; background: ${({ theme }) => theme.surface}; z-index: 1;
`
const ModalTitle = styled.div`font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400; color: ${({ theme }) => theme.text};`
const CloseBtn = styled.button`
  width: 32px; height: 32px; border-radius: 8px; background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border}; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: ${({ theme }) => theme.textDim}; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.negBg}; color: ${({ theme }) => theme.neg}; }
`
const ModalBody = styled.div`padding: 24px;`
const FormGrid = styled.div<{ $cols?: number }>`
  display: grid; grid-template-columns: repeat(${({ $cols }) => $cols || 2}, 1fr); gap: 14px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`
const Field = styled.div``
const FieldLabel = styled.label`
  display: block; font-size: 10px; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; color: ${({ theme }) => theme.textDim}; margin-bottom: 6px;
`
const Input = styled.input`
  width: 100%; padding: 10px 14px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; font-size: 13px;
  color: ${({ theme }) => theme.text}; outline: none; font-family: 'Inter', sans-serif;
  box-sizing: border-box; transition: all 0.2s;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
  &::placeholder { color: ${({ theme }) => theme.textDim}; }
`
const Select = styled.select`
  width: 100%; padding: 10px 14px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; font-size: 13px;
  color: ${({ theme }) => theme.text}; outline: none; font-family: 'Inter', sans-serif; cursor: pointer;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
`
const SectionTitle = styled.div`
  font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
  color: ${({ theme }) => theme.textDim}; margin: 20px 0 12px;
  display: flex; align-items: center; gap: 8px;
  &::after { content: ''; flex: 1; height: 1px; background: ${({ theme }) => theme.border}; }
`
const PreviewBox = styled.div`
  background: ${({ theme }) => theme.surface2}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px; padding: 14px; margin-top: 4px;
`
const PreviewRow = styled.div<{ $bold?: boolean; $color?: string }>`
  display: flex; justify-content: space-between; font-size: 12px;
  font-weight: ${({ $bold }) => $bold ? 700 : 400};
  color: ${({ theme, $color }) => $color || theme.textMid};
  padding: 3px 0;
  border-top: ${({ $bold, theme }) => $bold ? `1px solid ${theme.border}` : 'none'};
  margin-top: ${({ $bold }) => $bold ? '6px' : '0'};
  padding-top: ${({ $bold }) => $bold ? '8px' : '3px'};
`
const CheckRow = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  background: ${({ theme }) => theme.surface2}; border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px; cursor: pointer; user-select: none; transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.greenMid}; }
`
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.border};
  position: sticky; bottom: 0; background: ${({ theme }) => theme.surface};
`
const CancelBtn = styled.button`
  padding: 10px 20px; border-radius: 9px; background: ${({ theme }) => theme.surface2};
  border: 1.5px solid ${({ theme }) => theme.border}; font-size: 13px; font-weight: 500;
  color: ${({ theme }) => theme.textMid}; cursor: pointer; font-family: 'Inter', sans-serif;
`
const SaveBtn = styled(motion.button)`
  padding: 10px 22px; border-radius: 9px; background: ${({ theme }) => theme.green};
  color: #fff; border: none; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif;
  cursor: pointer; box-shadow: 0 3px 12px rgba(26,122,74,0.25); transition: background 0.2s;
  &:hover { background: ${({ theme }) => theme.greenMid}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

type ModalMode = 'add' | 'edit' | 'view' | null

const blank = (): Partial<Colaborador> => ({
  nome: '', cpf: '', pis: '', cargo: '', cbo: '', tipo_contrato: 'CLT',
  status_colab: 'ativo', departamento: '', salario_bruto: 0,
  dependentes: 0, vale_transporte: false, vale_refeicao: 0,
  email: '', telefone: '', ctps: '', banco: '', agencia: '', conta_bancaria: '',
  observacoes: '', cliente_id: '',
})

// ─── Component ────────────────────────────────────────────────────────────────

export function PayrollPage() {
  const { canEdit, canDelete } = usePermission()
  const { escritorio } = useAuthStore()
  const {
    colaboradores: cachedColaboradores, setColaboradores: setCachedColaboradores,
    clientes: cachedClientes,
  } = useDataStore()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(cachedColaboradores)
  const [filtered, setFiltered] = useState<Colaborador[]>([])
  const [clientes, setClientes] = useState<{ id: string; razao_social: string }[]>(cachedClientes)
  const [dpTab, setDpTab] = useState<'folha' | 'ferias' | 'decimo' | 'rescisao'>('folha')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('todos')
  const [clienteFilter, setClienteFilter] = useState('')
  const [loading, setLoading] = useState(cachedColaboradores.length === 0)
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Partial<Colaborador>>(blank())
  const [saving, setSaving] = useState(false)

  // DP calculators state
  const [ferias, setFerias] = useState({ salario: '', diasFerias: '30', abono: false, colaborador: '' })
  const [decimo, setDecimo] = useState({ salario: '', mesesTrabalhados: '12', colaborador: '' })
  const [rescisao, setRescisao] = useState({ salario: '', tipoRescisao: 'sem_justa_causa', diasAviso: '30', diasFgts: '0', colaborador: '' })

  const escId = escritorio?.id

  const load = async () => {
    if (colaboradores.length === 0) setLoading(true)
    let q = supabase.from('colaboradores').select('*, clientes(razao_social)').order('nome').limit(300)
    if (escId) q = q.eq('escritorio_id', escId)
    const { data } = await q
    const result = (data || []) as Colaborador[]
    setColaboradores(result)
    setCachedColaboradores(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [escId])

  useEffect(() => {
    let list = colaboradores
    if (tab !== 'todos') list = list.filter(c => c.status_colab === tab)
    if (clienteFilter) list = list.filter(c => c.cliente_id === clienteFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.nome?.toLowerCase().includes(q) ||
        c.cargo?.toLowerCase().includes(q) ||
        c.cpf?.includes(q)
      )
    }
    setFiltered(list)
  }, [colaboradores, search, tab, clienteFilter])

  const openAdd = () => { setSelected(blank()); setModal('add') }
  const openEdit = (c: Colaborador) => { setSelected({ ...c }); setModal('edit') }
  const openView = (c: Colaborador) => { setSelected({ ...c }); setModal('view') }
  const closeModal = () => { setModal(null); setSelected(blank()) }
  const upd = (k: keyof Colaborador, v: any) => setSelected(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!selected.nome) { toast.error('Nome é obrigatório'); return }
    if (!selected.cpf) { toast.error('CPF é obrigatório'); return }
    setSaving(true)
    const payload = {
      ...(escId ? { ...selected, escritorio_id: escId } : selected),
      cliente_id: selected.cliente_id || null,
    }
    if (modal === 'add') {
      const { error } = await supabase.from('colaboradores').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Colaborador cadastrado!')
    } else if (modal === 'edit' && selected.id) {
      const { id, created_at, clientes: _, ...rest } = selected as any
      const { error } = await supabase.from('colaboradores').update(rest).eq('id', id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Colaborador atualizado!')
    }
    setSaving(false); closeModal(); load()
  }

  const handleDelete = async (c: Colaborador) => {
    if (!confirm(`Excluir ${c.nome}?`)) return
    const { error } = await supabase.from('colaboradores').delete().eq('id', c.id)
    if (error) { toast.error(error.message); return }
    toast.success('Colaborador excluído'); load()
  }

  const handleHolerite = (c: Colaborador) => {
    const clienteNome = clientes.find(cl => cl.id === c.cliente_id)?.razao_social || escritorio?.nome || '—'
    gerarHolerite(c, escritorio?.nome || 'TEUcontador', clienteNome)
    toast.success('Holerite gerado!')
  }

  // Stats
  const { ativos, totalBruto, totalInss, totalFgts, totalLiquido } = useMemo(() => {
    const ativos = colaboradores.filter(c => c.status_colab !== 'demitido')
    return {
      ativos,
      totalBruto:   ativos.reduce((s, c) => s + (Number(c.salario_bruto) || 0), 0),
      totalInss:    ativos.reduce((s, c) => s + calcInss(Number(c.salario_bruto) || 0), 0),
      totalFgts:    ativos.reduce((s, c) => s + (Number(c.salario_bruto) || 0) * FGTS_ALIQ, 0),
      totalLiquido: ativos.reduce((s, c) => { const { liquido } = calcColaborador(c); return s + liquido }, 0),
    }
  }, [colaboradores])

  const renderForm = () => {
    const prev = calcColaborador(selected as Colaborador)
    return (
      <>
        <SectionTitle><User size={12} /> Dados Pessoais</SectionTitle>
        <FormGrid>
          <Field style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Nome Completo *</FieldLabel>
            <Input placeholder="Nome do colaborador" value={selected.nome || ''} onChange={e => upd('nome', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>CPF *</FieldLabel>
            <Input placeholder="000.000.000-00" value={selected.cpf || ''} onChange={e => upd('cpf', maskCpf(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel>PIS / NIT</FieldLabel>
            <Input placeholder="000.00000.00-0" value={selected.pis || ''} onChange={e => upd('pis', maskPis(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel>Data de Nascimento</FieldLabel>
            <Input type="date" value={selected.data_nascimento || ''} onChange={e => upd('data_nascimento', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>CTPS (Nº / Série)</FieldLabel>
            <Input placeholder="000000 / 0000" value={selected.ctps || ''} onChange={e => upd('ctps', e.target.value)} />
          </Field>
        </FormGrid>

        <SectionTitle><Briefcase size={12} /> Contrato & Cargo</SectionTitle>
        <FormGrid>
          <Field>
            <FieldLabel>Cargo</FieldLabel>
            <Input placeholder="Ex: Analista Contábil" value={selected.cargo || ''} onChange={e => upd('cargo', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>CBO</FieldLabel>
            <Input placeholder="Ex: 2522-10" value={selected.cbo || ''} onChange={e => upd('cbo', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Tipo de Contrato</FieldLabel>
            <Select value={selected.tipo_contrato || 'CLT'} onChange={e => upd('tipo_contrato', e.target.value)}>
              <option value="CLT">CLT</option>
              <option value="Temporário">Temporário</option>
              <option value="Aprendiz">Aprendiz</option>
              <option value="Estágio">Estágio</option>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select value={selected.status_colab || 'ativo'} onChange={e => upd('status_colab', e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="ferias">Férias</option>
              <option value="afastado">Afastado</option>
              <option value="demitido">Demitido</option>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Departamento</FieldLabel>
            <Input placeholder="Ex: Contabilidade" value={selected.departamento || ''} onChange={e => upd('departamento', e.target.value)} />
          </Field>
          <Field style={{ gridColumn: '1 / -1' }}>
            <FieldLabel>Cliente / Empresa</FieldLabel>
            <Select value={selected.cliente_id || ''} onChange={e => upd('cliente_id', e.target.value)}>
              <option value="">— Escritório próprio —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
            </Select>
          </Field>
        </FormGrid>

        <SectionTitle><DollarSign size={12} /> Remuneração</SectionTitle>
        <FormGrid>
          <Field>
            <FieldLabel>Salário Bruto (R$)</FieldLabel>
            <Input type="number" step="0.01" placeholder="0,00" value={selected.salario_bruto || ''} onChange={e => upd('salario_bruto', Number(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel>Dependentes (IRRF)</FieldLabel>
            <Input type="number" min={0} placeholder="0" value={selected.dependentes ?? ''} onChange={e => upd('dependentes', Number(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel>Vale Refeição (R$/mês)</FieldLabel>
            <Input type="number" step="0.01" placeholder="0,00" value={selected.vale_refeicao || ''} onChange={e => upd('vale_refeicao', Number(e.target.value))} />
          </Field>
          <Field>
            <FieldLabel>Vale Transporte</FieldLabel>
            <CheckRow onClick={() => upd('vale_transporte', !selected.vale_transporte)}>
              <span style={{ fontSize: 18 }}>{selected.vale_transporte ? '✅' : '⬜'}</span>
              <span style={{ fontSize: 13 }}>
                {selected.vale_transporte ? `Sim — desconto 6% (${fmt((Number(selected.salario_bruto) || 0) * 0.06)})` : 'Não utiliza vale transporte'}
              </span>
            </CheckRow>
          </Field>
        </FormGrid>

        {(Number(selected.salario_bruto) || 0) > 0 && (
          <PreviewBox>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, opacity: 0.6 }}>Prévia do Holerite</div>
            <PreviewRow><span>Salário Bruto</span><span>{fmt(prev.bruto)}</span></PreviewRow>
            <PreviewRow $color="#c53030"><span>(-) INSS — tabela progressiva 2024</span><span>- {fmt(prev.inss)}</span></PreviewRow>
            <PreviewRow $color="#b45309"><span>(-) IRRF — tabela 2024</span><span>- {fmt(prev.irrf)}</span></PreviewRow>
            {prev.vt > 0 && <PreviewRow $color="#b45309"><span>(-) Vale Transporte (6%)</span><span>- {fmt(prev.vt)}</span></PreviewRow>}
            <PreviewRow $bold $color="#1a7a4a"><span>Salário Líquido</span><span>{fmt(prev.liquido)}</span></PreviewRow>
            <PreviewRow $color="#6b7280" style={{ marginTop: 6 }}><span>FGTS (encargo patronal 8%)</span><span>{fmt(prev.fgts)}</span></PreviewRow>
          </PreviewBox>
        )}

        <SectionTitle><Building2 size={12} /> Dados Bancários</SectionTitle>
        <FormGrid $cols={3}>
          <Field>
            <FieldLabel>Banco</FieldLabel>
            <Input placeholder="Ex: 001 — Banco do Brasil" value={selected.banco || ''} onChange={e => upd('banco', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Agência</FieldLabel>
            <Input placeholder="0000-0" value={selected.agencia || ''} onChange={e => upd('agencia', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Conta</FieldLabel>
            <Input placeholder="00000-0" value={selected.conta_bancaria || ''} onChange={e => upd('conta_bancaria', e.target.value)} />
          </Field>
        </FormGrid>

        <SectionTitle><Phone size={12} /> Contato</SectionTitle>
        <FormGrid>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" placeholder="email@empresa.com" value={selected.email || ''} onChange={e => upd('email', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Telefone</FieldLabel>
            <Input placeholder="(00) 00000-0000" value={selected.telefone || ''} onChange={e => upd('telefone', e.target.value)} />
          </Field>
        </FormGrid>
      </>
    )
  }

  const renderView = () => {
    const { bruto, inss, irrf, vt, liquido, fgts } = calcColaborador(selected as Colaborador)
    const clienteNome = clientes.find(c => c.id === selected.cliente_id)?.razao_social || '— Escritório próprio —'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <SectionTitle><User size={12} /> Dados Pessoais</SectionTitle>
        <FormGrid>
          {[
            ['Nome', selected.nome], ['CPF', selected.cpf], ['PIS/NIT', selected.pis],
            ['Data Nasc.', selected.data_nascimento ? new Date(selected.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'],
            ['CTPS', selected.ctps], ['Status', statusLabel[selected.status_colab || 'ativo']],
          ].map(([label, value]) => (
            <div key={label as string}>
              <FieldLabel>{label as string}</FieldLabel>
              <div style={{ fontSize: 13 }}>{value || '—'}</div>
            </div>
          ))}
        </FormGrid>
        <SectionTitle><Briefcase size={12} /> Contrato</SectionTitle>
        <FormGrid>
          {[
            ['Cargo', selected.cargo], ['CBO', selected.cbo], ['Tipo', selected.tipo_contrato],
            ['Depto', selected.departamento], ['Cliente', clienteNome],
          ].map(([label, value]) => (
            <div key={label as string}>
              <FieldLabel>{label as string}</FieldLabel>
              <div style={{ fontSize: 13 }}>{value || '—'}</div>
            </div>
          ))}
        </FormGrid>
        <SectionTitle><DollarSign size={12} /> Holerite</SectionTitle>
        <PreviewBox>
          <PreviewRow><span>Salário Bruto</span><span>{fmt(bruto)}</span></PreviewRow>
          <PreviewRow $color="#c53030"><span>(-) INSS progressivo 2024</span><span>- {fmt(inss)}</span></PreviewRow>
          <PreviewRow $color="#b45309"><span>(-) IRRF 2024</span><span>- {fmt(irrf)}</span></PreviewRow>
          {vt > 0 && <PreviewRow $color="#b45309"><span>(-) Vale Transporte 6%</span><span>- {fmt(vt)}</span></PreviewRow>}
          <PreviewRow $bold $color="#1a7a4a"><span>Salário Líquido</span><span>{fmt(liquido)}</span></PreviewRow>
          <PreviewRow $color="#6b7280" style={{ marginTop: 6 }}><span>FGTS patronal (8%)</span><span>{fmt(fgts)}</span></PreviewRow>
          <PreviewRow $color="#6b7280"><span>Dependentes IRRF</span><span>{selected.dependentes || 0}</span></PreviewRow>
        </PreviewBox>
        <SectionTitle><Building2 size={12} /> Bancário & Contato</SectionTitle>
        <FormGrid>
          {[
            ['Banco', selected.banco], ['Agência', selected.agencia], ['Conta', selected.conta_bancaria],
            ['Email', selected.email], ['Telefone', selected.telefone],
          ].map(([label, value]) => (
            <div key={label as string}>
              <FieldLabel>{label as string}</FieldLabel>
              <div style={{ fontSize: 13 }}>{value || '—'}</div>
            </div>
          ))}
        </FormGrid>
      </div>
    )
  }

  // ── DP Calcs ────────────────────────────────────────────────────────────────
  const calcFerias = () => {
    const sal = parseFloat(String(ferias.salario).replace(',', '.')) || 0
    const dias = parseInt(ferias.diasFerias) || 30
    const proporcional = sal * (dias / 30)
    const adicional = proporcional / 3
    const abono = ferias.abono ? (sal / 30) * 10 : 0
    const inss = calcInss(proporcional)
    const irrf = calcIrrf(Math.max(0, proporcional + adicional - inss))
    const liquido = proporcional + adicional + abono - inss - irrf
    return { proporcional, adicional, abono, inss, irrf, liquido }
  }

  const calcDecimo = () => {
    const sal = parseFloat(String(decimo.salario).replace(',', '.')) || 0
    const meses = Math.min(12, Math.max(0, parseInt(decimo.mesesTrabalhados) || 12))
    const bruto = sal * (meses / 12)
    const inss = calcInss(bruto)
    const irrf = calcIrrf(Math.max(0, bruto - inss))
    const fgts = bruto * FGTS_ALIQ
    const liquido = bruto - inss - irrf
    return { bruto, inss, irrf, fgts, liquido, meses }
  }

  const calcRescisao = () => {
    const sal = parseFloat(String(rescisao.salario).replace(',', '.')) || 0
    const aviso = rescisao.tipoRescisao === 'justa_causa' ? 0 : sal
    const multaFgts = rescisao.tipoRescisao === 'sem_justa_causa' ? parseFloat(rescisao.diasFgts || '0') * 0.4 : 0
    const decProp = sal / 12
    const feriasProp = sal / 12
    const tercoProp = feriasProp / 3
    const inss = calcInss(aviso + decProp + feriasProp)
    const total = aviso + decProp + feriasProp + tercoProp + multaFgts
    const liquido = total - inss
    return { aviso, decProp, feriasProp, tercoProp, multaFgts, inss, total, liquido }
  }

  const feriasCalc  = calcFerias()
  const decimoCalc  = calcDecimo()
  const rescisaoCalc = calcRescisao()

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <DpTabBar>
        {(['folha', 'ferias', 'decimo', 'rescisao'] as const).map(t => (
          <DpTab key={t} $active={dpTab === t} onClick={() => setDpTab(t)}>
            {t === 'folha' ? '📋 Folha' : t === 'ferias' ? '🏖 Férias' : t === 'decimo' ? '🎄 13º Salário' : '📄 Rescisão'}
          </DpTab>
        ))}
      </DpTabBar>

      {dpTab === 'ferias' && (
        <DpPanel>
          <DpTitle>Calculadora de Férias</DpTitle>
          <DpGrid>
            <DpField style={{ gridColumn: '1/-1' }}>
              <DpLabel>Colaborador (opcional)</DpLabel>
              <DpSelect value={ferias.colaborador} onChange={e => {
                const c = colaboradores.find(x => x.id === e.target.value)
                setFerias(f => ({ ...f, colaborador: e.target.value, salario: String(c?.salario_bruto || '') }))
              }}>
                <option value="">— Selecionar colaborador —</option>
                {colaboradores.filter(c => c.status_colab === 'ativo').map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </DpSelect>
            </DpField>
            <DpField>
              <DpLabel>Salário Bruto (R$)</DpLabel>
              <DpInput type="number" step="0.01" placeholder="0,00" value={ferias.salario}
                onChange={e => setFerias(f => ({ ...f, salario: e.target.value }))} />
            </DpField>
            <DpField>
              <DpLabel>Dias de Férias (1-30)</DpLabel>
              <DpInput type="number" min="1" max="30" value={ferias.diasFerias}
                onChange={e => setFerias(f => ({ ...f, diasFerias: e.target.value }))} />
            </DpField>
            <DpField style={{ gridColumn: '1/-1' }}>
              <DpLabel>Abono Pecuniário (vender 10 dias)?</DpLabel>
              <DpSelect value={ferias.abono ? 'sim' : 'nao'} onChange={e => setFerias(f => ({ ...f, abono: e.target.value === 'sim' }))}>
                <option value="nao">Não</option>
                <option value="sim">Sim — vender 10 dias</option>
              </DpSelect>
            </DpField>
          </DpGrid>
          {(parseFloat(String(ferias.salario)) || 0) > 0 && (
            <DpResult>
              <DpResultRow><span>Férias proporcional ({ferias.diasFerias} dias)</span><span>{fmt(feriasCalc.proporcional)}</span></DpResultRow>
              <DpResultRow><span>1/3 Adicional constitucional</span><span>{fmt(feriasCalc.adicional)}</span></DpResultRow>
              {feriasCalc.abono > 0 && <DpResultRow><span>Abono pecuniário (10 dias)</span><span>{fmt(feriasCalc.abono)}</span></DpResultRow>}
              <DpResultRow><span>(-) INSS</span><span>- {fmt(feriasCalc.inss)}</span></DpResultRow>
              <DpResultRow><span>(-) IRRF</span><span>- {fmt(feriasCalc.irrf)}</span></DpResultRow>
              <DpResultRow $bold><span>Valor Líquido</span><span>{fmt(feriasCalc.liquido)}</span></DpResultRow>
            </DpResult>
          )}
        </DpPanel>
      )}

      {dpTab === 'decimo' && (
        <DpPanel>
          <DpTitle>Calculadora de 13º Salário</DpTitle>
          <DpGrid>
            <DpField style={{ gridColumn: '1/-1' }}>
              <DpLabel>Colaborador (opcional)</DpLabel>
              <DpSelect value={decimo.colaborador} onChange={e => {
                const c = colaboradores.find(x => x.id === e.target.value)
                setDecimo(f => ({ ...f, colaborador: e.target.value, salario: String(c?.salario_bruto || '') }))
              }}>
                <option value="">— Selecionar colaborador —</option>
                {colaboradores.filter(c => c.status_colab === 'ativo').map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </DpSelect>
            </DpField>
            <DpField>
              <DpLabel>Salário Bruto (R$)</DpLabel>
              <DpInput type="number" step="0.01" placeholder="0,00" value={decimo.salario}
                onChange={e => setDecimo(f => ({ ...f, salario: e.target.value }))} />
            </DpField>
            <DpField>
              <DpLabel>Meses Trabalhados no Ano</DpLabel>
              <DpInput type="number" min="1" max="12" value={decimo.mesesTrabalhados}
                onChange={e => setDecimo(f => ({ ...f, mesesTrabalhados: e.target.value }))} />
            </DpField>
          </DpGrid>
          {(parseFloat(String(decimo.salario)) || 0) > 0 && (
            <DpResult>
              <DpResultRow><span>13º bruto ({decimoCalc.meses}/12 avos)</span><span>{fmt(decimoCalc.bruto)}</span></DpResultRow>
              <DpResultRow><span>(-) INSS (1ª parcela — sem desconto)</span><span>—</span></DpResultRow>
              <DpResultRow><span>(-) INSS (2ª parcela)</span><span>- {fmt(decimoCalc.inss)}</span></DpResultRow>
              <DpResultRow><span>(-) IRRF (2ª parcela)</span><span>- {fmt(decimoCalc.irrf)}</span></DpResultRow>
              <DpResultRow><span>FGTS sobre 13º (encargo patronal)</span><span>{fmt(decimoCalc.fgts)}</span></DpResultRow>
              <DpResultRow $bold><span>Valor Líquido</span><span>{fmt(decimoCalc.liquido)}</span></DpResultRow>
            </DpResult>
          )}
        </DpPanel>
      )}

      {dpTab === 'rescisao' && (
        <DpPanel>
          <DpTitle>Calculadora de Rescisão Contratual</DpTitle>
          <DpGrid>
            <DpField style={{ gridColumn: '1/-1' }}>
              <DpLabel>Colaborador (opcional)</DpLabel>
              <DpSelect value={rescisao.colaborador} onChange={e => {
                const c = colaboradores.find(x => x.id === e.target.value)
                setRescisao(f => ({ ...f, colaborador: e.target.value, salario: String(c?.salario_bruto || '') }))
              }}>
                <option value="">— Selecionar colaborador —</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </DpSelect>
            </DpField>
            <DpField>
              <DpLabel>Salário Bruto (R$)</DpLabel>
              <DpInput type="number" step="0.01" placeholder="0,00" value={rescisao.salario}
                onChange={e => setRescisao(f => ({ ...f, salario: e.target.value }))} />
            </DpField>
            <DpField>
              <DpLabel>Tipo de Rescisão</DpLabel>
              <DpSelect value={rescisao.tipoRescisao} onChange={e => setRescisao(f => ({ ...f, tipoRescisao: e.target.value }))}>
                <option value="sem_justa_causa">Sem justa causa (empregador)</option>
                <option value="pedido_demissao">Pedido de demissão</option>
                <option value="justa_causa">Justa causa</option>
                <option value="acordo">Acordo mútuo (§6º)</option>
              </DpSelect>
            </DpField>
            {rescisao.tipoRescisao === 'sem_justa_causa' && (
              <DpField style={{ gridColumn: '1/-1' }}>
                <DpLabel>Saldo FGTS acumulado (R$) — para calcular multa</DpLabel>
                <DpInput type="number" step="0.01" placeholder="0,00" value={rescisao.diasFgts}
                  onChange={e => setRescisao(f => ({ ...f, diasFgts: e.target.value }))} />
              </DpField>
            )}
          </DpGrid>
          {(parseFloat(String(rescisao.salario)) || 0) > 0 && (
            <DpResult>
              {rescisaoCalc.aviso > 0 && <DpResultRow><span>Aviso prévio indenizado</span><span>{fmt(rescisaoCalc.aviso)}</span></DpResultRow>}
              <DpResultRow><span>13º salário proporcional</span><span>{fmt(rescisaoCalc.decProp)}</span></DpResultRow>
              <DpResultRow><span>Férias proporcionais</span><span>{fmt(rescisaoCalc.feriasProp)}</span></DpResultRow>
              <DpResultRow><span>1/3 Adicional sobre férias</span><span>{fmt(rescisaoCalc.tercoProp)}</span></DpResultRow>
              {rescisaoCalc.multaFgts > 0 && <DpResultRow><span>Multa FGTS (40%)</span><span>{fmt(rescisaoCalc.multaFgts)}</span></DpResultRow>}
              <DpResultRow><span>(-) INSS</span><span>- {fmt(rescisaoCalc.inss)}</span></DpResultRow>
              <DpResultRow $bold><span>Total Líquido</span><span>{fmt(rescisaoCalc.liquido)}</span></DpResultRow>
            </DpResult>
          )}
        </DpPanel>
      )}

      {dpTab === 'folha' && <>
      <motion.div variants={itemVariants}>
        <PageHeader>
          <div>
            <PageTitle>Folha de <em>Pagamento</em></PageTitle>
            <PageSub>{ativos.length} colaboradores ativos · INSS 2024 · IRRF MP 1.206</PageSub>
          </div>
          <HeaderActions>
            <SecBtn onClick={() => exportarFolha(filtered)} whileTap={{ scale: 0.97 }}>
              <Download size={14} /> Exportar Folha
            </SecBtn>
            <AddBtn onClick={openAdd} whileTap={{ scale: 0.97 }} disabled={!canEdit} style={{ opacity: !canEdit ? 0.4 : 1, cursor: !canEdit ? 'not-allowed' : 'pointer' }}>
              <Plus size={15} /> Novo Colaborador
            </AddBtn>
          </HeaderActions>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatsRow>
          <StatCard whileHover={{ y: -2 }}>
            <StatLabel>Total Bruto</StatLabel>
            <StatValue>{fmt(totalBruto)}</StatValue>
            <StatSub>{ativos.length} ativos</StatSub>
          </StatCard>
          <StatCard whileHover={{ y: -2 }}>
            <StatLabel>INSS Empregados</StatLabel>
            <StatValue $color="#c53030">{fmt(totalInss)}</StatValue>
            <StatSub>Tabela progressiva 2024</StatSub>
          </StatCard>
          <StatCard whileHover={{ y: -2 }}>
            <StatLabel>FGTS (Encargo)</StatLabel>
            <StatValue $color="#b45309">{fmt(totalFgts)}</StatValue>
            <StatSub>8% — patronal</StatSub>
          </StatCard>
          <StatCard whileHover={{ y: -2 }}>
            <StatLabel>Total Líquido</StatLabel>
            <StatValue $color="#1a7a4a">{fmt(totalLiquido)}</StatValue>
            <StatSub>A pagar na conta</StatSub>
          </StatCard>
        </StatsRow>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Toolbar>
          <SearchBox>
            <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
            <input placeholder="Nome, CPF, cargo..." value={search} onChange={e => setSearch(e.target.value)} />
          </SearchBox>
          <TabRow>
            {[['todos', 'Todos'], ['ativo', 'Ativos'], ['ferias', 'Férias'], ['afastado', 'Afastados'], ['demitido', 'Demitidos']].map(([val, label]) => (
              <Tab key={val} $active={tab === val} onClick={() => setTab(val)}>{label}</Tab>
            ))}
          </TabRow>
          <ClienteSelect value={clienteFilter} onChange={e => setClienteFilter(e.target.value)}>
            <option value="">Todos os clientes</option>
            <option value="">— Escritório próprio —</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
          </ClienteSelect>
        </Toolbar>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          {loading ? (
            <EmptyState>⏳ Carregando...</EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 20, marginBottom: 6 }}>Nenhum colaborador</div>
              <div style={{ fontSize: 13 }}>Cadastre colaboradores para processar a folha</div>
            </EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <Thead>
                  <tr>
                    <th>Colaborador / CPF</th>
                    <th>Cargo</th>
                    <th>Cliente</th>
                    <th>Bruto</th>
                    <th>INSS</th>
                    <th>IRRF</th>
                    <th>FGTS</th>
                    <th>Líquido</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </Thead>
                <Tbody>
                  {filtered.map(c => {
                    const { bruto, inss, irrf, fgts, liquido } = calcColaborador(c)
                    const ini = (c.nome || '').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                    const clienteNome = (c as any).clientes?.razao_social || clientes.find(cl => cl.id === c.cliente_id)?.razao_social
                    return (
                      <tr key={c.id}>
                        <td>
                          <CellRow>
                            <Avatar>{ini}</Avatar>
                            <div>
                              <div style={{ fontWeight: 500 }}>{c.nome}</div>
                              <div style={{ fontSize: 11, opacity: 0.5, fontFamily: 'monospace' }}>{c.cpf || '—'}</div>
                            </div>
                          </CellRow>
                        </td>
                        <td style={{ fontSize: 12 }}>{c.cargo || '—'}</td>
                        <td style={{ fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {clienteNome || '—'}
                        </td>
                        <td style={{ fontWeight: 500 }}>{fmt(bruto)}</td>
                        <td style={{ color: '#c53030', fontSize: 12 }}>{fmt(inss)}</td>
                        <td style={{ color: '#b45309', fontSize: 12 }}>{fmt(irrf)}</td>
                        <td style={{ color: '#b45309', fontSize: 12 }}>{fmt(fgts)}</td>
                        <td style={{ fontWeight: 600, color: '#1a7a4a' }}>{fmt(liquido)}</td>
                        <td>
                          <Badge $type={statusColor[c.status_colab || 'ativo']}>
                            {statusLabel[c.status_colab || 'ativo']}
                          </Badge>
                        </td>
                        <td>
                          <ActionRow>
                            <ActBtn onClick={() => openView(c)} title="Visualizar"><Eye size={13} /></ActBtn>
                            <ActBtn onClick={() => openEdit(c)} title="Editar" disabled={!canEdit}><Edit2 size={13} /></ActBtn>
                            <ActBtn onClick={() => handleHolerite(c)} title="Gerar Holerite"><FileText size={13} /></ActBtn>
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
                    )
                  })}
                </Tbody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {modal && (
          <Overlay onClick={e => e.target === e.currentTarget && closeModal()}>
            <Modal>
              <ModalHead>
                <ModalTitle>
                  {modal === 'add' ? 'Novo Colaborador' : modal === 'edit' ? 'Editar Colaborador' : 'Dados do Colaborador'}
                </ModalTitle>
                <CloseBtn onClick={closeModal}><X size={14} /></CloseBtn>
              </ModalHead>
              <ModalBody>
                {modal === 'view' ? renderView() : renderForm()}
              </ModalBody>
              <ModalFooter>
                <CancelBtn onClick={closeModal}>{modal === 'view' ? 'Fechar' : 'Cancelar'}</CancelBtn>
                {modal === 'view' && (
                  <SaveBtn onClick={() => { closeModal(); setTimeout(() => { openEdit(selected as Colaborador) }, 100) }} whileTap={{ scale: 0.97 }} disabled={!canEdit}>
                    <Edit2 size={13} style={{ marginRight: 4 }} /> Editar
                  </SaveBtn>
                )}
                {modal !== 'view' && (
                  <SaveBtn onClick={handleSave} whileTap={{ scale: 0.97 }} disabled={saving || !canEdit}>
                    {saving ? 'Salvando...' : modal === 'add' ? 'Cadastrar' : 'Salvar'}
                  </SaveBtn>
                )}
              </ModalFooter>
            </Modal>
          </Overlay>
        )}
      </>}
    </motion.div>
  )
}
