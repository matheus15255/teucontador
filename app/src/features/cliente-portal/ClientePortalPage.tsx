import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { LogOut, TrendingUp, TrendingDown, DollarSign, AlertCircle, Download, FileText, Link2, Clock, Sun, Moon, Inbox, CheckCircle } from 'lucide-react'
import ReactApexChart from 'react-apexcharts'
import { supabase } from '../../lib/supabase'
import { useClientePortalStore } from '../../stores/clientePortalStore'
import { useTheme } from '../../styles/ThemeProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lancamento {
  id: string
  data_lanc: string
  historico: string
  tipo?: 'debito' | 'credito'
  valor: number
}

interface Obrigacao {
  id: string
  tipo: string
  vencimento: string
  status?: 'pendente' | 'atrasado' | 'transmitido'
}

interface Transacao {
  id: string
  data_transacao: string
  descricao: string
  tipo?: 'credito' | 'debito'
  valor: number
  lancamento_id?: string
  lanc_historico?: string
  lanc_valor?: number
  lanc_data?: string
  conta_debito?: string
  conta_credito?: string
}

interface Arquivo {
  id: string
  nome_arquivo: string
  storage_path: string
  size_bytes: number
  mimetype: string
  created_at: string
}

interface PortalHonorario {
  id: string
  mes_ref: string
  valor: number
  status: 'pendente' | 'pago' | 'atrasado'
  data_pagamento?: string
}

interface PortalGuia {
  id: string
  tipo: string
  descricao?: string
  mes_ref: string
  valor?: number
  data_vencimento?: string
  status: 'pendente' | 'emitida' | 'paga'
}

interface PortalDoc {
  id: string
  mes_ref: string
  tipo_documento: string
  status: 'aguardando' | 'recebido'
  observacoes?: string
}

interface ClienteDados {
  cliente: Record<string, unknown>
  lancamentos: Lancamento[]
  obrigacoes: Obrigacao[]
  transacoes: Transacao[]
  arquivos: Arquivo[]
}

// ─── Animations ───────────────────────────────────────────────────────────────

const spin = keyframes`to { transform: rotate(360deg); }`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`

// ─── Styled Components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.bg};
  font-family: 'Inter', sans-serif;
`

const TopBar = styled.div`
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  padding: 0 32px;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 16px rgba(0,0,0,0.2);
  @media (max-width: 600px) { padding: 0 14px; gap: 8px; height: 90px; }
`

const LogoText = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.3px;
  span { color: rgba(255,255,255,0.5); }
`

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const ClienteName = styled.div`
  font-size: 13px;
  color: rgba(255,255,255,0.85);
  font-weight: 500;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 480px) { display: none; }
`

const TopBarBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 6px 12px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.22); }
`

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px;
  animation: ${fadeIn} 0.4s ease;
  @media (max-width: 600px) { padding: 16px 14px; }
`

const Greeting = styled.div`
  margin-bottom: 28px;
`

const GreetingTitle = styled.h1`
  font-family: 'Inter', sans-serif;
  font-size: 30px;
  font-weight: 400;
  letter-spacing: -0.5px;
  color: ${({ theme }) => theme.text};
  margin-bottom: 6px;
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
  @media (max-width: 480px) { font-size: 22px; }
`

const GreetingMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`

const MetaTag = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.textDim};
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  padding: 3px 10px;
  border-radius: 6px;
`

const SituacaoBadge = styled.div<{ $status?: string }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ theme, $status }) =>
    $status === 'em_dia' ? theme.posBg :
    $status === 'pendente' ? theme.warnBg :
    $status === 'atrasado' ? theme.negBg : theme.surface3};
  color: ${({ theme, $status }) =>
    $status === 'em_dia' ? theme.pos :
    $status === 'pendente' ? theme.warn :
    $status === 'atrasado' ? theme.neg : theme.textDim};
`

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 540px) { grid-template-columns: 1fr; }
`

const KpiCard = styled(motion.div)`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: ${({ theme }) => theme.shadow};
  transition: box-shadow 0.2s;
  &:hover { box-shadow: ${({ theme }) => theme.shadowMd}; }
