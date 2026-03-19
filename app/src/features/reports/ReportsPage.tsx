import { useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import {
  FileText, Download, BarChart2, BookOpen, Scale,
  TrendingUp, FileSpreadsheet, Loader2, Users, AlertTriangle,
  DollarSign, BookMarked, Database,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  format, startOfMonth, endOfMonth, startOfYear, endOfYear,
  startOfQuarter, endOfQuarter,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

// ─── Styled Components ────────────────────────────────────────────────────────

const PageHeader = styled.div`margin-bottom: 24px;`
const PageTitle = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const FiltersBar = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;
`
const FilterLabel = styled.span`
  font-size: 12px; font-weight: 600; color: ${({ theme }) => theme.textDim};
  text-transform: uppercase; letter-spacing: 0.5px;
`
const PeriodBtn = styled.button<{ $active: boolean }>`
  padding: 7px 14px; border-radius: 8px; font-size: 12.5px;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  color: ${({ theme, $active }) => $active ? theme.green : theme.textMid};
  background: ${({ theme, $active }) => $active ? theme.greenLight : theme.surface};
  border: 1.5px solid ${({ theme, $active }) => $active ? 'rgba(26,122,74,0.3)' : theme.border};
  cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.greenMid}; color: ${({ theme }) => theme.green}; }
`

const SectionLabel = styled.div`
  font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
  color: ${({ theme }) => theme.textDim}; margin: 24px 0 12px;
  display: flex; align-items: center; gap: 8px;
  &::after { content: ''; flex: 1; height: 1px; background: ${({ theme }) => theme.border}; }
`

const Grid = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`

const ReportCard = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; padding: 22px; box-shadow: ${({ theme }) => theme.shadow};
  display: flex; flex-direction: column; transition: border-color 0.25s, box-shadow 0.25s;
  &:hover { border-color: rgba(26,122,74,0.2); box-shadow: ${({ theme }) => theme.shadowMd}; }
`
const ReportIcon = styled.div<{ $color: string }>`
  width: 44px; height: 44px; border-radius: 11px; background: ${({ $color }) => $color};
  display: flex; align-items: center; justify-content: center; margin-bottom: 14px; flex-shrink: 0;
`
const ReportName = styled.div`
  font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 400;
  color: ${({ theme }) => theme.text}; margin-bottom: 6px;
`
const ReportDesc = styled.div`font-size: 12px; color: ${({ theme }) => theme.textDim}; line-height: 1.55; flex: 1;`
const ReportTags = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px;`
const Tag = styled.span`
  padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;
  background: ${({ theme }) => theme.surface2}; color: ${({ theme }) => theme.textDim};
  border: 1px solid ${({ theme }) => theme.border};
`
const BtnRow = styled.div`display: flex; gap: 7px; margin-top: 16px;`
const GenerateBtn = styled(motion.button)<{ $outline?: boolean }>`
  display: flex; align-items: center; gap: 5px;
  padding: 8px 13px; border-radius: 8px; font-size: 12px; font-weight: 600;
  font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s;
  ${({ theme, $outline }) => $outline ? `
    background: transparent; color: ${theme.green};
    border: 1.5px solid rgba(26,122,74,0.3); box-shadow: none;
    &:hover { background: ${theme.greenLight}; border-color: ${theme.greenMid}; }
  ` : `
    background: ${theme.green}; color: #fff; border: none;
    box-shadow: 0 2px 10px rgba(26,122,74,0.25);
    &:hover { background: ${theme.greenMid}; }
  `}
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

// ─── Types & Helpers ──────────────────────────────────────────────────────────

type Period = 'mes' | 'trimestre' | 'ano'

const fmtBRL = (v: number) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

function getPeriodRange(period: Period) {
  const now = new Date()
  if (period === 'mes') return {
    start: startOfMonth(now), end: endOfMonth(now),
    label: format(now, 'MMMM yyyy', { locale: ptBR }),
  }
  if (period === 'trimestre') return {
    start: startOfQuarter(now), end: endOfQuarter(now),
    label: `${format(startOfQuarter(now), 'MMM', { locale: ptBR })}–${format(endOfQuarter(now), 'MMM yyyy', { locale: ptBR })}`,
  }
  return { start: startOfYear(now), end: endOfYear(now), label: String(now.getFullYear()) }
}

function addPdfHeader(doc: jsPDF, title: string, period: string, escritorioNome: string) {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(26, 122, 74)
  doc.rect(0, 0, w, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text('TEUcontador', 14, 13)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(escritorioNome, 14, 19)
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(title, w / 2, 35, { align: 'center' })
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Período: ${period}`, w / 2, 43, { align: 'center' })
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, w / 2, 49, { align: 'center' })
}

// ─── Report Generators ────────────────────────────────────────────────────────

