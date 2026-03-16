import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import ReactApexChart from 'react-apexcharts'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  TrendingUp, TrendingDown, Users, AlertCircle, DollarSign,
  ArrowRight, ChevronLeft, ChevronRight, RefreshCw,
  FileText, UserPlus, Layers, ArrowLeftRight,
  Calendar, CheckSquare, Clock, Plus, X, AlertTriangle,
  CheckCircle, Circle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { useTheme } from '../../styles/ThemeProvider'
import type { Cliente, Lancamento, Obrigacao, Tarefa } from '../../types'

// ─── Styled Components ─────────────────────────────────────────────────────────

const Page = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const GreetingBar = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

const GreetLeft = styled.div``

const GreetTitle = styled.h1`
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  letter-spacing: -0.4px;
  line-height: 1.2;
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`

const GreetSub = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.textDim};
  margin-top: 4px;
  font-weight: 400;
`

const RefreshBtn = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  font-size: 12.5px;
  font-weight: 500;
  color: ${({ theme }) => theme.textMid};
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.greenMid};
    color: ${({ theme }) => theme.green};
    background: ${({ theme }) => theme.greenLight};
  }
`

// ─── Ticker ──────────────────────────────────────────────────────────────────

const tickerPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`

const TickerBar = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #fef3c7, #fef9e7);
  border: 1px solid #f59e0b;
  border-radius: ${({ theme }) => theme.radiusSm};
  flex-wrap: wrap;
`

const TickerDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d97706;
  flex-shrink: 0;
  animation: ${tickerPulse} 1.5s ease infinite;
`

const TickerLabel = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #92400e;
  white-space: nowrap;
`

const TickerItems = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
`

const TickerChip = styled.div<{ $urgent: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  background: ${({ $urgent }) => $urgent ? '#fef2f2' : '#fffbeb'};
  color: ${({ $urgent }) => $urgent ? '#b91c1c' : '#92400e'};
  border: 1px solid ${({ $urgent }) => $urgent ? '#fca5a5' : '#fde68a'};
`

const TickerLink = styled.button`
  font-size: 11.5px;
  font-weight: 600;
  color: #d97706;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  margin-left: auto;
  &:hover { text-decoration: underline; }
`

// ─── KPI Grid ─────────────────────────────────────────────────────────────────

const skeletonAnim = keyframes`0%{background-position:-200% 0}100%{background-position:200% 0}`
const SkeletonLine = styled.div<{ $w?: string; $h?: string }>`
  width: ${({ $w }) => $w || '100%'}; height: ${({ $h }) => $h || '14px'};
  border-radius: 6px; margin-bottom: 8px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: ${skeletonAnim} 1.4s ease infinite;
`

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px)  { grid-template-columns: 1fr; }
`

const KpiCard = styled(motion.div)<{ $accent: string }>`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow};
  cursor: default;
  transition: box-shadow 0.25s, border-color 0.25s, transform 0.2s;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: ${({ $accent }) => $accent};
    border-radius: 12px 12px 0 0;
  }
  &:hover {
    box-shadow: ${({ theme }) => theme.shadowMd};
    border-color: ${({ theme }) => theme.border2};
    transform: translateY(-1px);
  }
`

const KpiIcon = styled.div<{ $bg: string }>`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
`

const KpiLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  margin-bottom: 6px;
`

const KpiValue = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -1px;
  line-height: 1;
  color: ${({ theme }) => theme.text};
  margin-bottom: 10px;
`

const KpiDelta = styled.div<{ $up: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ theme, $up }) => $up ? theme.posBg : theme.negBg};
  color: ${({ theme, $up }) => $up ? theme.pos : theme.neg};
`

// ─── Hon Row ──────────────────────────────────────────────────────────────────

const HonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`

const HonCard = styled(motion.div)<{ $variant: 'ok' | 'pend' }>`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 18px 22px;
  box-shadow: ${({ theme }) => theme.shadow};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-left: 4px solid ${({ $variant }) => $variant === 'ok' ? '#059669' : '#f59e0b'};
  transition: box-shadow 0.2s, transform 0.2s;
  &:hover { box-shadow: ${({ theme }) => theme.shadowMd}; transform: translateY(-1px); }
`

const HonInfo = styled.div``
const HonTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  margin-bottom: 6px;
`
const HonValue = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.8px;
  color: ${({ theme }) => theme.text};
  line-height: 1;
  margin-bottom: 4px;
`
const HonSub = styled.div`font-size: 11.5px; color: ${({ theme }) => theme.textDim};`

const HonIconWrap = styled.div<{ $ok: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: ${({ $ok }) => $ok ? '#d1fae5' : '#fef3c7'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

// ─── Charts row ───────────────────────────────────────────────────────────────

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 14px;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  box-shadow: ${({ theme }) => theme.shadow};
  overflow: hidden;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: ${({ theme }) => theme.shadowMd}; }
`

const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  flex-wrap: wrap;
  gap: 8px;
`

const CardTitle = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: -0.2px;
  color: ${({ theme }) => theme.text};
`

const CardSub = styled.div`
  font-size: 11.5px;
  color: ${({ theme }) => theme.textDim};
  margin-top: 2px;
`

const CardLink = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.greenMid};
  cursor: pointer;
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  padding: 5px 10px;
  border-radius: 7px;
  transition: all 0.2s;
  &:hover {
    background: ${({ theme }) => theme.greenLight};
    color: ${({ theme }) => theme.green};
  }
`

const YearPicker = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const YearBtn = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface2};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.textDim};
  transition: all 0.15s;
  &:hover { color: ${({ theme }) => theme.text}; border-color: ${({ theme }) => theme.border2}; }
`

const YearLabel = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  min-width: 38px;
  text-align: center;
`

// ─── Grids ────────────────────────────────────────────────────────────────────

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`

const WideGrid = styled.div`
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 14px;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`

const WideGridRev = styled.div`
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 14px;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`

// ─── DRE ──────────────────────────────────────────────────────────────────────

const DreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  padding: 18px 20px;
  @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); gap: 12px; }
`

const DreItem = styled.div`
  padding: 0 16px;
  border-right: 1px solid ${({ theme }) => theme.border};
  &:first-child { padding-left: 0; }
  &:last-child { border-right: none; }
  @media (max-width: 700px) { padding: 0; border-right: none; border-bottom: 1px solid ${({ theme }) => theme.border}; padding-bottom: 12px; &:last-child { border-bottom: none; padding-bottom: 0; } }
`

const DreLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  margin-bottom: 6px;
`

const DreValue = styled.div<{ $color?: string }>`
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.6px;
  color: ${({ $color, theme }) => $color || theme.text};
  line-height: 1;
  margin-bottom: 4px;
`

const DreSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim};`

// ─── Quick Actions ─────────────────────────────────────────────────────────────

const QaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 14px 16px 16px;
  @media (max-width: 480px) { grid-template-columns: 1fr 1fr; }
`