`

const KpiHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const KpiLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
`

const KpiIconBox = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: ${({ $color }) => $color}18;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
`

const KpiValue = styled.div<{ $color?: string }>`
  font-family: 'Inter', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: ${({ $color, theme }) => $color || theme.text};
`

const KpiSub = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.textDim};
`

const Section = styled.div`
  margin-bottom: 28px;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`

const SectionTitle = styled.h2`
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.text};
`

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow};
  @media (max-width: 768px) { overflow-x: auto; -webkit-overflow-scrolling: touch; }
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  text-align: left;
  padding: 11px 16px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface2};
`

const Td = styled.td`
  padding: 11px 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.textMid};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  &:last-child { border-right: none; }
`

const TRow = styled.tr`
  transition: background 0.15s;
  &:hover { background: ${({ theme }) => theme.surface2}; }
  &:last-child td { border-bottom: none; }
`

const StatusBadge = styled.span<{ $status?: string }>`
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: ${({ theme, $status }) =>
    $status === 'transmitido' ? theme.posBg :
    $status === 'pendente'    ? theme.warnBg :
    $status === 'atrasado'    ? theme.negBg : theme.surface3};
  color: ${({ theme, $status }) =>
    $status === 'transmitido' ? theme.pos :
    $status === 'pendente'    ? theme.warn :
    $status === 'atrasado'    ? theme.neg : theme.textDim};
`

const TipoBadge = styled.span<{ $tipo?: string }>`
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
  background: ${({ theme, $tipo }) => $tipo === 'credito' ? theme.posBg : theme.negBg};
  color: ${({ theme, $tipo }) => $tipo === 'credito' ? theme.pos : theme.neg};
`

const ValorText = styled.span<{ $tipo?: string }>`
  font-weight: 600;
  color: ${({ theme, $tipo }) => $tipo === 'credito' ? theme.pos : $tipo === 'debito' ? theme.neg : theme.textMid};
`

const EmptyRow = styled.tr`
  td {
    padding: 32px 16px;
    text-align: center;
    color: ${({ theme }) => theme.textDim};
    font-size: 13px;
  }
`

const LoadingOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 12px;
  color: ${({ theme }) => theme.textDim};
  font-size: 14px;
`

const SpinnerEl = styled.div`
  width: 22px;
  height: 22px;
  border: 2px solid ${({ theme }) => theme.border};
  border-top-color: ${({ theme }) => theme.green};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`

const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`

const ConcilRow = styled.div<{ $conciliada: boolean }>`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme, $conciliada }) => $conciliada ? theme.greenLight : theme.surface};
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  @media (max-width: 700px) { grid-template-columns: 1fr; gap: 6px; }
`

const ConcilSide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`

const ConcilLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  margin-bottom: 2px;
`

const ConcilDesc = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ConcilMeta = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.textDim};
`

const ConcilLink = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`

const ConcilBadgeConciliada = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  color: ${({ theme }) => theme.pos};
  background: ${({ theme }) => theme.posBg};
  border-radius: 20px;
  padding: 3px 10px;
  white-space: nowrap;
`

const ConcilBadgePendente = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  color: ${({ theme }) => theme.textDim};
  background: ${({ theme }) => theme.surface3};
  border-radius: 20px;
  padding: 3px 10px;
  white-space: nowrap;
`

const ConcilEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1.5px dashed ${({ theme }) => theme.border2};
  color: ${({ theme }) => theme.textDim};
  font-size: 11px;
  font-style: italic;
  min-width: 140px;
`

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
  @media (max-width: 480px) {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
`

const Tab = styled.button<{ $active: boolean }>`
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  border: 1.5px solid ${({ theme, $active }) => $active ? theme.green : theme.border};
  background: ${({ theme, $active }) => $active ? theme.green : theme.surface};
  color: ${({ theme, $active }) => $active ? '#fff' : theme.textDim};
  transition: all 0.18s;
  &:hover { border-color: ${({ theme }) => theme.green}; color: ${({ $active, theme }) => $active ? '#fff' : theme.green}; }
`

// ─── New Portal Styled Components ─────────────────────────────────────────────

const WhatsAppFab = styled.a`
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #25d366;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(37, 211, 102, 0.45);
  z-index: 999;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(37, 211, 102, 0.6); }
  @media (max-width: 600px) { bottom: 18px; right: 16px; }