async function gerarBalancete(period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const { start, end, label } = getPeriodRange(period)
  let q = supabase.from('lancamentos').select('conta_debito, conta_credito, valor, tipo')
    .gte('data_lanc', format(start, 'yyyy-MM-dd')).lte('data_lanc', format(end, 'yyyy-MM-dd'))
  if (escId) q = q.eq('escritorio_id', escId)
  const { data: lancs, error } = await q
  if (error) throw new Error(error.message)

  const accounts: Record<string, { debito: number; credito: number }> = {}
  const addAcc = (name: string, side: 'debito' | 'credito', val: number) => {
    if (!name) return
    if (!accounts[name]) accounts[name] = { debito: 0, credito: 0 }
    accounts[name][side] += val
  }
  ;(lancs || []).forEach((l: any) => {
    const v = Number(l.valor) || 0
    if (l.conta_debito) addAcc(l.conta_debito, 'debito', v)
    if (l.conta_credito) addAcc(l.conta_credito, 'credito', v)
  })
  const rows = Object.entries(accounts).map(([conta, { debito, credito }]) => ({ conta, debito, credito, saldo: debito - credito }))
  const totDebito = rows.reduce((s, r) => s + r.debito, 0)
  const totCredito = rows.reduce((s, r) => s + r.credito, 0)

  if (format_ === 'pdf') {
    const doc = new jsPDF()
    addPdfHeader(doc, 'BALANCETE DE VERIFICAÇÃO', label, escritorioNome)
    autoTable(doc, {
      startY: 57,
      head: [['Conta Contábil', 'Débito (R$)', 'Crédito (R$)', 'Saldo (R$)']],
      body: rows.length > 0 ? rows.map(r => [r.conta, fmtBRL(r.debito), fmtBRL(r.credito), (r.saldo >= 0 ? '' : '-') + fmtBRL(Math.abs(r.saldo))]) : [['Nenhum lançamento no período', '', '', '']],
      foot: rows.length > 0 ? [['TOTAL', fmtBRL(totDebito), fmtBRL(totCredito), '']] : undefined,
      styles: { fontSize: 9 }, headStyles: { fillColor: [26, 122, 74], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 249, 249] },
    })
    doc.save(`Balancete_${label.replace(/\s/g, '_')}.pdf`)
  } else {
    const data = [['BALANCETE DE VERIFICAÇÃO'], [`Período: ${label}`, '', '', `Gerado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`], [],
      ['Conta Contábil', 'Débito (R$)', 'Crédito (R$)', 'Saldo (R$)'],
      ...rows.map(r => [r.conta, r.debito, r.credito, r.saldo]), [], ['TOTAL', totDebito, totCredito, totDebito - totCredito]]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Balancete')
    XLSX.writeFile(wb, `Balancete_${label.replace(/\s/g, '_')}.xlsx`)
  }
}

async function gerarDRE(period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const { start, end, label } = getPeriodRange(period)
  let q = supabase.from('lancamentos').select('historico, valor, tipo, conta_credito, conta_debito')
    .gte('data_lanc', format(start, 'yyyy-MM-dd')).lte('data_lanc', format(end, 'yyyy-MM-dd'))
  if (escId) q = q.eq('escritorio_id', escId)
  const { data: lancs, error } = await q
  if (error) throw new Error(error.message)

  const receitas: Record<string, number> = {}
  const despesas: Record<string, number> = {}
  ;(lancs || []).forEach((l: any) => {
    const v = Number(l.valor) || 0
    const h = l.historico || 'Sem descrição'
    if (l.tipo === 'credito') receitas[h] = (receitas[h] || 0) + v
    else despesas[h] = (despesas[h] || 0) + v
  })
  const totRec = Object.values(receitas).reduce((a, b) => a + b, 0)
  const totDesp = Object.values(despesas).reduce((a, b) => a + b, 0)
  const resultado = totRec - totDesp

  if (format_ === 'pdf') {
    const doc = new jsPDF()
    addPdfHeader(doc, 'DRE — DEMONSTRAÇÃO DO RESULTADO', label, escritorioNome)
    autoTable(doc, {
      startY: 57,
      head: [['Descrição', 'Valor (R$)']],
      body: [
        [{ content: 'RECEITAS', styles: { fontStyle: 'bold', fillColor: [232, 245, 238] } }, ''],
        ...(Object.entries(receitas).length > 0 ? Object.entries(receitas).map(([h, v]) => [h, fmtBRL(v)]) : [['Nenhuma receita', '']]),
        [{ content: 'TOTAL RECEITAS', styles: { fontStyle: 'bold' } }, { content: fmtBRL(totRec), styles: { fontStyle: 'bold', textColor: [26, 122, 74] } }],
        [{ content: 'DESPESAS', styles: { fontStyle: 'bold', fillColor: [253, 240, 240] } }, ''],
        ...(Object.entries(despesas).length > 0 ? Object.entries(despesas).map(([h, v]) => [h, fmtBRL(v)]) : [['Nenhuma despesa', '']]),
        [{ content: 'TOTAL DESPESAS', styles: { fontStyle: 'bold' } }, { content: fmtBRL(totDesp), styles: { fontStyle: 'bold', textColor: [197, 48, 48] } }],
        [
          { content: resultado >= 0 ? 'LUCRO DO PERÍODO' : 'PREJUÍZO DO PERÍODO', styles: { fontStyle: 'bold', fillColor: resultado >= 0 ? [26, 122, 74] : [197, 48, 48], textColor: [255, 255, 255] } },
          { content: fmtBRL(Math.abs(resultado)), styles: { fontStyle: 'bold', fillColor: resultado >= 0 ? [26, 122, 74] : [197, 48, 48], textColor: [255, 255, 255] } },
        ],
      ],
      styles: { fontSize: 9 }, headStyles: { fillColor: [26, 122, 74], textColor: 255 },
      columnStyles: { 1: { halign: 'right' } },
    })
    doc.save(`DRE_${label.replace(/\s/g, '_')}.pdf`)
  } else {
    const data = [['DRE — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO'], [`Período: ${label}`, `Gerado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`], [],
      ['RECEITAS', ''], ...Object.entries(receitas).map(([h, v]) => [h, v]), ['TOTAL RECEITAS', totRec], [],
      ['DESPESAS', ''], ...Object.entries(despesas).map(([h, v]) => [h, v]), ['TOTAL DESPESAS', totDesp], [],
      [resultado >= 0 ? 'LUCRO DO PERÍODO' : 'PREJUÍZO DO PERÍODO', resultado]]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 45 }, { wch: 20 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'DRE')
    XLSX.writeFile(wb, `DRE_${label.replace(/\s/g, '_')}.xlsx`)
  }
}

