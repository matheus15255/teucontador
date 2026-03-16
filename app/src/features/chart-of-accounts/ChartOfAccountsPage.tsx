import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import {
  Plus, Search, X, ChevronRight, Edit2, Trash2, Eye,
  Download, Upload, FileText, ToggleLeft, ToggleRight
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import type { ContaPlano } from '../../types'

// ─── Styled Components ────────────────────────────────────────────────────────

const PageHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
`
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
  transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.greenMid}; color: ${({ theme }) => theme.green}; }
`

const Toolbar = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;
`
const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 8px 13px; width: 280px;
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

const CodeCell = styled.div<{ $sintetica?: boolean }>`
  font-family: 'Playfair Display', serif; font-size: 15px;
  color: ${({ theme }) => theme.text}; opacity: ${({ $sintetica }) => $sintetica ? 0.55 : 1};
`

const GrupoBadge = styled.span<{ $grupo: string }>`
  display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 20px;
  font-size: 10.5px; font-weight: 600;
  background: ${({ theme, $grupo }) => ({
    Ativo: theme.infoBg, Passivo: theme.negBg, 'Patrimônio': theme.goldBg,
    Receita: theme.posBg, Despesa: theme.warnBg,
  }[$grupo] || theme.surface2)};
  color: ${({ theme, $grupo }) => ({
    Ativo: theme.info, Passivo: theme.neg, 'Patrimônio': theme.gold,
    Receita: theme.pos, Despesa: theme.warn,
  }[$grupo] || theme.textDim)};
`
const TipoBadge = styled.span<{ $analitica?: boolean }>`
  display: inline-flex; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;
  background: ${({ theme, $analitica }) => $analitica ? theme.greenLight : theme.surface2};
  color: ${({ theme, $analitica }) => $analitica ? theme.green : theme.textDim};
`
const NaturezaBadge = styled.span<{ $devedora?: boolean }>`
  display: inline-flex; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;
  background: ${({ theme, $devedora }) => $devedora ? theme.infoBg : theme.posBg};
  color: ${({ theme, $devedora }) => $devedora ? theme.info : theme.pos};
`
const InativaBadge = styled.span`
  display: inline-flex; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;
  background: ${({ theme }) => theme.surface2}; color: ${({ theme }) => theme.textDim};
`

const ActionRow = styled.div`display: flex; gap: 4px;`
const ActBtn = styled.button`
  width: 28px; height: 28px; border-radius: 7px; background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border}; display: flex; align-items: center;
  justify-content: center; cursor: pointer; color: ${({ theme }) => theme.textDim}; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green}; border-color: rgba(26,122,74,0.2); }
`

const EmptyState = styled.div`text-align: center; padding: 60px 20px; color: ${({ theme }) => theme.textDim};`
const EmptyTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 20px; color: ${({ theme }) => theme.text}; margin-bottom: 6px;
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
  border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${modalIn} 0.2s ease;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; }
`
const ModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between; padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  position: sticky; top: 0; background: ${({ theme }) => theme.surface}; z-index: 1;
`
const ModalTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400; color: ${({ theme }) => theme.text};
`
const CloseBtn = styled.button`
  width: 32px; height: 32px; border-radius: 8px; background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border}; display: flex; align-items: center;
  justify-content: center; cursor: pointer; color: ${({ theme }) => theme.textDim}; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.negBg}; color: ${({ theme }) => theme.neg}; }
`
const ModalBody = styled.div`padding: 24px;`
const FormGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 14px;`
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
const Textarea = styled.textarea`
  width: 100%; padding: 10px 14px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; font-size: 13px;
  color: ${({ theme }) => theme.text}; outline: none; font-family: 'Inter', sans-serif;
  resize: vertical; min-height: 75px; box-sizing: border-box; transition: all 0.2s;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
  &::placeholder { color: ${({ theme }) => theme.textDim}; }
`
const ToggleRow = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  background: ${({ theme }) => theme.surface2}; border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px; cursor: pointer; transition: all 0.2s; user-select: none;
  &:hover { border-color: ${({ theme }) => theme.greenMid}; }
`
const ToggleLabel = styled.span`font-size: 13px; color: ${({ theme }) => theme.text};`