`

const UrgencyDays = styled.span<{ $urgency: 'atrasado' | 'critico' | 'urgente' | 'normal' | 'ok' }>`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  background: ${({ $urgency, theme }) =>
    $urgency === 'atrasado' ? theme.negBg :
    $urgency === 'critico'  ? '#fff3cd' :
    $urgency === 'urgente'  ? '#fff8e6' :
    $urgency === 'ok'       ? theme.posBg : theme.surface3};
  color: ${({ $urgency, theme }) =>
    $urgency === 'atrasado' ? theme.neg :
    $urgency === 'critico'  ? '#92400e' :
    $urgency === 'urgente'  ? '#b45309' :
    $urgency === 'ok'       ? theme.pos : theme.textDim};
`

const HonorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
`

const HonorCard = styled.div<{ $status: string }>`
  background: ${({ theme, $status }) =>
    $status === 'pago' ? theme.posBg :
    $status === 'atrasado' ? theme.negBg : theme.warnBg};
  border: 1.5px solid ${({ theme, $status }) =>
    $status === 'pago' ? theme.pos + '44' :
    $status === 'atrasado' ? theme.neg + '44' : theme.warn + '44'};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const HonorMes = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.textMid};
`

const HonorValor = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
`

const HonorStatusTag = styled.div<{ $status: string }>`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme, $status }) =>
    $status === 'pago' ? theme.pos :
    $status === 'atrasado' ? theme.neg : theme.warn};
`

const GuiaPortalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`

const GuiaPortalItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  &:last-child { border-bottom: none; }
  @media (max-width: 480px) { flex-wrap: wrap; gap: 8px; padding: 12px 14px; }
`

const GuiaTipoTag = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #007bff;
  background: #e8f5ee;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
  flex-shrink: 0;
`

const GuiaPortalInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const GuiaPortalDesc = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const GuiaPortalMeta = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.textDim};
  margin-top: 2px;
`

const GuiaPortalValor = styled.div<{ $status: string }>`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme, $status }) => $status === 'paga' ? theme.pos : theme.text};
  white-space: nowrap;
  flex-shrink: 0;
`

const DocPortalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`

const DocPortalItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  &:last-child { border-bottom: none; }
  @media (max-width: 480px) { flex-wrap: wrap; gap: 8px; padding: 12px 14px; }
`

const DocPortalIconWrap = styled.div<{ $recebido: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: ${({ theme, $recebido }) => $recebido ? theme.posBg : theme.warnBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $recebido }) => $recebido ? theme.pos : theme.warn};
  flex-shrink: 0;
`

const DocPortalInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const DocPortalTipo = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`

const DocPortalMeta = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.textDim};
  margin-top: 2px;
`