async function gerarLivroRazao(period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const { start, end, label } = getPeriodRange(period)
  let q = supabase.from('lancamentos').select('data_lanc, historico, conta_debito, conta_credito, valor, tipo, clientes(razao_social)')
    .gte('data_lanc', format(start, 'yyyy-MM-dd')).lte('data_lanc', format(end, 'yyyy-MM-dd')).order('data_lanc', { ascending: true })
  if (escId) q = q.eq('escritorio_id', escId)
  const { data: lancs, error } = await q
  if (error) throw new Error(error.message)

  const rows = (lancs || []).map((l: any) => [
    l.data_lanc ? format(new Date(l.data_lanc), 'dd/MM/yyyy') : '—',
    l.historico || '—', l.conta_debito || '—', l.conta_credito || '—',
    l.tipo === 'credito' ? 'Crédito' : 'Débito', fmtBRL(Number(l.valor) || 0),
    l.clientes?.razao_social || '—',
  ])

  if (format_ === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape' })
    addPdfHeader(doc, 'LIVRO RAZÃO', label, escritorioNome)
    autoTable(doc, {
      startY: 57, head: [['Data', 'Histórico', 'Ct. Débito', 'Ct. Crédito', 'Tipo', 'Valor (R$)', 'Cliente']],
      body: rows.length > 0 ? rows : [['Nenhum lançamento no período', '', '', '', '', '', '']],
      styles: { fontSize: 8 }, headStyles: { fillColor: [26, 122, 74], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 249, 249] }, columnStyles: { 5: { halign: 'right' } },
    })
    doc.save(`LivroRazao_${label.replace(/\s/g, '_')}.pdf`)
  } else {
    const data = [['LIVRO RAZÃO'], [`Período: ${label}`, '', '', '', '', `Gerado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`], [],
      ['Data', 'Histórico', 'Conta Débito', 'Conta Crédito', 'Tipo', 'Valor (R$)', 'Cliente'], ...rows]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 16 }, { wch: 30 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Livro Razão')
    XLSX.writeFile(wb, `LivroRazao_${label.replace(/\s/g, '_')}.xlsx`)
  }
}

async function gerarLivroDiario(period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const { start, end, label } = getPeriodRange(period)
  let q = supabase.from('lancamentos').select('data_lanc, historico, conta_debito, conta_credito, valor, numero_doc, clientes(razao_social)')
    .gte('data_lanc', format(start, 'yyyy-MM-dd')).lte('data_lanc', format(end, 'yyyy-MM-dd')).order('data_lanc', { ascending: true })
  if (escId) q = q.eq('escritorio_id', escId)
  const { data: lancs, error } = await q
  if (error) throw new Error(error.message)

  const rows = (lancs || []).map((l: any, i: number) => [
    String(i + 1).padStart(4, '0'),
    l.data_lanc ? format(new Date(l.data_lanc), 'dd/MM/yyyy') : '—',
    l.numero_doc || '—',
    l.historico || '—',
    l.conta_debito || '—',
    l.conta_credito || '—',
    fmtBRL(Number(l.valor) || 0),
    l.clientes?.razao_social || '—',
  ])

  if (format_ === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape' })
    addPdfHeader(doc, 'LIVRO DIÁRIO', label, escritorioNome)
    autoTable(doc, {
      startY: 57,
      head: [['Nº', 'Data', 'Doc.', 'Histórico', 'Ct. Débito', 'Ct. Crédito', 'Valor (R$)', 'Cliente']],
      body: rows.length > 0 ? rows : [['', 'Nenhum lançamento no período', '', '', '', '', '', '']],
      styles: { fontSize: 8 }, headStyles: { fillColor: [26, 122, 74], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 6: { halign: 'right' } },
    })
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8); doc.setTextColor(150)
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
    }
    doc.save(`LivroDiario_${label.replace(/\s/g, '_')}.pdf`)
  } else {
    const data = [['LIVRO DIÁRIO'], [`Período: ${label}`, '', '', '', '', '', `Gerado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`], [],
      ['Nº', 'Data', 'Documento', 'Histórico', 'Conta Débito', 'Conta Crédito', 'Valor (R$)', 'Cliente'], ...rows]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 30 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Livro Diário')
    XLSX.writeFile(wb, `LivroDiario_${label.replace(/\s/g, '_')}.xlsx`)
  }
}

async function gerarObrigacoes(period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const { start, end, label } = getPeriodRange(period)
  let q = supabase.from('obrigacoes').select('tipo, vencimento, status, clientes(razao_social)')
    .gte('vencimento', format(start, 'yyyy-MM-dd')).lte('vencimento', format(end, 'yyyy-MM-dd')).order('vencimento', { ascending: true })
  if (escId) q = q.eq('escritorio_id', escId)
  const { data, error } = await q
  if (error) throw new Error(error.message)

  const rows = (data || []).map((o: any) => [
    o.tipo || '—',
    o.vencimento ? format(new Date(o.vencimento), 'dd/MM/yyyy') : '—',
    o.status === 'concluida' ? 'Concluída' : o.status === 'atrasado' ? 'Atrasada' : 'Pendente',
    (o as any).clientes?.razao_social || '—',
  ])

  if (format_ === 'pdf') {
    const doc = new jsPDF()
    addPdfHeader(doc, 'RELATÓRIO DE OBRIGAÇÕES ACESSÓRIAS', label, escritorioNome)
    autoTable(doc, {
      startY: 57, head: [['Obrigação', 'Vencimento', 'Status', 'Cliente']],
      body: rows.length > 0 ? rows : [['Nenhuma obrigação no período', '', '', '']],
      styles: { fontSize: 9 }, headStyles: { fillColor: [26, 122, 74], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const val = hookData.cell.raw as string
          if (val === 'Atrasada') hookData.cell.styles.textColor = [197, 48, 48]
          if (val === 'Concluída') hookData.cell.styles.textColor = [26, 122, 74]
          if (val === 'Pendente') hookData.cell.styles.textColor = [180, 83, 9]
        }
      },
    })
    doc.save(`Obrigacoes_${label.replace(/\s/g, '_')}.pdf`)
  } else {
    const dataOut = [['RELATÓRIO DE OBRIGAÇÕES ACESSÓRIAS'], [`Período: ${label}`, '', `Gerado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`], [],
      ['Obrigação', 'Vencimento', 'Status', 'Cliente'], ...rows]
    const ws = XLSX.utils.aoa_to_sheet(dataOut)
    ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 40 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Obrigações')
    XLSX.writeFile(wb, `Obrigacoes_${label.replace(/\s/g, '_')}.xlsx`)
  }
}

