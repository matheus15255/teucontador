import { useState, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { Upload, Download, Check, X, AlertTriangle, FileText, Users, BookOpen, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

// ─── Styled Components ────────────────────────────────────────────────────────

const overlayIn = keyframes`from { opacity: 0; } to { opacity: 1; }`

const PageHeader = styled.div`margin-bottom: 24px;`
const PageTitle = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const TabRow = styled.div`
  display: flex; gap: 4px; margin-bottom: 20px; flex-wrap: wrap;
`
const Tab = styled.button<{ $active: boolean }>`
  display: flex; align-items: center; gap: 8px; padding: 9px 18px;
  border-radius: 10px; border: 1.5px solid;
  border-color: ${({ $active, theme }) => $active ? theme.green : theme.border};
  background: ${({ $active, theme }) => $active ? theme.greenLight : theme.surface};
  color: ${({ $active, theme }) => $active ? theme.green : theme.textMid};
  font-size: 13px; font-weight: ${({ $active }) => $active ? 600 : 400};
  font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.greenMid}; }
`

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`
const CardHead = styled.div`
  padding: 18px 22px; border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
`
const CardTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 400; color: ${({ theme }) => theme.text};
`
const CardSub = styled.div`font-size: 12px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`
const CardBody = styled.div`padding: 22px;`

const DropZone = styled.div<{ $over: boolean }>`
  border: 2px dashed ${({ $over, theme }) => $over ? theme.green : theme.border};
  border-radius: 12px; padding: 48px 24px; text-align: center; cursor: pointer;
  background: ${({ $over, theme }) => $over ? theme.greenLight : theme.surface2};
  transition: all 0.25s;
  &:hover { border-color: ${({ theme }) => theme.greenMid}; background: ${({ theme }) => theme.greenLight}; }
`

const ActionBtn = styled(motion.button)<{ $primary?: boolean; $outline?: boolean }>`
  display: flex; align-items: center; gap: 8px; padding: 9px 18px;
  background: ${({ $primary, $outline, theme }) =>
    $primary ? theme.green : $outline ? 'transparent' : theme.surface2};
  color: ${({ $primary, $outline, theme }) =>
    $primary ? '#fff' : $outline ? theme.green : theme.textMid};
  border: 1.5px solid ${({ $primary, $outline, theme }) =>
    $primary ? theme.green : $outline ? theme.green : theme.border};
  border-radius: 9px; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif;
  cursor: pointer; transition: all 0.2s;
  &:hover { opacity: 0.88; }
  &:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
`

const PreviewTable = styled.div`
  border: 1px solid ${({ theme }) => theme.border}; border-radius: 10px; overflow: auto;
  max-height: 280px; margin-bottom: 16px;
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: ${({ theme }) => theme.textDim};
    background: ${({ theme }) => theme.surface2}; border-bottom: 1px solid ${({ theme }) => theme.border};
    position: sticky; top: 0; z-index: 1; white-space: nowrap; }
  td { padding: 8px 12px; border-bottom: 1px solid ${({ theme }) => theme.border};
    color: ${({ theme }) => theme.text}; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: ${({ theme }) => theme.surface2}; }
`

const SummaryBox = styled.div<{ $type: 'ok' | 'warn' | 'error' }>`
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 10px;
  border: 1px solid ${({ $type }) =>
    $type === 'ok' ? '#bbf7d0' : $type === 'warn' ? '#fde68a' : '#fecaca'};
  background: ${({ $type }) =>
    $type === 'ok' ? '#f0fdf4' : $type === 'warn' ? '#fffbeb' : '#fef2f2'};
  color: ${({ $type }) =>
    $type === 'ok' ? '#166534' : $type === 'warn' ? '#92400e' : '#991b1b'};
  font-size: 13px; margin-bottom: 16px;
`

const StepIndicator = styled.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;
`
const Step = styled.div<{ $done: boolean; $active: boolean }>`
  display: flex; align-items: center; gap: 6px; font-size: 12px;
  color: ${({ $done, $active, theme }) =>
    $done ? theme.green : $active ? theme.text : theme.textDim};
  font-weight: ${({ $active }) => $active ? 600 : 400};
`
const StepDot = styled.div<{ $done: boolean; $active: boolean }>`
  width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
  background: ${({ $done, $active, theme }) =>
    $done ? theme.green : $active ? theme.text : theme.border};
  color: ${({ $done, $active }) => ($done || $active) ? '#fff' : 'transparent'};
`
const StepLine = styled.div`width: 24px; height: 1px; background: ${({ theme }) => theme.border};`

const ErrorList = styled.div`
  max-height: 140px; overflow-y: auto; margin-top: 8px;
`
const ErrorItem = styled.div`
  font-size: 11px; padding: 3px 0; color: #991b1b;
  &::before { content: '• '; }
`

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

// ─── CSV Utilities ────────────────────────────────────────────────────────────

type ParsedRow = Record<string, string>

function parseCSVGeneric(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const sep = lines[0].split(';').length > lines[0].split(',').length ? ';' : ','
  const splitLine = (l: string) =>
    l.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''))
  const headers = splitLine(lines[0])
  const rows = lines.slice(1).map(l => {
    const cols = splitLine(l)
    const obj: ParsedRow = {}
    headers.forEach((h, i) => { obj[h] = cols[i] ?? '' })
    return obj
  })
  return { headers, rows }
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

function findField(headers: string[], ...keys: string[]): string | null {
  for (const h of headers) {
    const n = normalize(h)
    if (keys.some(k => n.includes(normalize(k)))) return h
  }
  return null
}

function parseBRDate(s: string): string | null {
  const br = s?.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (br) {
    const [, d, m, y] = br
    const year = y.length === 2 ? (parseInt(y) > 50 ? '19' + y : '20' + y) : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  if (s?.match(/^\d{4}-\d{2}-\d{2}$/)) return s
  return null
}

function parseBRNumber(s: string): number | null {
  if (!s?.trim()) return null
  let v = s.replace(/[R$\s"']/g, '').trim()
  const neg = v.startsWith('(') && v.endsWith(')')
  if (neg) v = v.slice(1, -1)
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(v)
  return isNaN(n) ? null : (neg ? -n : n)
}

// ─── Template generators ──────────────────────────────────────────────────────

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

const TEMPLATE_CLIENTES = `razao_social;cnpj;email;telefone;regime;responsavel;municipio;estado
Empresa Exemplo Ltda;12.345.678/0001-99;contato@empresa.com;(11) 99999-9999;Simples Nacional;João Silva;São Paulo;SP
Outro Negócio ME;98.765.432/0001-11;outro@negocio.com;(21) 88888-8888;Lucro Presumido;Maria Santos;Rio de Janeiro;RJ`

const TEMPLATE_LANCAMENTOS = `data;historico;valor;tipo;conta_debito;conta_credito
01/03/2026;Receita de honorários;5000,00;credito;1.1.1.01;4.1.1.01
05/03/2026;Pagamento aluguel;2000,00;debito;3.1.1.01;1.1.1.01
10/03/2026;Pró-labore;3000,00;debito;3.2.1.01;2.1.1.01`

const TEMPLATE_OBRIGACOES = `tipo;vencimento;status
DCTF Mensal;31/03/2026;pendente
GPS;20/03/2026;pendente
SPED Contábil;31/07/2026;pendente
DAS Simples;20/04/2026;pendente`

// ─── Tab: Clientes ────────────────────────────────────────────────────────────

interface ImportResult {
  total: number
  ok: number
  erros: string[]
}

function useImport(escId: string | undefined) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const reset = () => { setStep('upload'); setHeaders([]); setRows([]); setResult(null) }

  const readFile = async (file: File) => {
    const text = await file.text()
    const { headers: h, rows: r } = parseCSVGeneric(text)
    if (h.length === 0 || r.length === 0) {
      toast.error('Arquivo CSV vazio ou sem dados reconhecíveis')
      return
    }
    setHeaders(h)
    setRows(r)
    setStep('preview')
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) { toast.error('Selecione um arquivo .csv'); return }
    readFile(file)
  }

  return { step, setStep, headers, rows, result, setResult, importing, setImporting, fileRef, dragOver, setDragOver, reset, handleFile }
}

// ─── TabClientes ─────────────────────────────────────────────────────────────

function TabClientes({ escId }: { escId: string }) {
  const state = useImport(escId)
  const { step, setStep, headers, rows, result, setResult, importing, setImporting, fileRef, dragOver, setDragOver, reset, handleFile } = state

  const doImport = async () => {
    setImporting(true)
    const erros: string[] = []
    let ok = 0

    const fRazao    = findField(headers, 'razao', 'nome', 'empresa', 'name', 'cliente')
    const fCnpj     = findField(headers, 'cnpj', 'cpf', 'documento', 'doc')
    const fEmail    = findField(headers, 'email', 'e-mail')
    const fTel      = findField(headers, 'telefone', 'fone', 'celular', 'phone')
    const fRegime   = findField(headers, 'regime', 'tributacao', 'tributario')
    const fResp     = findField(headers, 'responsavel', 'contato', 'responsavel')
    const fMunicipio= findField(headers, 'municipio', 'cidade', 'city')
    const fEstado   = findField(headers, 'estado', 'uf')

    if (!fRazao) { toast.error('Coluna de nome/razão social não encontrada'); setImporting(false); return }

    const chunk = 50
    for (let i = 0; i < rows.length; i += chunk) {
      const batch = rows.slice(i, i + chunk)
      const inserts = batch.map((r, idx) => {
        const razao = r[fRazao!]?.trim()
        if (!razao) { erros.push(`Linha ${i + idx + 2}: razão social vazia`); return null }
        return {
          escritorio_id: escId,
          razao_social: razao,
          cnpj: fCnpj ? r[fCnpj]?.replace(/[^\d]/g, '') || null : null,
          email: fEmail ? r[fEmail]?.trim() || null : null,
          telefone: fTel ? r[fTel]?.trim() || null : null,
          regime: fRegime ? r[fRegime]?.trim() || null : null,
          responsavel: fResp ? r[fResp]?.trim() || null : null,
          municipio: fMunicipio ? r[fMunicipio]?.trim() || null : null,
          estado: fEstado ? r[fEstado]?.trim().toUpperCase().slice(0, 2) || null : null,
        }
      }).filter(Boolean)

      if (inserts.length > 0) {
        const { error } = await supabase.from('clientes').insert(inserts as any[])
        if (error) erros.push(`Lote ${Math.floor(i / chunk) + 1}: ${error.message}`)
        else ok += inserts.length
      }
    }

    setResult({ total: rows.length, ok, erros })
    setStep('done')
    setImporting(false)
  }

  return (
    <div>
      <StepIndicator>
        {['Upload', 'Pré-visualização', 'Concluído'].map((label, i) => {
          const stages = ['upload', 'preview', 'done']
          const done = stages.indexOf(step) > i
          const active = stages[i] === step
          return (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Step $done={done} $active={active}>
                <StepDot $done={done} $active={active}>{done ? '✓' : i + 1}</StepDot>
                {label}
              </Step>
              {i < 2 && <StepLine />}
            </span>
          )
        })}
      </StepIndicator>

      {step === 'upload' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <ActionBtn $outline onClick={() => downloadCSV(TEMPLATE_CLIENTES, 'template_clientes.csv')} whileTap={{ scale: 0.97 }}>
              <Download size={14} /> Baixar template CSV
            </ActionBtn>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])} />
          <DropZone $over={dragOver}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}>
            <Upload size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
            <div style={{ fontFamily: 'Playfair Display', fontSize: 17, marginBottom: 6 }}>
              Arraste ou clique para selecionar
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              Arquivo .csv com cabeçalho. Compatível com ContaAzul, Omie e planilhas Excel.
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, lineHeight: 1.7 }}>
              Colunas detectadas automaticamente:<br />
              <strong>razao_social</strong> (obrigatório), cnpj, email, telefone, regime, responsavel, municipio, estado
            </div>
          </DropZone>
        </>
      )}

      {step === 'preview' && (
        <>
          <SummaryBox $type="ok">
            <Check size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>{rows.length} cliente{rows.length !== 1 ? 's' : ''}</strong> encontrado{rows.length !== 1 ? 's' : ''} no arquivo.
              Verifique os dados abaixo antes de importar.
            </div>
          </SummaryBox>
          <PreviewTable>
            <table>
              <thead><tr>{headers.slice(0, 6).map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>{headers.slice(0, 6).map(h => <td key={h}>{r[h] || '—'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </PreviewTable>
          {rows.length > 8 && <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 12, textAlign: 'center' }}>+ {rows.length - 8} registros adicionais</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <ActionBtn onClick={reset} whileTap={{ scale: 0.97 }}>
              <X size={14} /> Cancelar
            </ActionBtn>
            <ActionBtn $primary onClick={doImport} disabled={importing} whileTap={{ scale: 0.97 }}>
              <Upload size={14} /> {importing ? 'Importando…' : `Importar ${rows.length} clientes`}
            </ActionBtn>
          </div>
        </>
      )}

      {step === 'done' && result && (
        <>
          <SummaryBox $type={result.erros.length === 0 ? 'ok' : result.ok > 0 ? 'warn' : 'error'}>
            {result.erros.length === 0 ? <Check size={16} style={{ flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
            <div>
              <strong>{result.ok} de {result.total} clientes</strong> importados com sucesso.
              {result.erros.length > 0 && (
                <ErrorList>{result.erros.map((e, i) => <ErrorItem key={i}>{e}</ErrorItem>)}</ErrorList>
              )}
            </div>
          </SummaryBox>
          <ActionBtn onClick={reset} whileTap={{ scale: 0.97 }}>
            <Upload size={14} /> Nova importação
          </ActionBtn>
        </>
      )}
    </div>
  )
}

// ─── TabLancamentos ───────────────────────────────────────────────────────────

function TabLancamentos({ escId }: { escId: string }) {
  const state = useImport(escId)
  const { step, setStep, headers, rows, result, setResult, importing, setImporting, fileRef, dragOver, setDragOver, reset, handleFile } = state

  const doImport = async () => {
    setImporting(true)
    const erros: string[] = []
    let ok = 0

    const fData   = findField(headers, 'data', 'date', 'lancamento', 'competencia')
    const fHist   = findField(headers, 'historico', 'descricao', 'memo', 'narracao', 'description')
    const fValor  = findField(headers, 'valor', 'amount', 'vlr', 'montante')
    const fTipo   = findField(headers, 'tipo', 'type', 'natureza')
    const fDebito = findField(headers, 'contadebito', 'debito', 'debit', 'ctdebito')
    const fCredit = findField(headers, 'contacredito', 'credito', 'credit', 'ctcredito')

    if (!fData || !fHist || !fValor) {
      toast.error('Colunas obrigatórias não encontradas: data, historico, valor')
      setImporting(false)
      return
    }

    const chunk = 50
    for (let i = 0; i < rows.length; i += chunk) {
      const batch = rows.slice(i, i + chunk)
      const inserts = batch.map((r, idx) => {
        const date = parseBRDate(r[fData!])
        const valor = parseBRNumber(r[fValor!])
        const hist = r[fHist!]?.trim()
        if (!date) { erros.push(`Linha ${i + idx + 2}: data inválida "${r[fData!]}"`) ; return null }
        if (valor === null) { erros.push(`Linha ${i + idx + 2}: valor inválido "${r[fValor!]}"`); return null }
        if (!hist) { erros.push(`Linha ${i + idx + 2}: histórico vazio`); return null }
        const tipoRaw = fTipo ? r[fTipo]?.toLowerCase() : ''
        const tipo = tipoRaw?.includes('cred') ? 'credito' : 'debito'
        return {
          escritorio_id: escId,
          data_lanc: date,
          historico: hist,
          valor: Math.abs(valor),
          tipo,
          conta_debito: fDebito ? r[fDebito]?.trim() || null : null,
          conta_credito: fCredit ? r[fCredit]?.trim() || null : null,
        }
      }).filter(Boolean)

      if (inserts.length > 0) {
        const { error } = await supabase.from('lancamentos').insert(inserts as any[])
        if (error) erros.push(`Lote ${Math.floor(i / chunk) + 1}: ${error.message}`)
        else ok += inserts.length
      }
    }

    setResult({ total: rows.length, ok, erros })
    setStep('done')
    setImporting(false)
  }

  return (
    <div>
      <StepIndicator>
        {['Upload', 'Pré-visualização', 'Concluído'].map((label, i) => {
          const stages = ['upload', 'preview', 'done']
          const done = stages.indexOf(step) > i
          const active = stages[i] === step
          return (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Step $done={done} $active={active}>
                <StepDot $done={done} $active={active}>{done ? '✓' : i + 1}</StepDot>
                {label}
              </Step>
              {i < 2 && <StepLine />}
            </span>
          )
        })}
      </StepIndicator>

      {step === 'upload' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <ActionBtn $outline onClick={() => downloadCSV(TEMPLATE_LANCAMENTOS, 'template_lancamentos.csv')} whileTap={{ scale: 0.97 }}>
              <Download size={14} /> Baixar template CSV
            </ActionBtn>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])} />
          <DropZone $over={dragOver}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}>
            <Upload size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
            <div style={{ fontFamily: 'Playfair Display', fontSize: 17, marginBottom: 6 }}>
              Arraste ou clique para selecionar
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              Arquivo .csv exportado do ContaAzul, Omie ou planilha Excel.
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, lineHeight: 1.7 }}>
              Colunas: <strong>data</strong> (obrigatório), <strong>historico</strong> (obrigatório),
              <strong> valor</strong> (obrigatório), tipo, conta_debito, conta_credito
            </div>
          </DropZone>
        </>
      )}

      {step === 'preview' && (
        <>
          <SummaryBox $type="ok">
            <Check size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>{rows.length} lançamento{rows.length !== 1 ? 's' : ''}</strong> encontrado{rows.length !== 1 ? 's' : ''}.
              Confira antes de importar.
            </div>
          </SummaryBox>
          <PreviewTable>
            <table>
              <thead><tr>{headers.slice(0, 6).map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>{headers.slice(0, 6).map(h => <td key={h}>{r[h] || '—'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </PreviewTable>
          {rows.length > 8 && <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 12, textAlign: 'center' }}>+ {rows.length - 8} registros adicionais</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <ActionBtn onClick={reset} whileTap={{ scale: 0.97 }}><X size={14} /> Cancelar</ActionBtn>
            <ActionBtn $primary onClick={doImport} disabled={importing} whileTap={{ scale: 0.97 }}>
              <Upload size={14} /> {importing ? 'Importando…' : `Importar ${rows.length} lançamentos`}
            </ActionBtn>
          </div>
        </>
      )}

      {step === 'done' && result && (
        <>
          <SummaryBox $type={result.erros.length === 0 ? 'ok' : result.ok > 0 ? 'warn' : 'error'}>
            {result.erros.length === 0 ? <Check size={16} style={{ flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
            <div>
              <strong>{result.ok} de {result.total} lançamentos</strong> importados com sucesso.
              {result.erros.length > 0 && (
                <ErrorList>{result.erros.map((e, i) => <ErrorItem key={i}>{e}</ErrorItem>)}</ErrorList>
              )}
            </div>
          </SummaryBox>
          <ActionBtn onClick={reset} whileTap={{ scale: 0.97 }}><Upload size={14} /> Nova importação</ActionBtn>
        </>
      )}
    </div>
  )
}

// ─── TabObrigacoes ────────────────────────────────────────────────────────────

function TabObrigacoes({ escId }: { escId: string }) {
  const state = useImport(escId)
  const { step, setStep, headers, rows, result, setResult, importing, setImporting, fileRef, dragOver, setDragOver, reset, handleFile } = state

  const doImport = async () => {
    setImporting(true)
    const erros: string[] = []
    let ok = 0

    const fTipo   = findField(headers, 'tipo', 'obrigacao', 'declaracao', 'description', 'name')
    const fVenc   = findField(headers, 'vencimento', 'data', 'prazo', 'duedate')
    const fStatus = findField(headers, 'status', 'situacao')

    if (!fTipo || !fVenc) {
      toast.error('Colunas obrigatórias não encontradas: tipo, vencimento')
      setImporting(false)
      return
    }

    const chunk = 50
    for (let i = 0; i < rows.length; i += chunk) {
      const batch = rows.slice(i, i + chunk)
      const inserts = batch.map((r, idx) => {
        const tipo = r[fTipo!]?.trim()
        const venc = parseBRDate(r[fVenc!])
        if (!tipo) { erros.push(`Linha ${i + idx + 2}: tipo vazio`); return null }
        if (!venc) { erros.push(`Linha ${i + idx + 2}: data inválida "${r[fVenc!]}"`); return null }
        const statusRaw = fStatus ? r[fStatus]?.toLowerCase() : ''
        const status =
          statusRaw?.includes('transmit') ? 'transmitido' :
          statusRaw?.includes('atras') ? 'atrasado' : 'pendente'
        return { escritorio_id: escId, tipo, vencimento: venc, status }
      }).filter(Boolean)

      if (inserts.length > 0) {
        const { error } = await supabase.from('obrigacoes').insert(inserts as any[])
        if (error) erros.push(`Lote ${Math.floor(i / chunk) + 1}: ${error.message}`)
        else ok += inserts.length
      }
    }

    setResult({ total: rows.length, ok, erros })
    setStep('done')
    setImporting(false)
  }

  return (
    <div>
      <StepIndicator>
        {['Upload', 'Pré-visualização', 'Concluído'].map((label, i) => {
          const stages = ['upload', 'preview', 'done']
          const done = stages.indexOf(step) > i
          const active = stages[i] === step
          return (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Step $done={done} $active={active}>
                <StepDot $done={done} $active={active}>{done ? '✓' : i + 1}</StepDot>
                {label}
              </Step>
              {i < 2 && <StepLine />}
            </span>
          )
        })}
      </StepIndicator>

      {step === 'upload' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <ActionBtn $outline onClick={() => downloadCSV(TEMPLATE_OBRIGACOES, 'template_obrigacoes.csv')} whileTap={{ scale: 0.97 }}>
              <Download size={14} /> Baixar template CSV
            </ActionBtn>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])} />
          <DropZone $over={dragOver}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}>
            <Upload size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
            <div style={{ fontFamily: 'Playfair Display', fontSize: 17, marginBottom: 6 }}>
              Arraste ou clique para selecionar
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
              Lista de obrigações em CSV. Útil para migrar da agenda fiscal de outro sistema.
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, lineHeight: 1.7 }}>
              Colunas: <strong>tipo</strong> (obrigatório), <strong>vencimento</strong> (obrigatório), status
            </div>
          </DropZone>
        </>
      )}

      {step === 'preview' && (
        <>
          <SummaryBox $type="ok">
            <Check size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>{rows.length} obrigação{rows.length !== 1 ? 'ões' : ''}</strong> encontrada{rows.length !== 1 ? 's' : ''}.
              Confira antes de importar.
            </div>
          </SummaryBox>
          <PreviewTable>
            <table>
              <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>{headers.map(h => <td key={h}>{r[h] || '—'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </PreviewTable>
          {rows.length > 8 && <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 12, textAlign: 'center' }}>+ {rows.length - 8} registros adicionais</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <ActionBtn onClick={reset} whileTap={{ scale: 0.97 }}><X size={14} /> Cancelar</ActionBtn>
            <ActionBtn $primary onClick={doImport} disabled={importing} whileTap={{ scale: 0.97 }}>
              <Upload size={14} /> {importing ? 'Importando…' : `Importar ${rows.length} obrigações`}
            </ActionBtn>
          </div>
        </>
      )}

      {step === 'done' && result && (
        <>
          <SummaryBox $type={result.erros.length === 0 ? 'ok' : result.ok > 0 ? 'warn' : 'error'}>
            {result.erros.length === 0 ? <Check size={16} style={{ flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
            <div>
              <strong>{result.ok} de {result.total} obrigações</strong> importadas com sucesso.
              {result.erros.length > 0 && (
                <ErrorList>{result.erros.map((e, i) => <ErrorItem key={i}>{e}</ErrorItem>)}</ErrorList>
              )}
            </div>
          </SummaryBox>
          <ActionBtn onClick={reset} whileTap={{ scale: 0.97 }}><Upload size={14} /> Nova importação</ActionBtn>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'clientes',     label: 'Clientes',     icon: Users,    sub: 'Migrar lista de clientes' },
  { id: 'lancamentos',  label: 'Lançamentos',  icon: BookOpen, sub: 'Migrar contabilidade' },
  { id: 'obrigacoes',   label: 'Obrigações',   icon: Calendar, sub: 'Migrar agenda fiscal' },
]

export function ImportPage() {
  const { escritorio } = useAuthStore()
  const escId = escritorio?.id
  const [tab, setTab] = useState('clientes')

  if (!escId) return null

  const current = TABS.find(t => t.id === tab)!

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <motion.div variants={itemVariants}>
        <PageHeader>
          <PageTitle>Importar <em>Dados</em></PageTitle>
          <PageSub>Migre clientes, lançamentos e obrigações de qualquer sistema (ContaAzul, Omie, planilha Excel)</PageSub>
        </PageHeader>
      </motion.div>

      {/* Info strip */}
      <motion.div variants={itemVariants}>
        <div style={{
          display: 'flex', gap: 12, padding: '14px 18px', borderRadius: 12,
          background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 13, color: '#1e40af',
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          <FileText size={15} style={{ flexShrink: 0 }} />
          <span>
            <strong>Como funciona:</strong> baixe o template da aba desejada, preencha com seus dados ou
            adapte o CSV exportado do seu sistema atual, e importe. As colunas são detectadas automaticamente.
          </span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <TabRow>
          {TABS.map(t => (
            <Tab key={t.id} $active={tab === t.id} onClick={() => setTab(t.id)}>
              <t.icon size={15} /> {t.label}
            </Tab>
          ))}
        </TabRow>

        <Card>
          <CardHead>
            <div>
              <CardTitle>{current.label}</CardTitle>
              <CardSub>{current.sub}</CardSub>
            </div>
          </CardHead>
          <CardBody>
            {tab === 'clientes'    && <TabClientes escId={escId} />}
            {tab === 'lancamentos' && <TabLancamentos escId={escId} />}
            {tab === 'obrigacoes'  && <TabObrigacoes escId={escId} />}
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  )
}