const QaBtn = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 14px;
  background: ${({ theme }) => theme.surface2};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  cursor: pointer;
  text-align: left;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.greenMid};
    background: ${({ theme }) => theme.greenLight};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadowMd};
  }
`

const QaIconWrap = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`

const QaBtnLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;
`

const QaBtnSub = styled.span`
  font-size: 10.5px;
  color: ${({ theme }) => theme.textDim};
`

// ─── Alerts ───────────────────────────────────────────────────────────────────

const AlertList = styled.div`
  padding: 10px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 7px;
`

const AlertItem = styled(motion.div)<{ $type: 'err' | 'warn' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ theme, $type }) => ({ err: theme.negBg, warn: theme.warnBg, info: theme.infoBg }[$type])};
  color: ${({ theme, $type }) => ({ err: theme.neg, warn: theme.warn, info: theme.info }[$type])};
  border: 1px solid ${({ $type }) => ({
    err: 'rgba(220,38,38,0.15)',
    warn: 'rgba(217,119,6,0.15)',
    info: 'rgba(37,99,235,0.15)',
  }[$type])};
  &:hover { opacity: 0.85; transform: translateX(3px); }
`

const AlertText = styled.div`flex: 1;`
const AlertTitle = styled.div`font-weight: 600;`
const AlertSub = styled.div`font-size: 11px; opacity: 0.75; margin-top: 1px;`
const AlertDate = styled.div`font-size: 11px; font-weight: 500; opacity: 0.8; white-space: nowrap;`

// ─── Fiscal Calendar ──────────────────────────────────────────────────────────

const CalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 320px;
  overflow-y: auto;
`

const CalItem = styled.div<{ $past: boolean; $today: boolean; $urgent: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  opacity: ${({ $past }) => $past ? 0.45 : 1};
  background: ${({ $today, $urgent, theme }) =>
    $today ? theme.greenLight :
    $urgent ? '#fef9e7' : 'transparent'};
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
`

const CalDayBadge = styled.div<{ $cor: string; $past: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $cor, $past }) => $past ? '#e5e7eb' : $cor + '22'};
  border: 1.5px solid ${({ $cor, $past }) => $past ? '#d1d5db' : $cor};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: ${({ $cor, $past }) => $past ? '#9ca3af' : $cor};
  flex-shrink: 0;
`

const CalInfo = styled.div`flex: 1; min-width: 0;`
const CalObrig = styled.div`font-size: 13px; font-weight: 600; color: ${({ theme }) => theme.text};`
const CalDesc = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 1px;`

const CalStatus = styled.div<{ $past: boolean; $today: boolean; $urgent: boolean }>`
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
  background: ${({ $past, $today, $urgent }) =>
    $past ? '#f3f4f6' :
    $today ? '#d1fae5' :
    $urgent ? '#fef3c7' : '#eff6ff'};
  color: ${({ $past, $today, $urgent }) =>
    $past ? '#9ca3af' :
    $today ? '#065f46' :
    $urgent ? '#92400e' : '#1e40af'};
`

// ─── Risk list ────────────────────────────────────────────────────────────────

const RiskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 320px;
  overflow-y: auto;
`

const RiskItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  cursor: default;
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
`

const RiskAvatar = styled.div<{ $bg: string }>`
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
`

const RiskInfo = styled.div`flex: 1; min-width: 0;`
const RiskName = styled.div`font-size: 12.5px; font-weight: 500; color: ${({ theme }) => theme.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
const RiskSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim};`

// ─── Kanban ───────────────────────────────────────────────────────────────────

const KanGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  padding: 14px 16px 16px;
  min-height: 180px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`

const KanCol = styled.div<{ $status: string }>`
  background: ${({ theme }) => theme.surface2};
  border-radius: ${({ theme }) => theme.radiusSm};
  border: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
`

const KanHead = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  background: ${({ $color }) => $color + '18'};
  border-bottom: 1px solid ${({ $color }) => $color + '30'};
`

const KanHeadLabel = styled.div<{ $color: string }>`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  gap: 5px;
`

const KanCount = styled.div<{ $color: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  background: ${({ $color }) => $color + '25'};
  color: ${({ $color }) => $color};
`

const KanCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  flex: 1;
`

const KanCard = styled(motion.div)<{ $prio: string }>`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 9px 11px;
  cursor: pointer;
  border-left: 3px solid ${({ $prio }) =>
    $prio === 'alta' ? '#dc2626' :
    $prio === 'media' ? '#d97706' : '#059669'};
  transition: all 0.15s;
  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }
`

const KanCardTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  line-height: 1.35;
  margin-bottom: 4px;
`

const KanCardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
`

const KanCardClient = styled.div`
  font-size: 10.5px;
  color: ${({ theme }) => theme.textDim};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
`

const KanCardDate = styled.div<{ $overdue: boolean }>`
  font-size: 10px;
  font-weight: 600;
  color: ${({ $overdue }) => $overdue ? '#dc2626' : '#9ca3af'};
  white-space: nowrap;
  flex-shrink: 0;
`

const KanEmpty = styled.div`
  font-size: 11.5px;
  color: ${({ theme }) => theme.textDim};
  text-align: center;
  padding: 16px 8px;
  font-style: italic;
`

const KanAddBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 7px;
  border: 1.5px dashed ${({ theme }) => theme.border};
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.textDim};
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.greenMid}; color: ${({ theme }) => theme.green}; }
`

// ─── Ranking ──────────────────────────────────────────────────────────────────

const RankList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 6px 0;
`

const RankItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  transition: background 0.15s;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
`

const RankPos = styled.div`
  width: 20px;
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.textDim};
  text-align: center;
  flex-shrink: 0;
`

const RankInfo = styled.div`flex: 1; min-width: 0;`
const RankName = styled.div`font-size: 12.5px; font-weight: 500; color: ${({ theme }) => theme.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`

const RankBarWrap = styled.div`
  width: 100px;
  flex-shrink: 0;
`

const RankBarOuter = styled.div`
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.border};
  overflow: hidden;
  margin-bottom: 3px;
`

const RankBarInner = styled.div<{ $w: number; $color: string }>`
  height: 100%;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  width: ${({ $w }) => $w}%;
  transition: width 0.6s ease;
`

const RankValue = styled.div`
  font-size: 11.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: right;
`

// ─── Table ────────────────────────────────────────────────────────────────────

const TableWrap = styled.div`overflow-x: auto;`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Thead = styled.thead`
  th {
    padding: 11px 16px;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
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
    cursor: pointer;
    transition: background 0.15s;
    &:last-child { border-bottom: none; }
    &:hover { background: ${({ theme }) => theme.surface2}; }
  }
  td { padding: 11px 16px; font-size: 12.5px; }
`

const CoCell = styled.div`display: flex; align-items: center; gap: 10px;`

const CoAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
`