async function gerarFluxo(period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const { start, end, label } = getPeriodRange(period)
  let q = supabase.from('lancamentos').select('data_lanc, historico, valor, tipo')
    .gte('data_lanc', format(start, 'yyyy-MM-dd')).lte('data_lanc', format(end, 'yyyy-MM-dd')).order('data_lanc', { ascending: true })
  if (escId) q = q.eq('escritorio_id', escId)
  const { data: lancs, error } = await q
  if (error) throw new Error(error.message)

  const byMonth: Record<string, { entradas: number; saidas: number }> = {}
  ;(lancs || []).forEach((l: any) => {
    const m = l.data_lanc ? format(new Date(l.data_lanc), 'MM/yyyy') : '?'
    if (!byMonth[m]) byMonth[m] = { entradas: 0, saidas: 0 }
    const v = Number(l.valor) || 0
    if (l.tipo === 'credito') byMonth[m].entradas += v
    else byMonth[m].saidas += v
  })
  const rows = Object.entries(byMonth).map(([mes, { entradas, saidas }]) => [mes, fmtBRL(entradas), fmtBRL(saidas), fmtBRL(entradas - saidas)])
  const totEnt = Object.values(byMonth).reduce((s, r) => s + r.entradas, 0)
  const totSai = Object.values(byMonth).reduce((s, r) => s + r.saidas, 0)

  if (format_ === 'pdf') {
    const doc = new jsPDF()
    addPdfHeader(doc, 'DEMONSTRAÇÃO DE FLUXO DE CAIXA', label, escritorioNome)
    autoTable(doc, {
      startY: 57, head: [['Mês', 'Entradas (R$)', 'Saídas (R$)', 'Saldo (R$)']],
      body: rows.length > 0 ? rows : [['Nenhum lançamento no período', '', '', '']],
      foot: rows.length > 0 ? [['TOTAL', fmtBRL(totEnt), fmtBRL(totSai), fmtBRL(totEnt - totSai)]] : undefined,
      styles: { fontSize: 9 }, headStyles: { fillColor: [26, 122, 74], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    })
    doc.save(`FluxoCaixa_${label.replace(/\s/g, '_')}.pdf`)
  } else {
    const dataOut = [['DEMONSTRAÇÃO DE FLUXO DE CAIXA'], [`Período: ${label}`, '', '', `Gerado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`], [],
      ['Mês', 'Entradas (R$)', 'Saídas (R$)', 'Saldo (R$)'],
      ...Object.entries(byMonth).map(([mes, { entradas, saidas }]) => [mes, entradas, saidas, entradas - saidas]), [],
      ['TOTAL', totEnt, totSai, totEnt - totSai]]
    const ws = XLSX.utils.aoa_to_sheet(dataOut)
    ws['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Fluxo de Caixa')
    XLSX.writeFile(wb, `FluxoCaixa_${label.replace(/\s/g, '_')}.xlsx`)
  }
}

async function gerarBalanco(period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const { label } = getPeriodRange(period)
  let q = supabase.from('plano_contas').select('codigo, descricao, grupo, saldo_atual').order('codigo', { ascending: true })
  if (escId) q = q.eq('escritorio_id', escId)
  const { data: contas, error } = await q
  if (error) throw new Error(error.message)

  const grupos: Record<string, { codigo: string; descricao: string; saldo: number }[]> = {}
  ;(contas || []).forEach((c: any) => {
    const g = c.grupo || 'Outros'
    if (!grupos[g]) grupos[g] = []
    grupos[g].push({ codigo: c.codigo, descricao: c.descricao, saldo: Number(c.saldo_atual) || 0 })
  })

  const rows: any[] = []
  Object.entries(grupos).forEach(([grupo, contas]) => {
    rows.push([{ content: grupo.toUpperCase(), colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 248, 244] } }])
    contas.forEach(c => rows.push([c.codigo, c.descricao, fmtBRL(c.saldo)]))
    const tot = contas.reduce((s, c) => s + c.saldo, 0)
    rows.push([{ content: `Total ${grupo}`, colSpan: 2, styles: { fontStyle: 'bold' } }, { content: fmtBRL(tot), styles: { fontStyle: 'bold' } }])
    rows.push([{ content: '', colSpan: 3 }])
  })

  if (format_ === 'pdf') {
    const doc = new jsPDF()
    addPdfHeader(doc, 'BALANÇO PATRIMONIAL', label, escritorioNome)
    autoTable(doc, {
      startY: 57, head: [['Código', 'Conta', 'Saldo (R$)']],
      body: rows.length > 0 ? rows : [['Plano de contas não configurado', '', '']],
      styles: { fontSize: 9 }, headStyles: { fillColor: [26, 122, 74], textColor: 255 },
      columnStyles: { 2: { halign: 'right' } },
    })
    doc.save(`Balanco_${label.replace(/\s/g, '_')}.pdf`)
  } else {
    const dataOut = [['BALANÇO PATRIMONIAL'], [`Período: ${label}`, '', `Gerado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`], [],
      ['Código', 'Conta', 'Saldo (R$)'], ...(contas || []).map((c: any) => [c.codigo, c.descricao, Number(c.saldo_atual) || 0])]
    const ws = XLSX.utils.aoa_to_sheet(dataOut)
    ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 18 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Balanço')
    XLSX.writeFile(wb, `Balanco_${label.replace(/\s/g, '_')}.xlsx`)
  }
}