const DocPortalStatus = styled.div<{ $recebido: boolean }>`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 3px 10px;
  border-radius: 20px;
  background: ${({ theme, $recebido }) => $recebido ? theme.posBg : theme.warnBg};
  color: ${({ theme, $recebido }) => $recebido ? theme.pos : theme.warn};
  white-space: nowrap;
  flex-shrink: 0;
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (d: string) => {
  if (!d) return '—'
  const parts = d.split('T')[0].split('-')
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const diffDays = (dateStr: string): number => {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(dateStr + 'T00:00:00')
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

const obrigUrgency = (o: Obrigacao): 'atrasado' | 'critico' | 'urgente' | 'normal' | 'ok' => {
  if (o.status === 'transmitido') return 'ok'
  if (o.status === 'atrasado') return 'atrasado'
  const d = diffDays(o.vencimento)
  if (d < 0) return 'atrasado'
  if (d <= 3) return 'critico'
  if (d <= 7) return 'urgente'
  return 'normal'
}

const urgencyLabel = (o: Obrigacao): string => {
  if (o.status === 'transmitido') return 'Transmitido'
  const d = diffDays(o.vencimento)
  if (d < 0) return `${Math.abs(d)}d atrasado`
  if (d === 0) return 'Vence hoje!'
  if (d === 1) return 'Vence amanhã'
  return `${d} dias`
}

const fmtMesRef = (m: string) => {
  if (!m) return '—'
  const [y, mo] = m.split('-')
  const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${names[parseInt(mo) - 1]}/${y}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientePortalPage() {
  const navigate = useNavigate()
  const { session, logout } = useClientePortalStore()
  const { isDark, toggleTheme } = useTheme()
  const [dados, setDados] = useState<ClienteDados | null>(null)
  const [loading, setLoading] = useState(true)
  const [concilTab, setConcilTab] = useState<'todas' | 'conciliadas' | 'pendentes'>('todas')
  const [honorarios, setHonorarios] = useState<PortalHonorario[]>([])
  const [guias, setGuias] = useState<PortalGuia[]>([])
  const [docs, setDocs] = useState<PortalDoc[]>([])

  useEffect(() => {
    if (!session) {
      navigate('/portal')
      return
    }
    const fetchDados = async () => {
      setLoading(true)
      const [dadosRes, honorRes, guiasRes, docsRes] = await Promise.allSettled([
        supabase.rpc('get_cliente_dados',    { p_id: session.id, p_senha: session.senha_acesso }),
        supabase.rpc('get_cliente_honorarios', { p_id: session.id, p_senha: session.senha_acesso }),
        supabase.rpc('get_cliente_guias',    { p_id: session.id, p_senha: session.senha_acesso }),
        supabase.rpc('get_cliente_docs',     { p_id: session.id, p_senha: session.senha_acesso }),
      ])
      if (dadosRes.status === 'rejected' || !('value' in dadosRes) || dadosRes.value.error || !dadosRes.value.data) {
        console.error('Portal fetch failed')
        navigate('/portal')
        return
      }
      setDados(dadosRes.value.data as ClienteDados)
      if (honorRes.status === 'fulfilled' && honorRes.value.data) setHonorarios((honorRes.value.data as PortalHonorario[]) || [])
      if (guiasRes.status === 'fulfilled' && guiasRes.value.data) setGuias((guiasRes.value.data as PortalGuia[]) || [])
      if (docsRes.status === 'fulfilled' && docsRes.value.data) setDocs((docsRes.value.data as PortalDoc[]) || [])
      setLoading(false)
    }
    fetchDados()
  }, [session, navigate])

  const handleLogout = () => {
    logout()
    navigate('/portal')
  }

  // ── KPI calculations ──
  const lancamentos: Lancamento[] = dados?.lancamentos ?? []
  const obrigacoes: Obrigacao[] = dados?.obrigacoes ?? []
  const transacoes: Transacao[] = dados?.transacoes ?? []
  const arquivos: Arquivo[] = dados?.arquivos ?? []

  const downloadArquivo = (storagePath: string, nomeArquivo: string) => {
    const { data } = supabase.storage.from('cliente-arquivos').getPublicUrl(storagePath)
    const a = document.createElement('a')
    a.href = data.publicUrl
    a.download = nomeArquivo
    a.target = '_blank'
    a.click()
  }

  const fmtFileSize = (bytes: number) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const lancMes = lancamentos.filter(l => {
    const d = new Date(l.data_lanc)
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth
  })

  const receitasMes = lancMes.filter(l => l.tipo === 'credito').reduce((s, l) => s + (l.valor || 0), 0)
  const despesasMes = lancMes.filter(l => l.tipo === 'debito').reduce((s, l) => s + (l.valor || 0), 0)
  const saldo = receitasMes - despesasMes
  const obrigacoesPendentes = obrigacoes.filter(o => o.status === 'pendente' || o.status === 'atrasado').length

  const transacoesConciliadas = transacoes.filter(t => t.lancamento_id)
  const transacoesPendentes   = transacoes.filter(t => !t.lancamento_id)
  const transacoesFiltradas =
    concilTab === 'conciliadas' ? transacoesConciliadas :
    concilTab === 'pendentes'   ? transacoesPendentes   :
    transacoes

  // ── Chart data ──
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  const receitasPorMes = months.map(m =>
    lancamentos
      .filter(l => { const d = new Date(l.data_lanc); return d.getFullYear() === currentYear && d.getMonth() + 1 === m && l.tipo === 'credito' })
      .reduce((s, l) => s + (l.valor || 0), 0)
  )

  const despesasPorMes = months.map(m =>
    lancamentos
      .filter(l => { const d = new Date(l.data_lanc); return d.getFullYear() === currentYear && d.getMonth() + 1 === m && l.tipo === 'debito' })
      .reduce((s, l) => s + (l.valor || 0), 0)
  )

  const axisColor = isDark ? '#5c6478' : '#9ca3af'
  const gridColor = isDark ? '#252a3a' : '#f3f4f6'

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    plotOptions: {
      bar: { borderRadius: 5, columnWidth: '55%' }
    },
    colors: ['#059669', '#f87171'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: monthNames,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: '11px', colors: axisColor } }
    },
    yaxis: {
      labels: {
        formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k`,
        style: { fontSize: '11px', colors: axisColor }
      }
    },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontWeight: 500,
      labels: { colors: isDark ? '#c4c9d4' : '#6b7280' }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (v) => fmtCurrency(v) }
    }
  }

  const chartSeries = [
    { name: 'Receitas', data: receitasPorMes },
    { name: 'Despesas', data: despesasPorMes },
  ]

  if (!session) return null

  return (
    <Wrapper>
      <TopBar>
        <img src="/img/logo.png" alt="TEUcontador" style={{ height: 130, width: 'auto', display: 'block', flexShrink: 0 }} />
        <TopBarRight>
          <ClienteName>{session.razao_social}</ClienteName>
          <TopBarBtn onClick={toggleTheme} title={isDark ? 'Modo Claro' : 'Modo Escuro'}>
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
            {isDark ? 'Claro' : 'Escuro'}
          </TopBarBtn>
          <TopBarBtn onClick={handleLogout}>
            <LogOut size={13} />
            Sair
          </TopBarBtn>
        </TopBarRight>
      </TopBar>

      <Content>
        {loading ? (
          <LoadingOverlay>
            <SpinnerEl />
            Carregando seus dados...
          </LoadingOverlay>
        ) : (
          <>
            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Greeting>
                <GreetingTitle>
                  Olá, <em>{session.razao_social}</em>
                </GreetingTitle>
                <GreetingMeta>
                  {session.cnpj && <MetaTag>CNPJ: {session.cnpj}</MetaTag>}
                  {session.regime && <MetaTag>{session.regime}</MetaTag>}
                  {session.situacao && (
                    <SituacaoBadge $status={session.situacao}>
                      {session.situacao === 'em_dia' ? 'Em dia' : session.situacao === 'pendente' ? 'Pendente' : 'Atrasado'}
                    </SituacaoBadge>
                  )}
                </GreetingMeta>
              </Greeting>
            </motion.div>

            {/* KPI Cards */}
            <KpiGrid>
              {[
                {
                  label: 'Receitas do Mês',
                  value: fmtCurrency(receitasMes),
                  icon: <TrendingUp size={16} />,
                  color: '#059669',
                  sub: `Mês ${currentMonth}/${currentYear}`,
                },
                {
                  label: 'Despesas do Mês',
                  value: fmtCurrency(despesasMes),
                  icon: <TrendingDown size={16} />,
                  color: '#f87171',
                  sub: `Mês ${currentMonth}/${currentYear}`,
                },
                {
                  label: 'Saldo',
                  value: fmtCurrency(saldo),
                  icon: <DollarSign size={16} />,
                  color: saldo >= 0 ? '#007bff' : '#dc2626',
                  sub: 'Receitas − Despesas',
                },
                {
                  label: 'Obrigações Pendentes',
                  value: String(obrigacoesPendentes),
                  icon: <AlertCircle size={16} />,
                  color: obrigacoesPendentes > 0 ? '#f59e0b' : '#059669',
                  sub: 'Pendentes ou atrasadas',
                },
              ].map((kpi, i) => (
                <KpiCard
                  key={kpi.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <KpiHeader>
                    <KpiLabel>{kpi.label}</KpiLabel>
                    <KpiIconBox $color={kpi.color}>{kpi.icon}</KpiIconBox>
                  </KpiHeader>
                  <KpiValue $color={kpi.color}>{kpi.value}</KpiValue>
                  <KpiSub>{kpi.sub}</KpiSub>
                </KpiCard>
              ))}
            </KpiGrid>

            {/* Chart */}
            <Section>
              <SectionHeader>
                <SectionTitle>Receitas × Despesas — {currentYear}</SectionTitle>
              </SectionHeader>
              <Card style={{ padding: '20px' }}>
                <ReactApexChart
                  key={isDark ? 'dark' : 'light'}
                  options={chartOptions}
                  series={chartSeries}
                  type="bar"
                  height={280}
                />
              </Card>
            </Section>

            {/* Obrigações + Lançamentos */}
            <TwoColGrid>
              {/* Obrigações */}
              <Section>
                <SectionHeader>
                  <SectionTitle>Obrigações Fiscais</SectionTitle>
                  {obrigacoesPendentes > 0 && (
                    <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                      {obrigacoesPendentes} pendente{obrigacoesPendentes > 1 ? 's' : ''}
                    </span>
                  )}
                </SectionHeader>
                <Card>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Tipo</Th>
                        <Th>Vencimento</Th>
                        <Th>Prazo</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {obrigacoes.slice(0, 12).length === 0 ? (
                        <EmptyRow><td colSpan={4}>Nenhuma obrigação registrada</td></EmptyRow>
                      ) : (
                        obrigacoes.slice(0, 12).map(o => {
                          const urgency = obrigUrgency(o)
                          return (
                            <TRow key={o.id}>
                              <Td style={{ fontWeight: 600 }}>{o.tipo}</Td>
                              <Td style={{ whiteSpace: 'nowrap' }}>{fmtDate(o.vencimento)}</Td>
                              <Td>
                                <UrgencyDays $urgency={urgency}>{urgencyLabel(o)}</UrgencyDays>
                              </Td>
                              <Td><StatusBadge $status={o.status}>{o.status === 'transmitido' ? 'Transmitido' : o.status === 'atrasado' ? 'Atrasado' : 'Pendente'}</StatusBadge></Td>
                            </TRow>
                          )
                        })
                      )}
                    </tbody>
                  </Table>
                </Card>
              </Section>

              {/* Lançamentos Recentes */}
              <Section>
                <SectionHeader>
                  <SectionTitle>Lançamentos Recentes</SectionTitle>
                </SectionHeader>
                <Card>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Data</Th>
                        <Th>Histórico</Th>
                        <Th>Tipo</Th>
                        <Th>Valor</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {lancamentos.slice(0, 15).length === 0 ? (
                        <EmptyRow><td colSpan={4}>Nenhum lançamento encontrado</td></EmptyRow>
                      ) : (
                        lancamentos.slice(0, 15).map(l => (
                          <TRow key={l.id}>
                            <Td style={{ whiteSpace: 'nowrap' }}>{fmtDate(l.data_lanc)}</Td>
                            <Td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.historico}</Td>
                            <Td><TipoBadge $tipo={l.tipo}>{l.tipo === 'credito' ? 'Crédito' : 'Débito'}</TipoBadge></Td>
                            <Td><ValorText $tipo={l.tipo}>{fmtCurrency(l.valor)}</ValorText></Td>
                          </TRow>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card>
              </Section>
            </TwoColGrid>

            {/* Honorários */}
            {honorarios.length > 0 && (
              <Section>
                <SectionHeader>
                  <SectionTitle>Seus Honorários</SectionTitle>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Mensalidade do escritório</span>
                </SectionHeader>
                <HonorGrid>
                  {honorarios.map(h => (
                    <HonorCard key={h.id} $status={h.status}>
                      <HonorMes>{fmtMesRef(h.mes_ref)}</HonorMes>
                      <HonorValor>{fmtCurrency(h.valor)}</HonorValor>
                      <HonorStatusTag $status={h.status}>
                        {h.status === 'pago' ? '✓ Pago' : h.status === 'atrasado' ? '⚠ Atrasado' : '⏳ Pendente'}
                      </HonorStatusTag>
                      {h.data_pagamento && (
                        <div style={{ fontSize: 10, opacity: 0.6 }}>Pago em {fmtDate(h.data_pagamento)}</div>
                      )}
                    </HonorCard>
                  ))}
                </HonorGrid>
              </Section>
            )}

            {/* Guias para Pagar */}
            {guias.length > 0 && (
              <Section>
                <SectionHeader>
                  <SectionTitle>Guias para Pagar</SectionTitle>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {guias.filter(g => g.status !== 'paga').length} pendente{guias.filter(g => g.status !== 'paga').length !== 1 ? 's' : ''}
                  </span>
                </SectionHeader>
                <Card>
                  <GuiaPortalList>
                    {guias.map(g => (
                      <GuiaPortalItem key={g.id}>
                        <GuiaTipoTag>{g.tipo}</GuiaTipoTag>
                        <GuiaPortalInfo>
                          <GuiaPortalDesc>{g.descricao || g.tipo}</GuiaPortalDesc>
                          <GuiaPortalMeta>
                            {fmtMesRef(g.mes_ref)}
                            {g.data_vencimento && (
                              <>
                                {' · Vence '}
                                <UrgencyDays $urgency={g.status === 'paga' ? 'ok' : (() => { const d = diffDays(g.data_vencimento!); return d < 0 ? 'atrasado' : d <= 3 ? 'critico' : d <= 7 ? 'urgente' : 'normal' })()}>
                                  {fmtDate(g.data_vencimento)}
                                </UrgencyDays>
                              </>
                            )}
                          </GuiaPortalMeta>
                        </GuiaPortalInfo>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          {g.valor != null && (
                            <GuiaPortalValor $status={g.status}>{fmtCurrency(g.valor)}</GuiaPortalValor>
                          )}
                          <StatusBadge $status={g.status === 'paga' ? 'transmitido' : g.status === 'emitida' ? 'pendente' : 'pendente'}>
                            {g.status === 'paga' ? 'Paga' : g.status === 'emitida' ? 'Emitida' : 'Pendente'}
                          </StatusBadge>
                        </div>
                      </GuiaPortalItem>
                    ))}
                  </GuiaPortalList>
                </Card>
              </Section>
            )}

            {/* Documentos Aguardados */}
            {docs.length > 0 && (
              <Section>
                <SectionHeader>
                  <SectionTitle>Documentos Aguardados</SectionTitle>
                  <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                    {docs.filter(d => d.status === 'aguardando').length} aguardando envio
                  </span>
                </SectionHeader>
                <Card>
                  <DocPortalList>
                    {docs.map(d => (
                      <DocPortalItem key={d.id}>
                        <DocPortalIconWrap $recebido={d.status === 'recebido'}>
                          {d.status === 'recebido' ? <CheckCircle size={16} /> : <Inbox size={16} />}
                        </DocPortalIconWrap>
                        <DocPortalInfo>
                          <DocPortalTipo>{d.tipo_documento}</DocPortalTipo>
                          <DocPortalMeta>
                            {fmtMesRef(d.mes_ref)}
                            {d.observacoes && ` · ${d.observacoes}`}
                          </DocPortalMeta>
                        </DocPortalInfo>
                        <DocPortalStatus $recebido={d.status === 'recebido'}>
                          {d.status === 'recebido' ? '✓ Recebido' : '⏳ Aguardando'}
                        </DocPortalStatus>
                      </DocPortalItem>
                    ))}
                  </DocPortalList>
                </Card>
              </Section>
            )}

            {/* Meus Arquivos */}
            <Section>
              <SectionHeader>
                <SectionTitle>Meus Arquivos</SectionTitle>
              </SectionHeader>
              {arquivos.length === 0 ? (
                <Card style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: undefined }}>
                  <span style={{ color: 'inherit', opacity: 0.5 }}>Nenhum arquivo disponível no momento.</span>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {arquivos.map(a => (
                    <Card key={a.id} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 9, background: '#e8f5ee',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <FileText size={17} color="#007bff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.nome_arquivo}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                          {fmtFileSize(a.size_bytes)} · Enviado em {a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '—'}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadArquivo(a.storage_path, a.nome_arquivo)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                          background: '#007bff', color: '#fff', border: 'none', borderRadius: 8,
                          fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <Download size={13} /> Baixar
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </Section>

            {/* Conciliação Bancária */}
            <Section>
              <SectionHeader>
                <SectionTitle>Conciliação Bancária</SectionTitle>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>{transacoesConciliadas.length} conciliadas</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{transacoesPendentes.length} pendentes</span>
                </div>
              </SectionHeader>

              <TabRow>
                <Tab $active={concilTab === 'todas'} onClick={() => setConcilTab('todas')}>
                  Todas ({transacoes.length})
                </Tab>
                <Tab $active={concilTab === 'conciliadas'} onClick={() => setConcilTab('conciliadas')}>
                  ✓ Conciliadas ({transacoesConciliadas.length})
                </Tab>
                <Tab $active={concilTab === 'pendentes'} onClick={() => setConcilTab('pendentes')}>
                  ⏳ Pendentes ({transacoesPendentes.length})
                </Tab>
              </TabRow>

              <Card>
                {transacoesFiltradas.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', fontSize: 13, opacity: 0.5 }}>
                    {concilTab === 'pendentes'
                      ? 'Nenhuma transação pendente — tudo conciliado!'
                      : concilTab === 'conciliadas'
                      ? 'Nenhuma transação conciliada ainda.'
                      : 'Nenhuma transação bancária encontrada.'}
                  </div>
                ) : (
                  transacoesFiltradas.slice(0, 30).map(t => (
                    <ConcilRow key={t.id} $conciliada={!!t.lancamento_id}>
                      {/* Transação bancária */}
                      <ConcilSide>
                        <ConcilLabel>Transação Bancária</ConcilLabel>
                        <ConcilDesc>{t.descricao || '—'}</ConcilDesc>
                        <ConcilMeta>
                          {fmtDate(t.data_transacao)}
                          {' · '}
                          <TipoBadge $tipo={t.tipo}>{t.tipo === 'credito' ? 'Crédito' : 'Débito'}</TipoBadge>
                          {' · '}
                          <ValorText $tipo={t.tipo}>{fmtCurrency(t.valor)}</ValorText>
                        </ConcilMeta>
                      </ConcilSide>

                      {/* Link badge */}
                      <ConcilLink>
                        {t.lancamento_id ? (
                          <ConcilBadgeConciliada>
                            <Link2 size={10} /> Conciliada
                          </ConcilBadgeConciliada>
                        ) : (
                          <ConcilBadgePendente>
                            <Clock size={10} /> Pendente
                          </ConcilBadgePendente>
                        )}
                      </ConcilLink>

                      {/* Lançamento vinculado */}
                      <ConcilSide style={{ textAlign: 'right', alignItems: 'flex-end' }}>
                        {t.lancamento_id && t.lanc_historico ? (
                          <>
                            <ConcilLabel>Lançamento Contábil</ConcilLabel>
                            <ConcilDesc>{t.lanc_historico}</ConcilDesc>
                            <ConcilMeta>
                              {t.lanc_data ? fmtDate(t.lanc_data) : '—'}
                              {t.lanc_valor != null && (
                                <> · <ValorText $tipo={t.tipo}>{fmtCurrency(t.lanc_valor)}</ValorText></>
                              )}
                              {t.conta_debito && (
                                <> · D: {t.conta_debito}</>
                              )}
                            </ConcilMeta>
                          </>
                        ) : t.lancamento_id ? (
                          <>
                            <ConcilLabel>Lançamento Contábil</ConcilLabel>
                            <ConcilDesc style={{ opacity: 0.5 }}>Lançamento vinculado</ConcilDesc>
                          </>
                        ) : (
                          <ConcilEmpty>
                            <Clock size={14} />
                            Aguardando conciliação pelo escritório
                          </ConcilEmpty>
                        )}
                      </ConcilSide>
                    </ConcilRow>
                  ))
                )}
              </Card>
            </Section>
          </>
        )}
      </Content>

    </Wrapper>
  )
}