const CoName = styled.div`font-weight: 500; color: ${({ theme }) => theme.text};`
const CoCnpj = styled.div`font-size: 10.5px; color: ${({ theme }) => theme.textDim}; margin-top: 1px;`

const Badge = styled.span<{ $type: 'ok' | 'pend' | 'late' | 'info' | 'warn' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
  background: ${({ theme, $type }) => ({
    ok: theme.posBg, pend: theme.warnBg, late: theme.negBg, info: theme.infoBg, warn: theme.warnBg,
  }[$type])};
  color: ${({ theme, $type }) => ({
    ok: theme.pos, pend: theme.warn, late: theme.neg, info: theme.info, warn: theme.warn,
  }[$type])};
  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }
`

// ─── Activity ────────────────────────────────────────────────────────────────

const ActFeed = styled.div``

const ActItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  cursor: default;
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
`

const ActLine = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding-top: 3px;
`

const ActDot = styled.div<{ $pos: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, $pos }) => $pos ? theme.pos : theme.neg};
  flex-shrink: 0;
`

const ActContent = styled.div`flex: 1; min-width: 0;`
const ActLabel = styled.div`font-size: 12.5px; line-height: 1.45; color: ${({ theme }) => theme.text}; font-weight: 500;`
const ActMeta = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`
const ActValue = styled.div<{ $pos: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme, $pos }) => $pos ? theme.pos : theme.neg};
  white-space: nowrap;
`

// ─── Modal ────────────────────────────────────────────────────────────────────

const overlayIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const modalIn = keyframes`from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); }`

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${overlayIn} 0.18s ease;
  @media (max-width: 600px) { align-items: flex-end; padding: 0; }
`

const ModalBox = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;
  animation: ${modalIn} 0.2s ease;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; overflow-y: auto; }
`

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const ModalTitle = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
`

const ModalClose = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.textDim};
  transition: all 0.15s;
  &:hover { color: ${({ theme }) => theme.text}; }
`

const ModalBody = styled.div`padding: 20px;`

const ModalField = styled.div`margin-bottom: 14px;`
const ModalLabel = styled.label`
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  margin-bottom: 6px;
`

const ModalInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: ${({ theme }) => theme.surface2};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
  outline: none;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.2s;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; }
  &::placeholder { color: ${({ theme }) => theme.textDim}; }
`

const ModalSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  background: ${({ theme }) => theme.surface2};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  font-size: 13px;
  color: ${({ theme }) => theme.text};
  outline: none;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; }
`

const ModalRow = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px;`

const ModalFooter = styled.div`
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid ${({ theme }) => theme.border};
`

const ModalCancelBtn = styled.button`
  flex: 0 0 auto;
  padding: 10px 18px;
  border-radius: 9px;
  background: ${({ theme }) => theme.surface2};
  border: 1.5px solid ${({ theme }) => theme.border};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.textMid};
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.border}; }
`

const ModalSaveBtn = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: 9px;
  background: linear-gradient(135deg, #1a7a4a, #0f5233);
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  &:hover { background: linear-gradient(135deg, #22a062, #1a7a4a); }
  &:disabled { opacity: 0.6; pointer-events: none; }
`

// ─── Misc ─────────────────────────────────────────────────────────────────────

const EmptyMsg = styled.div`
  text-align: center;
  padding: 32px 20px;
  font-size: 12.5px;
  color: ${({ theme }) => theme.textDim};
`

const AddTaskBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1a7a4a, #0f5233);
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  &:hover { opacity: 0.88; }
`

// ─── Constants ─────────────────────────────────────────────────────────────────

const avatarColors = [
  'linear-gradient(135deg,#1a5c3a,#059669)',
  'linear-gradient(135deg,#1d4ed8,#7c3aed)',
  'linear-gradient(135deg,#dc2626,#db2777)',
  'linear-gradient(135deg,#d97706,#ea580c)',
  'linear-gradient(135deg,#0891b2,#2563eb)',
]

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// Calendário Fiscal — datas de referência por mês (índice 0=Jan)
const FISCAL_DATES: Record<number, { dia: number; obrig: string; desc: string; cor: string }[]> = {
  0:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS dez.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social dez.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Nov — Declaração de Contribuições', cor: '#2563eb' }, { dia: 31, obrig: 'DIRF', desc: 'Declaração Anual de Rendimentos', cor: '#7c3aed' }],
  1:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS jan.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social jan.', cor: '#059669' }, { dia: 28, obrig: 'DCTF', desc: 'Dez — Declaração de Contribuições', cor: '#2563eb' }],
  2:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS fev.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social fev.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Jan — Declaração de Contribuições', cor: '#2563eb' }, { dia: 31, obrig: 'SPED Fiscal', desc: 'EFD ICMS/IPI — ano anterior', cor: '#7c3aed' }],
  3:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS mar.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social mar.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Fev — Declaração de Contribuições', cor: '#2563eb' }, { dia: 30, obrig: 'eSocial', desc: 'Eventos S-1200 e S-1210', cor: '#0891b2' }],
  4:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS abr.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social abr.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Mar — Declaração de Contribuições', cor: '#2563eb' }, { dia: 31, obrig: 'ECF', desc: 'Escrituração Contábil Fiscal', cor: '#dc2626' }],
  5:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS mai.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social mai.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Abr — Declaração de Contribuições', cor: '#2563eb' }, { dia: 30, obrig: 'GFIP', desc: 'GFIP/SEFIP competência mai.', cor: '#db2777' }],
  6:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS jun.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social jun.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Mai — Declaração de Contribuições', cor: '#2563eb' }, { dia: 31, obrig: 'SPED Contrib.', desc: 'EFD-PIS/COFINS — semestral', cor: '#7c3aed' }],
  7:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS jul.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social jul.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Jun — Declaração de Contribuições', cor: '#2563eb' }, { dia: 31, obrig: 'EFD-Reinf', desc: 'Retenções e Informações Fiscais', cor: '#0891b2' }],
  8:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS ago.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social ago.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Jul — Declaração de Contribuições', cor: '#2563eb' }, { dia: 30, obrig: 'GFIP', desc: 'GFIP/SEFIP competência ago.', cor: '#db2777' }],
  9:  [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS set.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social set.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Ago — Declaração de Contribuições', cor: '#2563eb' }, { dia: 31, obrig: 'SPED Fiscal', desc: 'EFD ICMS/IPI — 2º semestre', cor: '#7c3aed' }],
  10: [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS out.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social out.', cor: '#059669' }, { dia: 25, obrig: 'DCTF', desc: 'Set — Declaração de Contribuições', cor: '#2563eb' }, { dia: 30, obrig: 'eSocial', desc: 'Eventos S-1200 e S-1210 out.', cor: '#0891b2' }],
  11: [{ dia: 7, obrig: 'FGTS', desc: 'Recolhimento FGTS nov.', cor: '#d97706' }, { dia: 20, obrig: 'GPS', desc: 'Previdência Social nov.', cor: '#059669' }, { dia: 20, obrig: 'GFIP', desc: 'GFIP/SEFIP — Caixa Econômica', cor: '#db2777' }, { dia: 23, obrig: 'DCTF', desc: 'Out — Declaração de Contribuições', cor: '#2563eb' }],
}

const rankColors = ['#059669', '#2563eb', '#d97706', '#7c3aed', '#0891b2']

const fade = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

const fmt = (v: number) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
const fmtK = (v: number) => v >= 1000 ? 'R$' + (v / 1000).toFixed(0) + 'k' : 'R$' + v

// ─── Component ─────────────────────────────────────────────────────────────────

const blankTarefa = { titulo: '', prioridade: 'media', data_vencimento: '', cliente_id: '', responsavel: '' }

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, escritorio } = useAuthStore()
  const escId = escritorio?.id
  const { isDark } = useTheme()

  const {
    clientes: storeClientes,
    lancamentos: storeLancamentos,
    obrigacoes: storeObrigacoes,
    colaboradores: storeColaboradores,
    tarefas: storeTarefas,
    preloading,
  } = useDataStore()

  const [year, setYear] = useState(new Date().getFullYear())
  const [showAddTarefa, setShowAddTarefa] = useState(false)
  const [novaT, setNovaT] = useState({ ...blankTarefa })
  const [savingTarefa, setSavingTarefa] = useState(false)

  // Dados reativos vindos do store — sem fetch próprio
  const clientesAll = storeClientes as Cliente[]
  const tarefas     = storeTarefas as Tarefa[]
  const loading     = preloading && storeClientes.length === 0

  const refreshData = useCallback(() => {
    if (!escId) return
    useDataStore.getState().invalidate()
    useDataStore.getState().preload(escId)
  }, [escId])

  // KPIs
  const kpis = useMemo(() => ({
    receita:   clientesAll.reduce((s, c) => s + (Number((c as any).honorarios) || 0), 0),
    clientes:  clientesAll.length,
    pendentes: clientesAll.filter((c: any) => c.situacao === 'pendente').length,
    folha:     storeColaboradores.reduce((s: number, c: any) => s + (Number(c.salario_bruto) || 0), 0),
  }), [clientesAll, storeColaboradores])

  // Lançamentos do ano filtrados client-side
  const lancAno = useMemo(() =>
    storeLancamentos.filter((l: any) => l.data_lanc && new Date(l.data_lanc + 'T00:00:00').getFullYear() === year),
    [storeLancamentos, year]
  )

  const recArr = useMemo(() => {
    const arr = Array(12).fill(0)
    lancAno.forEach((l: any) => { if (l.tipo === 'credito') arr[new Date(l.data_lanc + 'T00:00:00').getMonth()] += Number(l.valor) || 0 })
    return arr.map((v: number) => +v.toFixed(2))
  }, [lancAno])

  const despArr = useMemo(() => {
    const arr = Array(12).fill(0)
    lancAno.forEach((l: any) => { if (l.tipo === 'debito') arr[new Date(l.data_lanc + 'T00:00:00').getMonth()] += Number(l.valor) || 0 })
    return arr.map((v: number) => +v.toFixed(2))
  }, [lancAno])

  const alertas   = useMemo(() => storeObrigacoes.filter((o: any) => o.status === 'pendente' || o.status === 'atrasado').slice(0, 10) as unknown as Obrigacao[], [storeObrigacoes])
  const atividade = useMemo(() => storeLancamentos.slice(0, 6) as unknown as Lancamento[], [storeLancamentos])
  const clientes  = useMemo(() => clientesAll.slice(0, 5), [clientesAll])

  const regimes = useMemo(() => {
    let real = 0, simples = 0, presumido = 0
    clientesAll.forEach((c: any) => {
      const r = (c.regime || '').toLowerCase()
      if (r.includes('real')) real++
      else if (r.includes('presumido')) presumido++
      else simples++
    })
    return [real, simples, presumido]
  }, [clientesAll])

  // ── Tarefas CRUD ─────────────────────────────────────────────────────────────
  async function addTarefa() {
    if (!novaT.titulo.trim() || !escId) return
    setSavingTarefa(true)
    try {
      const { error } = await supabase.from('tarefas').insert({
        escritorio_id: escId,
        titulo: novaT.titulo.trim(),
        prioridade: novaT.prioridade,
        status: 'aberta',
        cliente_id: novaT.cliente_id || null,
        data_vencimento: novaT.data_vencimento || null,
        responsavel: novaT.responsavel || null,
      })
      if (error) { toast.error('Erro ao salvar tarefa'); return }
      toast.success('Tarefa criada!')
      setShowAddTarefa(false)
      setNovaT({ ...blankTarefa })
      // Realtime atualiza o store automaticamente
    } finally {
      setSavingTarefa(false)
    }
  }

  async function updateTarefaStatus(id: string, status: Tarefa['status']) {
    // Optimistic update no store
    useDataStore.getState().setTarefas(storeTarefas.map((t: any) => t.id === id ? { ...t, status } : t))
    await supabase.from('tarefas').update({ status }).eq('id', id).eq('escritorio_id', escId!)
  }

  async function deleteTarefa(id: string) {
    // Optimistic update no store
    useDataStore.getState().setTarefas(storeTarefas.filter((t: any) => t.id !== id))
    await supabase.from('tarefas').delete().eq('id', id).eq('escritorio_id', escId!)
  }

  // ── Greeting ────────────────────────────────────────────────────────────────
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const name = user?.user_metadata?.nome_completo?.split(' ')[0] || 'Contador'
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)

  // ── Chart config ────────────────────────────────────────────────────────────
  const chartText = isDark ? '#5c6478' : '#9ca3af'
  const chartGrid = isDark ? '#252a3a' : '#f3f4f6'

  const barOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { type: 'bar', height: 200, toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif', animations: { enabled: true, speed: 600 } },
    plotOptions: { bar: { columnWidth: '52%', borderRadius: 5, borderRadiusApplication: 'end' } },
    colors: ['#059669', '#f87171'],
    dataLabels: { enabled: false },
    series: [{ name: 'Receitas', data: recArr }, { name: 'Despesas', data: despArr }],
    xaxis: { categories: MONTHS, labels: { style: { fontSize: '10px', colors: chartText } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: fmtK, style: { fontSize: '10px', colors: chartText } } },
    grid: { borderColor: chartGrid, strokeDashArray: 4, padding: { left: 4, right: 4 } },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px', labels: { colors: [chartText] }, markers: { size: 5 } },
    tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (v: number) => fmt(v) } },
    theme: { mode: isDark ? 'dark' : 'light' },
  }), [recArr, despArr, chartText, chartGrid, isDark])

  const totalReg = useMemo(() => regimes.reduce((a, b) => a + b, 0), [regimes])
  const donutOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { type: 'donut', height: 200, toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif' },
    series: totalReg > 0 ? regimes : [1, 1, 1],
    labels: ['Lucro Real', 'Simples Nac.', 'L. Presumido'],
    colors: ['#059669', '#2563eb', '#d97706'],
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '11px', labels: { colors: [chartText] }, markers: { size: 5 } },
    plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: totalReg > 0 ? 'Clientes' : 'Sem dados', fontSize: '11px', color: chartText, formatter: () => String(totalReg > 0 ? totalReg : 0) } } } } },
    stroke: { width: 2, colors: [isDark ? '#171923' : '#ffffff'] },
    tooltip: { theme: isDark ? 'dark' : 'light' },
    theme: { mode: isDark ? 'dark' : 'light' },
  }), [regimes, totalReg, chartText, isDark])

  // ── Computed ────────────────────────────────────────────────────────────────
  const currentMonth = new Date().getMonth()

  const dreData = useMemo(() => {
    const recMes = recArr[currentMonth]
    const despMes = despArr[currentMonth]
    const recAno = recArr.reduce((a, b) => a + b, 0)
    const despAno = despArr.reduce((a, b) => a + b, 0)
    return {
      recMes, despMes,
      resultadoMes: recMes - despMes,
      recAno, despAno,
      resultadoAno: recAno - despAno,
      margem: recMes > 0 ? ((recMes - despMes) / recMes) * 100 : 0,
    }
  }, [recArr, despArr, currentMonth])

  const honData = useMemo(() => {
    const recebido  = clientesAll.filter(c => c.situacao === 'em_dia').reduce((s, c) => s + (c.honorarios || 0), 0)
    const pendente  = clientesAll.filter(c => c.situacao !== 'em_dia').reduce((s, c) => s + (c.honorarios || 0), 0)
    const nRec  = clientesAll.filter(c => c.situacao === 'em_dia').length
    const nPend = clientesAll.filter(c => c.situacao !== 'em_dia').length
    return { recebido, pendente, nRec, nPend }
  }, [clientesAll])

  const clientesRisco = useMemo(() =>
    clientesAll.filter(c => c.situacao !== 'em_dia').slice(0, 8)
  , [clientesAll])

  const rankingClientes = useMemo(() =>
    [...clientesAll]
      .filter(c => c.honorarios && c.honorarios > 0)
      .sort((a, b) => (b.honorarios || 0) - (a.honorarios || 0))
      .slice(0, 7)
  , [clientesAll])

  const maxHon = useMemo(() =>
    rankingClientes.reduce((m, c) => Math.max(m, c.honorarios || 0), 1)
  , [rankingClientes])

  const proximosVenc = useMemo(() => {
    const todayDate = new Date()
    return alertas.filter(a => {
      if (!a.vencimento) return false
      const d = differenceInDays(new Date(a.vencimento + 'T00:00:00'), todayDate)
      return d >= -1 && d <= 7
    })
  }, [alertas])

  const calFiscalMes = useMemo(() => {
    const hoje = new Date().getDate()
    return (FISCAL_DATES[currentMonth] || []).map(f => ({
      ...f,
      passado: f.dia < hoje,
      hoje: f.dia === hoje,
      urgente: !f.dia || (f.dia - hoje <= 3 && f.dia >= hoje),
      diasRestantes: f.dia - hoje,
    }))
  }, [currentMonth])

  const kanbanCols: { key: Tarefa['status']; label: string; color: string; icon: React.ReactNode }[] = [
    { key: 'aberta',       label: 'Aberta',       color: '#6b7280', icon: <Circle size={10} /> },
    { key: 'em_andamento', label: 'Em Andamento',  color: '#d97706', icon: <Clock size={10} /> },
    { key: 'concluida',    label: 'Concluída',     color: '#059669', icon: <CheckCircle size={10} /> },
  ]

  const quickActions = [
    { icon: <FileText size={15} />, label: 'SPED Fiscal', sub: 'Gerar arquivo', color: '#059669', path: '/app/relatorios' },
    { icon: <FileText size={15} />, label: 'DCTF', sub: 'Transmitir', color: '#2563eb', path: '/app/relatorios' },
    { icon: <Users size={15} />, label: 'Folha', sub: 'Processar mês', color: '#7c3aed', path: '/app/folha' },
    { icon: <ArrowLeftRight size={15} />, label: 'Conciliação', sub: 'Importar OFX', color: '#0891b2', path: '/app/conciliacao' },
    { icon: <Layers size={15} />, label: 'Balanço', sub: 'Gerar relatório', color: '#d97706', path: '/app/relatorios' },
    { icon: <UserPlus size={15} />, label: 'Novo Cliente', sub: 'Cadastrar', color: '#dc2626', path: '/app/clientes' },
  ]

  return (
    <Page variants={fade} initial="hidden" animate="visible">


      {/* Greeting */}
      <GreetingBar variants={item}>
        <GreetLeft>
          <GreetTitle>{greet}, <em>{name}</em>.</GreetTitle>
          <GreetSub>{todayCap}</GreetSub>
        </GreetLeft>
        <RefreshBtn onClick={refreshData} whileTap={{ scale: 0.95 }} disabled={loading} title="Atualizar">
          <RefreshCw size={13} style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s' }} />
          Atualizar
        </RefreshBtn>
      </GreetingBar>

      {/* Ticker — vencimentos urgentes */}
      {proximosVenc.length > 0 && (
        <motion.div variants={item}>
          <TickerBar initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <TickerDot />
            <TickerLabel>VENCIMENTOS PRÓXIMOS</TickerLabel>
            <TickerItems>
              {proximosVenc.map((a, i) => {
                const d = differenceInDays(new Date(a.vencimento + 'T00:00:00'), new Date())
                const label = d < 0 ? 'Atrasado' : d === 0 ? 'Hoje!' : `${d}d`
                return (
                  <TickerChip key={i} $urgent={d <= 1}>
                    <AlertTriangle size={10} />
                    {a.tipo} · {label}
                  </TickerChip>
                )
              })}
            </TickerItems>
            <TickerLink onClick={() => navigate('/app/obrigacoes')}>Ver obrigações →</TickerLink>
          </TickerBar>
        </motion.div>
      )}

      {/* KPIs */}
      <motion.div variants={item}>
        <KpiGrid>
          {loading ? Array(4).fill(0).map((_, i) => (
            <KpiCard key={i} $accent="linear-gradient(90deg,#e5e7eb,#f3f4f6)" variants={item}>
              <SkeletonLine $w="36px" $h="36px" style={{ borderRadius: 10, marginBottom: 14 }} />
              <SkeletonLine $w="60%" $h="11px" />
              <SkeletonLine $w="40%" $h="28px" />
              <SkeletonLine $w="50%" $h="11px" style={{ marginBottom: 0 }} />
            </KpiCard>
          )) : [
            { label: 'Receita Mensal', value: fmt(kpis.receita), delta: '+0%', up: true, accent: 'linear-gradient(90deg,#059669,#34d399)', iconBg: '#d1fae5', icon: <DollarSign size={17} color="#059669" /> },
            { label: 'Clientes Ativos', value: String(kpis.clientes), delta: `${kpis.clientes} total`, up: true, accent: 'linear-gradient(90deg,#2563eb,#60a5fa)', iconBg: '#dbeafe', icon: <Users size={17} color="#2563eb" /> },
            { label: 'Pendências', value: String(kpis.pendentes), delta: kpis.pendentes === 0 ? 'Tudo ok' : `${kpis.pendentes} pendente${kpis.pendentes > 1 ? 's' : ''}`, up: kpis.pendentes === 0, accent: kpis.pendentes > 0 ? 'linear-gradient(90deg,#dc2626,#f87171)' : 'linear-gradient(90deg,#059669,#34d399)', iconBg: kpis.pendentes > 0 ? '#fee2e2' : '#d1fae5', icon: <AlertCircle size={17} color={kpis.pendentes > 0 ? '#dc2626' : '#059669'} /> },
            { label: 'Total Folha', value: fmt(kpis.folha), delta: 'colaboradores', up: true, accent: 'linear-gradient(90deg,#7c3aed,#a78bfa)', iconBg: '#ede9fe', icon: <TrendingUp size={17} color="#7c3aed" /> },
          ].map((kpi, i) => (
            <KpiCard key={i} $accent={kpi.accent} variants={item} whileHover={{ y: -2 }}>
              <KpiIcon $bg={kpi.iconBg}>{kpi.icon}</KpiIcon>
              <KpiLabel>{kpi.label}</KpiLabel>
              <KpiValue>{kpi.value}</KpiValue>
              <KpiDelta $up={kpi.up}>
                {kpi.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {kpi.delta}
              </KpiDelta>
            </KpiCard>
          ))}
        </KpiGrid>
      </motion.div>

      {/* Honorários */}
      <motion.div variants={item}>
        <HonRow>
          <HonCard $variant="ok" whileHover={{ y: -2 }}>
            <HonInfo>
              <HonTitle>Honorários Recebidos</HonTitle>
              <HonValue>{fmt(honData.recebido)}</HonValue>
              <HonSub>{honData.nRec} cliente{honData.nRec !== 1 ? 's' : ''} em dia</HonSub>
            </HonInfo>
            <HonIconWrap $ok={true}>
              <CheckCircle size={22} color="#059669" />
            </HonIconWrap>
          </HonCard>
          <HonCard $variant="pend" whileHover={{ y: -2 }}>
            <HonInfo>
              <HonTitle>Honorários Pendentes</HonTitle>
              <HonValue>{fmt(honData.pendente)}</HonValue>
              <HonSub>{honData.nPend} cliente{honData.nPend !== 1 ? 's' : ''} pendente{honData.nPend !== 1 ? 's' : ''}</HonSub>
            </HonInfo>
            <HonIconWrap $ok={false}>
              <AlertCircle size={22} color="#d97706" />
            </HonIconWrap>
          </HonCard>
        </HonRow>
      </motion.div>

      {/* Charts */}
      <motion.div variants={item}>
        <ChartsRow>
          <Card>
            <CardHead>
              <div>
                <CardTitle>Receitas × Despesas</CardTitle>
                <CardSub>Comparativo mensal por tipo de lançamento</CardSub>
              </div>
              <YearPicker>
                <YearBtn onClick={() => setYear(y => y - 1)}><ChevronLeft size={12} /></YearBtn>
                <YearLabel>{year}</YearLabel>
                <YearBtn onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()}>
                  <ChevronRight size={12} />
                </YearBtn>
              </YearPicker>
            </CardHead>
            <div style={{ padding: '12px 8px 4px' }}>
              <ReactApexChart options={barOptions} series={barOptions.series as any[]} type="bar" height={200} />
            </div>
          </Card>

          <Card>
            <CardHead>
              <div>
                <CardTitle>Regime Tributário</CardTitle>
                <CardSub>Distribuição da carteira</CardSub>
              </div>
            </CardHead>
            <div style={{ padding: '12px 8px 4px' }}>
              <ReactApexChart options={donutOptions} series={donutOptions.series as any[]} type="donut" height={200} />
            </div>
          </Card>
        </ChartsRow>
      </motion.div>

      {/* DRE Resumido */}
      <motion.div variants={item}>
        <Card>
          <CardHead>
            <div>
              <CardTitle>DRE — Escritório</CardTitle>
              <CardSub>Resultado de {MONTHS[currentMonth]} × acumulado {year}</CardSub>
            </div>
          </CardHead>
          <DreGrid>
            <DreItem>
              <DreLabel>Receitas do Mês</DreLabel>
              <DreValue $color="#059669">{fmt(dreData.recMes)}</DreValue>
              <DreSub>Ano: {fmt(dreData.recAno)}</DreSub>
            </DreItem>
            <DreItem>
              <DreLabel>Despesas do Mês</DreLabel>
              <DreValue $color="#dc2626">{fmt(dreData.despMes)}</DreValue>
              <DreSub>Ano: {fmt(dreData.despAno)}</DreSub>
            </DreItem>
            <DreItem>
              <DreLabel>Resultado do Mês</DreLabel>
              <DreValue $color={dreData.resultadoMes >= 0 ? '#059669' : '#dc2626'}>
                {fmt(dreData.resultadoMes)}
              </DreValue>
              <DreSub>Ano: {fmt(dreData.resultadoAno)}</DreSub>
            </DreItem>
            <DreItem>
              <DreLabel>Margem Operacional</DreLabel>
              <DreValue $color={dreData.margem >= 0 ? '#059669' : '#dc2626'}>
                {dreData.margem.toFixed(1)}%
              </DreValue>
              <DreSub>Receitas − Despesas / Receitas</DreSub>
            </DreItem>
          </DreGrid>
        </Card>
      </motion.div>

      {/* Quick Actions + Alertas */}
      <motion.div variants={item}>
        <MainGrid>
          <Card>
            <CardHead>
              <div>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardSub>Acesso direto às tarefas frequentes</CardSub>
              </div>
            </CardHead>
            <QaGrid>
              {quickActions.map((a, i) => (
                <QaBtn key={i} onClick={() => navigate(a.path)} whileTap={{ scale: 0.96 }}>
                  <QaIconWrap $color={a.color}>{a.icon}</QaIconWrap>
                  <QaBtnLabel>{a.label}</QaBtnLabel>
                  <QaBtnSub>{a.sub}</QaBtnSub>
                </QaBtn>
              ))}
            </QaGrid>
          </Card>

          <Card>
            <CardHead>
              <div>
                <CardTitle>Alertas</CardTitle>
                <CardSub>Obrigações pendentes e atrasadas</CardSub>
              </div>
              {alertas.length > 0 && (
                <CardLink onClick={() => navigate('/app/obrigacoes')}>
                  Ver todas <ArrowRight size={11} />
                </CardLink>
              )}
            </CardHead>
            <AlertList>
              {alertas.length === 0 ? (
                <EmptyMsg>✓ Nenhum alerta pendente</EmptyMsg>
              ) : (
                alertas.map((a, i) => (
                  <AlertItem key={i} $type={a.status === 'atrasado' ? 'err' : 'warn'} onClick={() => navigate('/app/obrigacoes')} variants={item}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <AlertText>
                      <AlertTitle>{a.tipo}</AlertTitle>
                      <AlertSub>{(a as any).clientes?.razao_social || 'Sem cliente'}</AlertSub>
                    </AlertText>
                    <AlertDate>{a.vencimento ? format(new Date(a.vencimento), 'dd/MM') : '—'}</AlertDate>
                  </AlertItem>
                ))
              )}
            </AlertList>
          </Card>
        </MainGrid>
      </motion.div>

      {/* Calendário Fiscal + Clientes em Risco */}
      <motion.div variants={item}>
        <MainGrid>
          <Card>
            <CardHead>
              <div>
                <CardTitle>Calendário Fiscal</CardTitle>
                <CardSub>Obrigações de referência — {MONTHS[currentMonth]}/{year}</CardSub>
              </div>
              <Calendar size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
            </CardHead>
            <CalList>
              {calFiscalMes.map((f, i) => (
                <CalItem key={i} $past={f.passado} $today={f.hoje} $urgent={f.urgente}>
                  <CalDayBadge $cor={f.cor} $past={f.passado}>{f.dia}</CalDayBadge>
                  <CalInfo>
                    <CalObrig>{f.obrig}</CalObrig>
                    <CalDesc>{f.desc}</CalDesc>
                  </CalInfo>
                  <CalStatus $past={f.passado} $today={f.hoje} $urgent={f.urgente}>
                    {f.passado ? 'Passou' : f.hoje ? 'Hoje' : `${f.diasRestantes}d`}
                  </CalStatus>
                </CalItem>
              ))}
              {calFiscalMes.length === 0 && <EmptyMsg>Sem datas cadastradas</EmptyMsg>}
            </CalList>
          </Card>

          <Card>
            <CardHead>
              <div>
                <CardTitle>Clientes em Risco</CardTitle>
                <CardSub>Pendências e honorários em aberto</CardSub>
              </div>
              {clientesRisco.length > 0 && (
                <CardLink onClick={() => navigate('/app/clientes')}>
                  Ver todos <ArrowRight size={11} />
                </CardLink>
              )}
            </CardHead>
            {clientesRisco.length === 0 ? (
              <EmptyMsg>✓ Todos os clientes em dia</EmptyMsg>
            ) : (
              <RiskList>
                {clientesRisco.map((c, i) => {
                  const ini = (c.razao_social || '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                  const bt: 'pend' | 'late' = c.situacao === 'pendente' ? 'pend' : 'late'
                  const bl = c.situacao === 'pendente' ? 'Pendente' : 'Atrasado'
                  return (
                    <RiskItem key={c.id}>
                      <RiskAvatar $bg={avatarColors[i % avatarColors.length]}>{ini}</RiskAvatar>
                      <RiskInfo>
                        <RiskName>{c.razao_social}</RiskName>
                        <RiskSub>{c.regime || '—'}</RiskSub>
                      </RiskInfo>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <Badge $type={bt}>{bl}</Badge>
                        {c.honorarios ? <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706' }}>{fmt(c.honorarios)}</span> : null}
                      </div>
                    </RiskItem>
                  )
                })}
              </RiskList>
            )}
          </Card>
        </MainGrid>
      </motion.div>

      {/* Tarefas Kanban */}
      <motion.div variants={item}>
        <Card>
          <CardHead>
            <div>
              <CardTitle>Gestão de Tarefas</CardTitle>
              <CardSub>Organize o trabalho da equipe por cliente</CardSub>
            </div>
            <AddTaskBtn onClick={() => setShowAddTarefa(true)}>
              <Plus size={13} /> Nova Tarefa
            </AddTaskBtn>
          </CardHead>
          {(
            <KanGrid>
              {kanbanCols.map(col => {
                const cards = tarefas.filter(t => t.status === col.key)
                const nextStatus: Tarefa['status'][] = col.key === 'aberta' ? ['em_andamento', 'concluida'] : col.key === 'em_andamento' ? ['concluida', 'aberta'] : ['aberta', 'em_andamento']
                return (
                  <KanCol key={col.key} $status={col.key}>
                    <KanHead $color={col.color}>
                      <KanHeadLabel $color={col.color}>{col.icon}{col.label}</KanHeadLabel>
                      <KanCount $color={col.color}>{cards.length}</KanCount>
                    </KanHead>
                    <KanCards>
                      {cards.length === 0 ? (
                        <KanEmpty>Sem tarefas</KanEmpty>
                      ) : (
                        cards.map(t => {
                          const isOverdue = !!t.data_vencimento && differenceInDays(new Date(t.data_vencimento + 'T00:00:00'), new Date()) < 0
                          return (
                            <KanCard key={t.id} $prio={t.prioridade} whileHover={{ y: -1 }}
                              onClick={() => updateTarefaStatus(t.id, nextStatus[0])}>
                              <KanCardTitle>{t.titulo}</KanCardTitle>
                              <KanCardMeta>
                                <KanCardClient title={(t.clientes as any)?.razao_social}>
                                  {(t.clientes as any)?.razao_social || t.responsavel || '—'}
                                </KanCardClient>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {t.data_vencimento && (
                                    <KanCardDate $overdue={isOverdue}>
                                      {format(new Date(t.data_vencimento + 'T00:00:00'), 'dd/MM')}
                                    </KanCardDate>
                                  )}
                                  <button onClick={e => { e.stopPropagation(); deleteTarefa(t.id) }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}>
                                    <X size={11} />
                                  </button>
                                </div>
                              </KanCardMeta>
                            </KanCard>
                          )
                        })
                      )}
                      {col.key === 'aberta' && (
                        <KanAddBtn onClick={() => setShowAddTarefa(true)}>
                          <Plus size={11} /> Adicionar
                        </KanAddBtn>
                      )}
                    </KanCards>
                  </KanCol>
                )
              })}
            </KanGrid>
          )}
        </Card>
      </motion.div>

      {/* Ranking de Clientes + Atividade */}
      <motion.div variants={item}>
        <WideGrid>
          <Card>
            <CardHead>
              <div>
                <CardTitle>Ranking de Clientes</CardTitle>
                <CardSub>Top clientes por honorários mensais</CardSub>
              </div>
            </CardHead>
            {rankingClientes.length === 0 ? (
              <EmptyMsg>Nenhum cliente com honorários cadastrados</EmptyMsg>
            ) : (
              <RankList>
                {rankingClientes.map((c, i) => (
                  <RankItem key={c.id} onClick={() => navigate('/app/clientes')} style={{ cursor: 'pointer' }}>
                    <RankPos>#{i + 1}</RankPos>
                    <RankInfo>
                      <RankName>{c.razao_social}</RankName>
                    </RankInfo>
                    <RankBarWrap>
                      <RankBarOuter>
                        <RankBarInner $w={Math.round(((c.honorarios || 0) / maxHon) * 100)} $color={rankColors[i % rankColors.length]} />
                      </RankBarOuter>
                      <RankValue>{fmt(c.honorarios || 0)}</RankValue>
                    </RankBarWrap>
                  </RankItem>
                ))}
              </RankList>
            )}
          </Card>

          <Card>
            <CardHead>
              <div>
                <CardTitle>Atividade Recente</CardTitle>
                <CardSub>Últimos lançamentos registrados</CardSub>
              </div>
              <CardLink onClick={() => navigate('/app/lancamentos')}>
                Ver todos <ArrowRight size={11} />
              </CardLink>
            </CardHead>
            <ActFeed>
              {atividade.length === 0 ? (
                <EmptyMsg>Nenhuma atividade registrada</EmptyMsg>
              ) : (
                atividade.map((a, i) => (
                  <ActItem key={i}>
                    <ActLine><ActDot $pos={a.tipo === 'credito'} /></ActLine>
                    <ActContent>
                      <ActLabel>{a.historico}</ActLabel>
                      <ActMeta>
                        {(a as any).clientes?.razao_social ? `${(a as any).clientes.razao_social} · ` : ''}
                        {a.data_lanc ? format(new Date(a.data_lanc), "dd 'de' MMM", { locale: ptBR }) : '—'}
                      </ActMeta>
                    </ActContent>
                    <ActValue $pos={a.tipo === 'credito'}>{fmt(a.valor)}</ActValue>
                  </ActItem>
                ))
              )}
            </ActFeed>
          </Card>
        </WideGrid>
      </motion.div>

      {/* Clientes Recentes */}
      <motion.div variants={item}>
        <Card>
          <CardHead>
            <div>
              <CardTitle>Clientes Recentes</CardTitle>
              <CardSub>Últimos cadastros e atualizações</CardSub>
            </div>
            <CardLink onClick={() => navigate('/app/clientes')}>
              Ver todos <ArrowRight size={11} />
            </CardLink>
          </CardHead>
          <TableWrap>
            <Table>
              <Thead>
                <tr>
                  <th>Cliente</th>
                  <th>Regime</th>
                  <th>Situação</th>
                  <th>Honorários</th>
                </tr>
              </Thead>
              <Tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan={4}><EmptyMsg>Nenhum cliente cadastrado</EmptyMsg></td></tr>
                ) : (
                  clientes.map((c, i) => {
                    const ini = (c.razao_social || '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                    const bt: 'ok' | 'pend' | 'late' = c.situacao === 'em_dia' ? 'ok' : c.situacao === 'pendente' ? 'pend' : 'late'
                    const bl = c.situacao === 'em_dia' ? 'Em dia' : c.situacao === 'pendente' ? 'Pendente' : 'Atrasado'
                    return (
                      <tr key={c.id} onClick={() => navigate('/app/clientes')}>
                        <td>
                          <CoCell>
                            <CoAvatar style={{ background: avatarColors[i % avatarColors.length] }}>{ini}</CoAvatar>
                            <div>
                              <CoName>{c.razao_social}</CoName>
                              <CoCnpj>{c.cnpj || '—'}</CoCnpj>
                            </div>
                          </CoCell>
                        </td>
                        <td><Badge $type="info">{c.regime || '—'}</Badge></td>
                        <td><Badge $type={bt}>{bl}</Badge></td>
                        <td style={{ fontWeight: 600 }}>{c.honorarios ? fmt(c.honorarios) : '—'}</td>
                      </tr>
                    )
                  })
                )}
              </Tbody>
            </Table>
          </TableWrap>
        </Card>
      </motion.div>

      {/* Modal — Nova Tarefa */}
      {showAddTarefa && (
          <ModalOverlay
            onClick={e => { if (e.target === e.currentTarget) setShowAddTarefa(false) }}>
            <ModalBox>
              <ModalHead>
                <ModalTitle>Nova Tarefa</ModalTitle>
                <ModalClose onClick={() => setShowAddTarefa(false)}><X size={14} /></ModalClose>
              </ModalHead>
              <ModalBody>
                <ModalField>
                  <ModalLabel>Título *</ModalLabel>
                  <ModalInput
                    placeholder="Ex: Entregar DCTF para cliente ABC"
                    value={novaT.titulo}
                    onChange={e => setNovaT(p => ({ ...p, titulo: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addTarefa()}
                    autoFocus
                  />
                </ModalField>
                <ModalRow>
                  <ModalField>
                    <ModalLabel>Prioridade</ModalLabel>
                    <ModalSelect value={novaT.prioridade} onChange={e => setNovaT(p => ({ ...p, prioridade: e.target.value }))}>
                      <option value="baixa">🟢 Baixa</option>
                      <option value="media">🟡 Média</option>
                      <option value="alta">🔴 Alta</option>
                    </ModalSelect>
                  </ModalField>
                  <ModalField>
                    <ModalLabel>Vencimento</ModalLabel>
                    <ModalInput type="date" value={novaT.data_vencimento} onChange={e => setNovaT(p => ({ ...p, data_vencimento: e.target.value }))} />
                  </ModalField>
                </ModalRow>
                <ModalRow>
                  <ModalField>
                    <ModalLabel>Cliente (opcional)</ModalLabel>
                    <ModalSelect value={novaT.cliente_id} onChange={e => setNovaT(p => ({ ...p, cliente_id: e.target.value }))}>
                      <option value="">— Sem cliente —</option>
                      {clientesAll.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                    </ModalSelect>
                  </ModalField>
                  <ModalField>
                    <ModalLabel>Responsável</ModalLabel>
                    <ModalInput placeholder="Nome do responsável" value={novaT.responsavel} onChange={e => setNovaT(p => ({ ...p, responsavel: e.target.value }))} />
                  </ModalField>
                </ModalRow>
              </ModalBody>
              <ModalFooter>
                <ModalCancelBtn onClick={() => setShowAddTarefa(false)}>Cancelar</ModalCancelBtn>
                <ModalSaveBtn onClick={addTarefa} disabled={savingTarefa || !novaT.titulo.trim()}>
                  {savingTarefa ? 'Salvando...' : 'Criar Tarefa'}
                </ModalSaveBtn>
              </ModalFooter>
            </ModalBox>
          </ModalOverlay>
        )}

    </Page>
  )
}