async function gerarHonorarios(_period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const now = new Date()
  const label = format(now, 'MMMM yyyy', { locale: ptBR })
  let q = supabase.from('clientes').select('razao_social, regime, honorarios, dia_vencimento, situacao, responsavel').order('razao_social')
  if (escId) q = q.eq('escritorio_id', escId)
  const { data, error } = await q
  if (error) throw new Error(error.message)

  const clientes = (data || []) as any[]
  const total = clientes.reduce((s: number, c: any) => s + (Number(c.honorarios) || 0), 0)
  const emDia = clientes.filter((c: any) => c.situacao === 'em_dia').length
  const pendentes = clientes.filter((c: any) => c.situacao !== 'em_dia').length

  const rows = clientes.map((c: any) => [
    c.razao_social || '—',
    c.regime || '—',
    c.honorarios ? fmtBRL(Number(c.honorarios)) : '—',
    c.dia_vencimento ? `Todo dia ${c.dia_vencimento}` : '—',
    c.situacao === 'em_dia' ? 'Em Dia' : c.situacao === 'pendente' ? 'Pendente' : 'Atrasado',
    c.responsavel || '—',
  ])

  if (format_ === 'pdf') {
    const doc = new jsPDF()
    addPdfHeader(doc, 'RELATÓRIO DE HONORÁRIOS', label, escritorioNome)
    // Summary boxes
    doc.setFontSize(9); doc.setTextColor(80, 80, 80)
    doc.text(`Total mensal: ${fmtBRL(total)}   |   ${clientes.length} clientes   |   ${emDia} em dia   |   ${pendentes} pendentes/atrasados`, 14, 57)
    autoTable(doc, {
      startY: 64,
      head: [['Cliente', 'Regime', 'Honorários', 'Vencimento', 'Situação', 'Responsável']],
      body: rows.length > 0 ? rows : [['Nenhum cliente cadastrado', '', '', '', '', '']],
      foot: rows.length > 0 ? [['TOTAL MENSAL', '', fmtBRL(total), '', '', '']] : undefined,
      styles: { fontSize: 8 }, headStyles: { fillColor: [26, 122, 74], textColor: 255 },
      footStyles: { fillColor: [240, 248, 244], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 4) {
          const val = hookData.cell.raw as string
          if (val === 'Atrasado') hookData.cell.styles.textColor = [197, 48, 48]
          if (val === 'Em Dia') hookData.cell.styles.textColor = [26, 122, 74]
          if (val === 'Pendente') hookData.cell.styles.textColor = [180, 83, 9]
        }
      },
    })
    doc.save(`Honorarios_${format(now, 'yyyy-MM')}.pdf`)
  } else {
    const dataOut = [
      ['RELATÓRIO DE HONORÁRIOS'], [`Referência: ${label}`, '', '', '', '', `Gerado: ${format(now, 'dd/MM/yyyy HH:mm')}`],
      [`Total mensal: ${fmtBRL(total)}`, `${clientes.length} clientes`, `${emDia} em dia`, `${pendentes} pendentes/atrasados`], [],
      ['Cliente', 'Regime', 'Honorários (R$)', 'Dia Vencimento', 'Situação', 'Responsável'],
      ...clientes.map((c: any) => [c.razao_social, c.regime, Number(c.honorarios) || 0, c.dia_vencimento || '', c.situacao, c.responsavel]),
      [], ['TOTAL MENSAL', '', total, '', '', ''],
    ]
    const ws = XLSX.utils.aoa_to_sheet(dataOut)
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 25 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Honorários')
    XLSX.writeFile(wb, `Honorarios_${format(now, 'yyyy-MM')}.xlsx`)
  }
}

async function gerarClientes(_period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const now = new Date()
  let q = supabase.from('clientes').select('razao_social, cnpj, regime, responsavel, honorarios, situacao, municipio, estado, telefone, email, data_abertura').order('razao_social')
  if (escId) q = q.eq('escritorio_id', escId)
  const { data, error } = await q
  if (error) throw new Error(error.message)

  const clientes = (data || []) as any[]
  const rows = clientes.map((c: any) => [
    c.razao_social || '—', c.cnpj || '—', c.regime || '—', c.responsavel || '—',
    c.honorarios ? fmtBRL(Number(c.honorarios)) : '—',
    c.situacao === 'em_dia' ? 'Em Dia' : c.situacao === 'pendente' ? 'Pendente' : 'Atrasado',
    c.municipio ? `${c.municipio}${c.estado ? `/${c.estado}` : ''}` : '—',
    c.telefone || '—', c.email || '—',
  ])

  if (format_ === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape' })
    addPdfHeader(doc, 'RELATÓRIO DE CLIENTES', format(now, 'dd/MM/yyyy'), escritorioNome)
    doc.setFontSize(9); doc.setTextColor(80)
    doc.text(`${clientes.length} clientes ativos na carteira`, 14, 57)
    autoTable(doc, {
      startY: 63,
      head: [['Cliente', 'CNPJ', 'Regime', 'Responsável', 'Honorários', 'Situação', 'Município/UF', 'Telefone', 'Email']],
      body: rows.length > 0 ? rows : [['Nenhum cliente', '', '', '', '', '', '', '', '']],
      styles: { fontSize: 7.5 }, headStyles: { fillColor: [26, 122, 74], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 5) {
          const val = hookData.cell.raw as string
          if (val === 'Atrasado') hookData.cell.styles.textColor = [197, 48, 48]
          if (val === 'Em Dia') hookData.cell.styles.textColor = [26, 122, 74]
          if (val === 'Pendente') hookData.cell.styles.textColor = [180, 83, 9]
        }
      },
    })
    doc.save(`Clientes_${format(now, 'yyyy-MM-dd')}.pdf`)
  } else {
    const dataOut = [['RELATÓRIO DE CLIENTES'], [`Data: ${format(now, 'dd/MM/yyyy HH:mm')}`], [],
      ['Cliente', 'CNPJ', 'Regime', 'Responsável', 'Honorários (R$)', 'Situação', 'Município/UF', 'Telefone', 'Email'],
      ...clientes.map((c: any) => [c.razao_social, c.cnpj, c.regime, c.responsavel, Number(c.honorarios) || 0,
        c.situacao, c.municipio ? `${c.municipio}${c.estado ? `/${c.estado}` : ''}` : '', c.telefone, c.email])]
    const ws = XLSX.utils.aoa_to_sheet(dataOut)
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 28 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, `Clientes_${format(now, 'yyyy-MM-dd')}.xlsx`)
  }
}