const SectionTitle = styled.div`
  font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
  color: ${({ theme }) => theme.textDim}; margin: 20px 0 12px;
  display: flex; align-items: center; gap: 8px;
  &::after { content: ''; flex: 1; height: 1px; background: ${({ theme }) => theme.border}; }
`

const ViewGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 16px;`
const ViewLabel = styled.div`font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${({ theme }) => theme.textDim}; margin-bottom: 3px;`
const ViewValue = styled.div`font-size: 13px; color: ${({ theme }) => theme.text};`
const ObsBox = styled.div`
  background: ${({ theme }) => theme.surface2}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 9px; padding: 12px 14px; font-size: 13px; color: ${({ theme }) => theme.text};
  white-space: pre-wrap; line-height: 1.5;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const grupos = ['Ativo', 'Passivo', 'Patrimônio', 'Receita', 'Despesa']
const demonstrativos = ['Balanço Patrimonial', 'DRE', 'DFC', 'DLPA', 'DMPL']

const PLANO_PADRAO: Omit<ContaPlano, 'id' | 'created_at'>[] = [
  { codigo: '1',       descricao: 'ATIVO',                              grupo: 'Ativo',      tipo: 'Sintética', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.1',     descricao: 'ATIVO CIRCULANTE',                   grupo: 'Ativo',      tipo: 'Sintética', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.1.1',   descricao: 'Caixa e Equivalentes de Caixa',      grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.1.2',   descricao: 'Aplicações Financeiras',             grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.1.3',   descricao: 'Contas a Receber',                   grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.1.4',   descricao: 'Estoques',                           grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.1.5',   descricao: 'Tributos a Recuperar',               grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.1.6',   descricao: 'Outros Ativos Circulantes',          grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.2',     descricao: 'ATIVO NÃO CIRCULANTE',               grupo: 'Ativo',      tipo: 'Sintética', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.2.1',   descricao: 'Realizável a Longo Prazo',           grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.2.2',   descricao: 'Investimentos',                      grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.2.3',   descricao: 'Imobilizado',                        grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '1.2.4',   descricao: 'Intangível',                         grupo: 'Ativo',      tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '2',       descricao: 'PASSIVO',                             grupo: 'Passivo',    tipo: 'Sintética', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '2.1',     descricao: 'PASSIVO CIRCULANTE',                  grupo: 'Passivo',    tipo: 'Sintética', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '2.1.1',   descricao: 'Fornecedores',                       grupo: 'Passivo',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '2.1.2',   descricao: 'Obrigações Trabalhistas',            grupo: 'Passivo',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '2.1.3',   descricao: 'Obrigações Tributárias',             grupo: 'Passivo',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '2.1.4',   descricao: 'Empréstimos e Financiamentos CP',    grupo: 'Passivo',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '2.1.5',   descricao: 'Outros Passivos Circulantes',        grupo: 'Passivo',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '2.2',     descricao: 'PASSIVO NÃO CIRCULANTE',             grupo: 'Passivo',    tipo: 'Sintética', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '2.2.1',   descricao: 'Empréstimos e Financiamentos LP',    grupo: 'Passivo',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '3',       descricao: 'PATRIMÔNIO LÍQUIDO',                 grupo: 'Patrimônio', tipo: 'Sintética', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '3.1',     descricao: 'Capital Social',                     grupo: 'Patrimônio', tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '3.2',     descricao: 'Reservas de Capital',                grupo: 'Patrimônio', tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '3.3',     descricao: 'Reservas de Lucros',                 grupo: 'Patrimônio', tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '3.4',     descricao: 'Lucros/Prejuízos Acumulados',        grupo: 'Patrimônio', tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'Balanço Patrimonial', ativa: true },
  { codigo: '4',       descricao: 'RECEITAS',                           grupo: 'Receita',    tipo: 'Sintética', natureza: 'Credora',   demonstrativo: 'DRE',                 ativa: true },
  { codigo: '4.1',     descricao: 'Receita Bruta de Vendas',            grupo: 'Receita',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'DRE',                 ativa: true },
  { codigo: '4.2',     descricao: 'Receita Bruta de Serviços',          grupo: 'Receita',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'DRE',                 ativa: true },
  { codigo: '4.3',     descricao: 'Deduções da Receita Bruta',          grupo: 'Receita',    tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
  { codigo: '4.4',     descricao: 'Receitas Financeiras',               grupo: 'Receita',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'DRE',                 ativa: true },
  { codigo: '4.5',     descricao: 'Outras Receitas Operacionais',       grupo: 'Receita',    tipo: 'Analítica', natureza: 'Credora',   demonstrativo: 'DRE',                 ativa: true },
  { codigo: '5',       descricao: 'DESPESAS',                           grupo: 'Despesa',    tipo: 'Sintética', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
  { codigo: '5.1',     descricao: 'Custo das Mercadorias/Serviços',     grupo: 'Despesa',    tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
  { codigo: '5.2',     descricao: 'Despesas com Pessoal',               grupo: 'Despesa',    tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
  { codigo: '5.3',     descricao: 'Despesas Administrativas',           grupo: 'Despesa',    tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
  { codigo: '5.4',     descricao: 'Despesas Comerciais',                grupo: 'Despesa',    tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
  { codigo: '5.5',     descricao: 'Despesas Tributárias',               grupo: 'Despesa',    tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
  { codigo: '5.6',     descricao: 'Despesas Financeiras',               grupo: 'Despesa',    tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
  { codigo: '5.7',     descricao: 'Depreciação e Amortização',          grupo: 'Despesa',    tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
  { codigo: '5.8',     descricao: 'Outras Despesas Operacionais',       grupo: 'Despesa',    tipo: 'Analítica', natureza: 'Devedora',  demonstrativo: 'DRE',                 ativa: true },
]

const blank = (): Partial<ContaPlano> => ({
  codigo: '', descricao: '', grupo: 'Ativo', tipo: 'Analítica',
  natureza: 'Devedora', demonstrativo: 'Balanço Patrimonial',
  conta_pai: '', observacoes: '', saldo_atual: 0, ativa: true,
})

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

type ModalMode = 'add' | 'edit' | 'view' | null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exportCsv(contas: ContaPlano[]) {
  const cols = ['Código', 'Descrição', 'Grupo', 'Tipo', 'Natureza', 'Demonstrativo', 'Conta Pai', 'Saldo Atual', 'Ativa', 'Observações']
  const rows = contas.map(c => [
    c.codigo, c.descricao, c.grupo, c.tipo, c.natureza, c.demonstrativo,
    c.conta_pai, c.saldo_atual != null ? String(c.saldo_atual) : '',
    c.ativa ? 'Sim' : 'Não', c.observacoes
  ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`))
  const csv = [cols.map(c => `"${c}"`).join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `plano_contas_${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChartOfAccountsPage() {
  const { escritorio } = useAuthStore()
  const { planoContas: cachedPlanoContas, setPlanoContas: setCachedPlanoContas } = useDataStore()
  const escId = escritorio?.id
  const [contas, setContas] = useState<ContaPlano[]>(cachedPlanoContas)
  const [filtered, setFiltered] = useState<ContaPlano[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('todos')
  const [loading, setLoading] = useState(cachedPlanoContas.length === 0)
  const [importing, setImporting] = useState(false)
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Partial<ContaPlano>>(blank())
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (contas.length === 0) setLoading(true)
    let query = supabase.from('plano_contas').select('*').order('codigo')
    if (escId) query = query.eq('escritorio_id', escId)
    const { data } = await query
    const result = (data || []) as ContaPlano[]
    setContas(result)
    setCachedPlanoContas(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [escId])

  useEffect(() => {
    let list = contas
    if (tab !== 'todos') list = list.filter(c => c.grupo === tab)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.codigo?.includes(q) ||
        c.descricao?.toLowerCase().includes(q) ||
        c.demonstrativo?.toLowerCase().includes(q)
      )
    }
    setFiltered(list)
  }, [contas, search, tab])

  const openAdd = () => { setSelected(blank()); setModal('add') }
  const openEdit = (c: ContaPlano) => { setSelected({ ...c }); setModal('edit') }
  const openView = (c: ContaPlano) => { setSelected({ ...c }); setModal('view') }
  const closeModal = () => { setModal(null); setSelected(blank()) }
  const upd = (k: keyof ContaPlano, v: any) => setSelected(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!selected.codigo || !selected.descricao) { toast.error('Código e descrição são obrigatórios'); return }
    setSaving(true)
    if (modal === 'add') {
      const payload = escritorio?.id ? { ...selected, escritorio_id: escritorio.id } : selected
      const { error } = await supabase.from('plano_contas').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Conta adicionada!')
    } else if (modal === 'edit' && selected.id) {
      const { id, created_at, ...rest } = selected as any
      const { error } = await supabase.from('plano_contas').update(rest).eq('id', id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Conta atualizada!')
    }
    setSaving(false)
    closeModal()
    load()
  }

  const handleDelete = async (c: ContaPlano) => {
    if (!confirm(`Excluir conta ${c.codigo} — ${c.descricao}?`)) return
    const { error } = await supabase.from('plano_contas').delete().eq('id', c.id)
    if (error) { toast.error(error.message); return }
    toast.success('Conta excluída')
    load()
  }

  const handleToggleAtiva = async (c: ContaPlano) => {
    const isAtiva = c.ativa !== false  // null/undefined/true = ativa
    const { error } = await supabase.from('plano_contas').update({ ativa: !isAtiva }).eq('id', c.id)
    if (error) { toast.error(error.message); return }
    toast.success(isAtiva ? 'Conta inativada' : 'Conta reativada')
    load()
  }

  const handleImport = async () => {
    if (!confirm(`Isso irá importar ${PLANO_PADRAO.length} contas padrão. Continuar?`)) return
    setImporting(true)
    const payload = PLANO_PADRAO.map(c => escritorio?.id ? { ...c, escritorio_id: escritorio.id } : c)
    const { error } = await supabase.from('plano_contas').insert(payload)
    setImporting(false)
    if (error) { toast.error(error.message); return }
    toast.success(`${PLANO_PADRAO.length} contas importadas com sucesso!`)
    load()
  }

  const fmtSaldo = (v?: number) =>
    v != null ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'

  const ativas = contas.filter(c => c.ativa !== false).length
  const analiticas = contas.filter(c => c.tipo === 'Analítica').length

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <motion.div variants={itemVariants}>
        <PageHeader>
          <div>
            <PageTitle>Plano de <em>Contas</em></PageTitle>
            <PageSub>
              {contas.length} contas · {analiticas} analíticas · {ativas} ativas — NBC TG 26 / CFC
            </PageSub>
          </div>
          <HeaderActions>
            {contas.length === 0 && (
              <SecBtn onClick={handleImport} whileTap={{ scale: 0.97 }} disabled={importing}>
                <Upload size={14} /> {importing ? 'Importando...' : 'Importar Plano Padrão'}
              </SecBtn>
            )}
            <SecBtn onClick={() => exportCsv(filtered)} whileTap={{ scale: 0.97 }}>
              <Download size={14} /> Exportar CSV
            </SecBtn>
            <AddBtn onClick={openAdd} whileTap={{ scale: 0.97 }}>
              <Plus size={15} /> Nova Conta
            </AddBtn>
          </HeaderActions>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Toolbar>
          <SearchBox>
            <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
            <input
              placeholder="Buscar por código ou descrição..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchBox>
          <TabRow>
            {[['todos', 'Todos'], ['Ativo', 'Ativo'], ['Passivo', 'Passivo'], ['Patrimônio', 'PL'], ['Receita', 'Receita'], ['Despesa', 'Despesa']].map(([val, label]) => (
              <Tab key={val} $active={tab === val} onClick={() => setTab(val)}>{label}</Tab>
            ))}
          </TabRow>
        </Toolbar>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          {loading ? (
            <EmptyState>⏳ Carregando...</EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📒</div>
              <EmptyTitle>Nenhuma conta encontrada</EmptyTitle>
              <div style={{ fontSize: 13 }}>
                {contas.length === 0
                  ? 'Clique em "Importar Plano Padrão" ou "Nova Conta" para começar'
                  : 'Tente outro filtro ou termo de busca'}
              </div>
            </EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <Thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Grupo</th>
                    <th>Tipo</th>
                    <th>Natureza</th>
                    <th>Demonstrativo</th>
                    <th>Saldo Atual</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </Thead>
                <Tbody>
                  {filtered.map((c, i) => {
                    const level = (c.codigo?.split('.').length || 1) - 1
                    const inativa = c.ativa === false
                    return (
                      <tr key={c.id || i} style={{ opacity: inativa ? 0.5 : 1 }}>
                        <td>
                          <CodeCell $sintetica={c.tipo === 'Sintética'}>{c.codigo}</CodeCell>
                        </td>
                        <td style={{ paddingLeft: 14 + level * 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {level > 0 && <ChevronRight size={11} style={{ opacity: 0.3, flexShrink: 0 }} />}
                            <span style={{ fontWeight: c.tipo === 'Sintética' ? 600 : 400, fontSize: c.tipo === 'Sintética' ? 12 : 13 }}>
                              {c.descricao}
                            </span>
                          </div>
                        </td>
                        <td><GrupoBadge $grupo={c.grupo || ''}>{c.grupo || '—'}</GrupoBadge></td>
                        <td><TipoBadge $analitica={c.tipo === 'Analítica'}>{c.tipo || '—'}</TipoBadge></td>
                        <td>
                          {c.natureza
                            ? <NaturezaBadge $devedora={c.natureza === 'Devedora'}>{c.natureza}</NaturezaBadge>
                            : <span style={{ color: 'inherit', opacity: 0.3 }}>—</span>}
                        </td>
                        <td style={{ fontSize: 12, color: 'inherit', opacity: 0.7 }}>{c.demonstrativo || '—'}</td>
                        <td style={{ fontWeight: 500 }}>{fmtSaldo(c.saldo_atual)}</td>
                        <td>
                          {inativa
                            ? <InativaBadge>Inativa</InativaBadge>
                            : <TipoBadge $analitica>Ativa</TipoBadge>}
                        </td>
                        <td>
                          <ActionRow>
                            <ActBtn onClick={() => openView(c)} title="Visualizar"><Eye size={13} /></ActBtn>
                            <ActBtn onClick={() => openEdit(c)} title="Editar"><Edit2 size={13} /></ActBtn>
                            <ActBtn
                              onClick={() => handleToggleAtiva(c)}
                              title={inativa ? 'Reativar' : 'Inativar'}
                              style={{ color: 'inherit' }}
                            >
                              {inativa ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                            </ActBtn>
                            <ActBtn
                              onClick={() => handleDelete(c)}
                              title="Excluir"
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

      {/* ── Modal ── */}
      {modal && (
          <Overlay
            onClick={e => e.target === e.currentTarget && closeModal()}
          >
            <Modal
            >
              <ModalHead>
                <ModalTitle>
                  {modal === 'add' ? 'Nova Conta' : modal === 'edit' ? 'Editar Conta' : 'Detalhes da Conta'}
                </ModalTitle>
                <CloseBtn onClick={closeModal}><X size={14} /></CloseBtn>
              </ModalHead>

              <ModalBody>
                {modal === 'view' ? (
                  <>
                    <SectionTitle>Identificação</SectionTitle>
                    <ViewGrid>
                      <div>
                        <ViewLabel>Código</ViewLabel>
                        <ViewValue style={{ fontFamily: 'Playfair Display, serif', fontSize: 20 }}>{selected.codigo}</ViewValue>
                      </div>
                      <div>
                        <ViewLabel>Tipo</ViewLabel>
                        <ViewValue><TipoBadge $analitica={selected.tipo === 'Analítica'}>{selected.tipo || '—'}</TipoBadge></ViewValue>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <ViewLabel>Descrição</ViewLabel>
                        <ViewValue style={{ fontWeight: 500, fontSize: 15 }}>{selected.descricao}</ViewValue>
                      </div>
                      <div>
                        <ViewLabel>Grupo</ViewLabel>
                        <ViewValue><GrupoBadge $grupo={selected.grupo || ''}>{selected.grupo || '—'}</GrupoBadge></ViewValue>
                      </div>
                      <div>
                        <ViewLabel>Natureza do Saldo</ViewLabel>
                        <ViewValue>
                          {selected.natureza
                            ? <NaturezaBadge $devedora={selected.natureza === 'Devedora'}>{selected.natureza}</NaturezaBadge>
                            : '—'}
                        </ViewValue>
                      </div>
                      <div>
                        <ViewLabel>Demonstrativo</ViewLabel>
                        <ViewValue>{selected.demonstrativo || '—'}</ViewValue>
                      </div>
                      <div>
                        <ViewLabel>Conta Pai</ViewLabel>
                        <ViewValue style={{ fontFamily: 'monospace' }}>{selected.conta_pai || '—'}</ViewValue>
                      </div>
                      <div>
                        <ViewLabel>Saldo Atual</ViewLabel>
                        <ViewValue style={{ fontWeight: 600, color: '#1a7a4a' }}>{fmtSaldo(selected.saldo_atual)}</ViewValue>
                      </div>
                      <div>
                        <ViewLabel>Status</ViewLabel>
                        <ViewValue>
                          {selected.ativa === false
                            ? <InativaBadge>Inativa</InativaBadge>
                            : <TipoBadge $analitica>Ativa</TipoBadge>}
                        </ViewValue>
                      </div>
                    </ViewGrid>
                    {selected.observacoes && (
                      <>
                        <SectionTitle><FileText size={12} /> Observações</SectionTitle>
                        <ObsBox>{selected.observacoes}</ObsBox>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <SectionTitle>Identificação</SectionTitle>
                    <FormGrid>
                      <Field>
                        <FieldLabel>Código *</FieldLabel>
                        <Input
                          placeholder="Ex: 1.1.1.01"
                          value={selected.codigo || ''}
                          onChange={e => upd('codigo', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Tipo</FieldLabel>
                        <Select value={selected.tipo || 'Analítica'} onChange={e => upd('tipo', e.target.value)}>
                          <option value="Analítica">Analítica</option>
                          <option value="Sintética">Sintética</option>
                        </Select>
                      </Field>
                      <Field style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel>Descrição *</FieldLabel>
                        <Input
                          placeholder="Nome da conta contábil"
                          value={selected.descricao || ''}
                          onChange={e => upd('descricao', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Grupo</FieldLabel>
                        <Select value={selected.grupo || 'Ativo'} onChange={e => upd('grupo', e.target.value)}>
                          {grupos.map(g => <option key={g} value={g}>{g}</option>)}
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Natureza do Saldo</FieldLabel>
                        <Select value={selected.natureza || 'Devedora'} onChange={e => upd('natureza', e.target.value)}>
                          <option value="Devedora">Devedora</option>
                          <option value="Credora">Credora</option>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Demonstrativo</FieldLabel>
                        <Select value={selected.demonstrativo || ''} onChange={e => upd('demonstrativo', e.target.value)}>
                          <option value="">— Selecione —</option>
                          {demonstrativos.map(d => <option key={d} value={d}>{d}</option>)}
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Código da Conta Pai</FieldLabel>
                        <Input
                          placeholder="Ex: 1.1"
                          value={selected.conta_pai || ''}
                          onChange={e => upd('conta_pai', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Saldo Inicial (R$)</FieldLabel>
                        <Input
                          type="number" step="0.01" placeholder="0,00"
                          value={selected.saldo_atual || ''}
                          onChange={e => upd('saldo_atual', Number(e.target.value))}
                        />
                      </Field>
                      <Field style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel>Status</FieldLabel>
                        <ToggleRow onClick={() => upd('ativa', !selected.ativa)}>
                          {selected.ativa !== false
                            ? <ToggleRight size={18} style={{ color: '#1a7a4a' }} />
                            : <ToggleLeft size={18} style={{ opacity: 0.4 }} />}
                          <ToggleLabel>{selected.ativa !== false ? 'Conta ativa' : 'Conta inativa'}</ToggleLabel>
                        </ToggleRow>
                      </Field>
                    </FormGrid>

                    <SectionTitle><FileText size={12} /> Observações</SectionTitle>
                    <Textarea
                      placeholder="Notas sobre uso, restrições ou referências..."
                      value={selected.observacoes || ''}
                      onChange={e => upd('observacoes', e.target.value)}
                    />
                  </>
                )}
              </ModalBody>

              <ModalFooter>
                <CancelBtn onClick={closeModal}>{modal === 'view' ? 'Fechar' : 'Cancelar'}</CancelBtn>
                {modal !== 'view' && (
                  <SaveBtn onClick={handleSave} whileTap={{ scale: 0.97 }} disabled={saving}>
                    {saving ? 'Salvando...' : modal === 'add' ? 'Adicionar Conta' : 'Salvar Alterações'}
                  </SaveBtn>
                )}
              </ModalFooter>
            </Modal>
          </Overlay>
        )}
    </motion.div>
  )
}