async function gerarInadimplencia(_period: Period, escritorioNome: string, format_: 'pdf' | 'xlsx', escId?: string) {
  const now = new Date()
  let q = supabase.from('clientes').select('razao_social, cnpj, regime, responsavel, honorarios, situacao, telefone, email').in('situacao', ['pendente', 'atrasado']).order('situacao').order('razao_social')
  if (escId) q = q.eq('escritorio_id', escId)
  const { data, error } = await q
  if (error) throw new Error(error.message)

  const clientes = (data || []) as any[]
  const totalEmRisco = clientes.reduce((s: number, c: any) => s + (Number(c.honorarios) || 0), 0)
  const rows = clientes.map((c: any) => [
    c.razao_social || '—', c.cnpj || '—', c.regime || '—',
    c.honorarios ? fmtBRL(Number(c.honorarios)) : '—',
    c.situacao === 'atrasado' ? 'Atrasado' : 'Pendente',
    c.responsavel || '—', c.telefone || '—', c.email || '—',
  ])

  if (format_ === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape' })
    addPdfHeader(doc, 'RELATÓRIO DE INADIMPLÊNCIA', format(now, 'dd/MM/yyyy'), escritorioNome)
    doc.setFontSize(9); doc.setTextColor(197, 48, 48)
    doc.text(`${clientes.length} clientes com pagamento pendente ou atrasado — Total em risco: ${fmtBRL(totalEmRisco)}/mês`, 14, 57)
    autoTable(doc, {
      startY: 63,
      head: [['Cliente', 'CNPJ', 'Regime', 'Honorários', 'Situação', 'Responsável', 'Telefone', 'Email']],
      body: rows.length > 0 ? rows : [['Nenhuma inadimplência — carteira em dia! ✓', '', '', '', '', '', '', '']],
      styles: { fontSize: 8 }, headStyles: { fillColor: [197, 48, 48], textColor: 255 },
      alternateRowStyles: { fillColor: [253, 248, 248] },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 4) {
          const val = hookData.cell.raw as string
          if (val === 'Atrasado') hookData.cell.styles.textColor = [197, 48, 48]
          if (val === 'Pendente') hookData.cell.styles.textColor = [180, 83, 9]
        }
      },
    })
    doc.save(`Inadimplencia_${format(now, 'yyyy-MM-dd')}.pdf`)
  } else {
    const dataOut = [['RELATÓRIO DE INADIMPLÊNCIA'], [`Data: ${format(now, 'dd/MM/yyyy HH:mm')}`, `Total em risco: ${fmtBRL(totalEmRisco)}/mês`], [],
      ['Cliente', 'CNPJ', 'Regime', 'Honorários (R$)', 'Situação', 'Responsável', 'Telefone', 'Email'],
      ...clientes.map((c: any) => [c.razao_social, c.cnpj, c.regime, Number(c.honorarios) || 0, c.situacao, c.responsavel, c.telefone, c.email])]
    const ws = XLSX.utils.aoa_to_sheet(dataOut)
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 28 }]
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Inadimplência')
    XLSX.writeFile(wb, `Inadimplencia_${format(now, 'yyyy-MM-dd')}.xlsx`)
  }
}

// ─── CSV Export Helpers ───────────────────────────────────────────────────────

function downloadCSV(rows: string[][], filename: string) {
  const bom = '\uFEFF'
  const csv = bom + rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

async function exportClientesCSV(escId?: string) {
  let q = supabase.from('clientes').select('razao_social, cnpj, email, telefone, regime, municipio, estado, honorarios, situacao').order('razao_social')
  if (escId) q = q.eq('escritorio_id', escId)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows: string[][] = [['razao_social', 'cnpj', 'email', 'telefone', 'regime', 'municipio', 'estado', 'honorarios', 'situacao']]
  ;(data || []).forEach((c: any) => rows.push([c.razao_social, c.cnpj, c.email, c.telefone, c.regime, c.municipio, c.estado, String(c.honorarios ?? ''), c.situacao]))
  downloadCSV(rows, `Clientes_BI_${format(new Date(), 'yyyy-MM-dd')}.csv`)
}

async function exportLancamentosCSV(period: Period, escId?: string) {
  const { start, end, label } = getPeriodRange(period)
  let q = supabase.from('lancamentos').select('data_lanc, historico, valor, tipo, conta_debito, conta_credito, centro_custo')
    .gte('data_lanc', format(start, 'yyyy-MM-dd')).lte('data_lanc', format(end, 'yyyy-MM-dd')).order('data_lanc', { ascending: true })
  if (escId) q = q.eq('escritorio_id', escId)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows: string[][] = [['data_lanc', 'historico', 'valor', 'tipo', 'conta_debito', 'conta_credito', 'centro_custo']]
  ;(data || []).forEach((l: any) => rows.push([l.data_lanc, l.historico, String(l.valor ?? ''), l.tipo, l.conta_debito, l.conta_credito, l.centro_custo ?? '']))
  downloadCSV(rows, `Lancamentos_BI_${label.replace(/\s/g, '_')}.csv`)
}

async function exportObrigacoesCSV(period: Period, escId?: string) {
  const { start, end, label } = getPeriodRange(period)
  let q = supabase.from('obrigacoes').select('tipo, vencimento, status, clientes(razao_social)')
    .gte('vencimento', format(start, 'yyyy-MM-dd')).lte('vencimento', format(end, 'yyyy-MM-dd')).order('vencimento', { ascending: true })
  if (escId) q = q.eq('escritorio_id', escId)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows: string[][] = [['tipo', 'vencimento', 'status', 'cliente']]
  ;(data || []).forEach((o: any) => rows.push([o.tipo, o.vencimento, o.status, o.clientes?.razao_social ?? '']))
  downloadCSV(rows, `Obrigacoes_BI_${label.replace(/\s/g, '_')}.csv`)
}

// ─── Report Definitions ───────────────────────────────────────────────────────

const REPORTS_CONTABEIS = [
  {
    key: 'balancete', name: 'Balancete de Verificação',
    desc: 'Demonstrativo de todas as contas com saldos devedores e credores do período.',
    icon: Scale, color: '#eff6ff', iconColor: '#1d4ed8',
    tags: ['NBC TG 26', 'Mensal', 'PDF · Excel'], fn: gerarBalancete,
  },
  {
    key: 'dre', name: 'DRE — Resultado',
    desc: 'Demonstração do Resultado com apuração de lucro ou prejuízo por categoria.',
    icon: TrendingUp, color: '#ecfdf5', iconColor: '#059669',
    tags: ['Anual · Mensal', 'CFC', 'PDF · Excel'], fn: gerarDRE,
  },
  {
    key: 'balanco', name: 'Balanço Patrimonial',
    desc: 'Posição financeira com Ativo, Passivo e Patrimônio Líquido do plano de contas.',
    icon: BookOpen, color: '#fefce8', iconColor: '#ca8a04',
    tags: ['NBC TG 1000', 'Anual', 'PDF · Excel'], fn: gerarBalanco,
  },
  {
    key: 'razao', name: 'Livro Razão',
    desc: 'Movimentação detalhada de todos os lançamentos agrupados por conta contábil.',
    icon: FileText, color: '#fdf2f8', iconColor: '#9333ea',
    tags: ['Analítico', 'Por conta', 'PDF · Excel'], fn: gerarLivroRazao,
  },
  {
    key: 'diario', name: 'Livro Diário',
    desc: 'Registro cronológico numerado de todos os lançamentos. Documento legal obrigatório.',
    icon: BookMarked, color: '#f0f9ff', iconColor: '#0284c7',
    tags: ['Obrigatório', 'Cronológico', 'PDF · Excel'], fn: gerarLivroDiario,
  },
  {
    key: 'fluxo', name: 'Fluxo de Caixa',
    desc: 'Demonstração de entradas e saídas mensais com saldo acumulado do período.',
    icon: BarChart2, color: '#fdf4ff', iconColor: '#a21caf',
    tags: ['NBC TG 03', 'Mensal', 'PDF · Excel'], fn: gerarFluxo,
  },
  {
    key: 'obrigacoes', name: 'Obrigações Acessórias',
    desc: 'Painel consolidado de obrigações fiscais com status e vencimento por cliente.',
    icon: FileSpreadsheet, color: '#fff7ed', iconColor: '#ea580c',
    tags: ['DCTF', 'SPED', 'eSocial', 'PDF · Excel'], fn: gerarObrigacoes,
  },
]

const REPORTS_ESCRITORIO = [
  {
    key: 'honorarios', name: 'Honorários por Cliente',
    desc: 'Receita mensal do escritório com lista de honorários, vencimentos e situação de pagamento por cliente.',
    icon: DollarSign, color: '#ecfdf5', iconColor: '#15803d',
    tags: ['Gestão', 'Cobrança', 'PDF · Excel'], fn: gerarHonorarios,
  },
  {
    key: 'clientes', name: 'Carteira de Clientes',
    desc: 'Visão completa do portfólio: regime tributário, honorários, contato e localização de cada cliente.',
    icon: Users, color: '#eff6ff', iconColor: '#1d4ed8',
    tags: ['Portfólio', 'Gestão', 'PDF · Excel'], fn: gerarClientes,
  },
  {
    key: 'inadimplencia', name: 'Inadimplência',
    desc: 'Clientes com pagamento pendente ou atrasado. Total em risco e dados de contato para cobrança.',
    icon: AlertTriangle, color: '#fff1f2', iconColor: '#be123c',
    tags: ['Cobrança', 'Urgente', 'PDF · Excel'], fn: gerarInadimplencia,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { escritorio } = useAuthStore()
  const [period, setPeriod] = useState<Period>('ano')
  const [loading, setLoading] = useState<string | null>(null)

  const escritorioNome = escritorio?.nome || 'TEUcontador'
  const escId = escritorio?.id

  const handleGenerate = async (key: string, fn: Function, format_: 'pdf' | 'xlsx') => {
    const loadKey = `${key}-${format_}`
    setLoading(loadKey)
    try {
      await fn(period, escritorioNome, format_, escId)
      toast.success('Relatório gerado e baixado com sucesso!')
    } catch (err: any) {
      toast.error(`Erro ao gerar relatório: ${err.message}`)
    } finally {
      setLoading(null)
    }
  }

  const periodLabel: Record<Period, string> = { mes: 'Este mês', trimestre: 'Este trimestre', ano: 'Este ano' }

  const renderCard = (r: any) => (
    <motion.div key={r.key} variants={itemVariants}>
      <ReportCard>
        <ReportIcon $color={r.color}><r.icon size={20} color={r.iconColor} /></ReportIcon>
        <ReportName>{r.name}</ReportName>
        <ReportDesc>{r.desc}</ReportDesc>
        <ReportTags>{r.tags.map((t: string) => <Tag key={t}>{t}</Tag>)}</ReportTags>
        <BtnRow>
          <GenerateBtn onClick={() => handleGenerate(r.key, r.fn, 'pdf')} whileTap={{ scale: 0.97 }} disabled={loading !== null}>
            {loading === `${r.key}-pdf`
              ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
              : <><Download size={12} /> PDF</>}
          </GenerateBtn>
          <GenerateBtn $outline onClick={() => handleGenerate(r.key, r.fn, 'xlsx')} whileTap={{ scale: 0.97 }} disabled={loading !== null}>
            {loading === `${r.key}-xlsx`
              ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
              : <><Download size={12} /> Excel</>}
          </GenerateBtn>
        </BtnRow>
      </ReportCard>
    </motion.div>
  )

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader>
          <PageTitle>Relatórios <em>Contábeis</em></PageTitle>
          <PageSub>Demonstrações financeiras e relatórios de gestão — dados em tempo real</PageSub>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <FiltersBar>
          <FilterLabel>Período:</FilterLabel>
          {(['mes', 'trimestre', 'ano'] as Period[]).map(p => (
            <PeriodBtn key={p} $active={period === p} onClick={() => setPeriod(p)}>{periodLabel[p]}</PeriodBtn>
          ))}
        </FiltersBar>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SectionLabel>Demonstrações Financeiras</SectionLabel>
      </motion.div>
      <Grid>{REPORTS_CONTABEIS.map(renderCard)}</Grid>

      <motion.div variants={itemVariants}>
        <SectionLabel>Gestão do Escritório</SectionLabel>
      </motion.div>
      <Grid>{REPORTS_ESCRITORIO.map(renderCard)}</Grid>

      <motion.div variants={itemVariants}>
        <SectionLabel>Exportação para BI</SectionLabel>
      </motion.div>
      <Grid>
        <motion.div variants={itemVariants}>
          <ReportCard>
            <ReportIcon $color="#f0fdf4"><Database size={20} color="#15803d" /></ReportIcon>
            <ReportName>Clientes completo</ReportName>
            <ReportDesc>Exporta todos os clientes em CSV com razão social, CNPJ, e-mail, telefone, regime, município, estado, honorários e situação.</ReportDesc>
            <ReportTags><Tag>CSV</Tag><Tag>BI</Tag><Tag>Completo</Tag></ReportTags>
            <BtnRow>
              <GenerateBtn
                onClick={async () => {
                  const k = 'clientes-bi-csv'
                  setLoading(k)
                  try { await exportClientesCSV(escId); toast.success('CSV gerado!') }
                  catch (e: any) { toast.error(e.message) }
                  finally { setLoading(null) }
                }}
                whileTap={{ scale: 0.97 }}
                disabled={loading !== null}
              >
                {loading === 'clientes-bi-csv'
                  ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                  : <><Download size={12} /> CSV</>}
              </GenerateBtn>
            </BtnRow>
          </ReportCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ReportCard>
            <ReportIcon $color="#eff6ff"><Database size={20} color="#1d4ed8" /></ReportIcon>
            <ReportName>Lançamentos do período</ReportName>
            <ReportDesc>Exporta lançamentos do período selecionado em CSV com data, histórico, valor, tipo, conta débito, conta crédito e centro de custo.</ReportDesc>
            <ReportTags><Tag>CSV</Tag><Tag>BI</Tag><Tag>Período</Tag></ReportTags>
            <BtnRow>
              <GenerateBtn
                onClick={async () => {
                  const k = 'lancamentos-bi-csv'
                  setLoading(k)
                  try { await exportLancamentosCSV(period, escId); toast.success('CSV gerado!') }
                  catch (e: any) { toast.error(e.message) }
                  finally { setLoading(null) }
                }}
                whileTap={{ scale: 0.97 }}
                disabled={loading !== null}
              >
                {loading === 'lancamentos-bi-csv'
                  ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                  : <><Download size={12} /> CSV</>}
              </GenerateBtn>
            </BtnRow>
          </ReportCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ReportCard>
            <ReportIcon $color="#fff7ed"><Database size={20} color="#ea580c" /></ReportIcon>
            <ReportName>Obrigações</ReportName>
            <ReportDesc>Exporta obrigações acessórias do período em CSV com tipo, vencimento, status e cliente para análise em ferramentas de BI.</ReportDesc>
            <ReportTags><Tag>CSV</Tag><Tag>BI</Tag><Tag>Fiscal</Tag></ReportTags>
            <BtnRow>
              <GenerateBtn
                onClick={async () => {
                  const k = 'obrigacoes-bi-csv'
                  setLoading(k)
                  try { await exportObrigacoesCSV(period, escId); toast.success('CSV gerado!') }
                  catch (e: any) { toast.error(e.message) }
                  finally { setLoading(null) }
                }}
                whileTap={{ scale: 0.97 }}
                disabled={loading !== null}
              >
                {loading === 'obrigacoes-bi-csv'
                  ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                  : <><Download size={12} /> CSV</>}
              </GenerateBtn>
            </BtnRow>
          </ReportCard>
        </motion.div>
      </Grid>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  )
}
