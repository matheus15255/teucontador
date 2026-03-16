import { useState, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import {
  ChevronLeft, ChevronRight, Calendar, AlertTriangle,
  CheckCircle2, Clock, X, Filter,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, parseISO, addMonths, subMonths,
  differenceInDays, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDataStore } from '../../stores/dataStore'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

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
  width: 34px; height: 34px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; cursor: pointer; display: flex;
  align-items: center; justify-content: center; color: ${({ theme }) => theme.textMid};
  transition: all 0.2s; &:hover { background: ${({ theme }) => theme.surface2}; }
`
const MonthLabel = styled.div`
  font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 400;
  color: ${({ theme }) => theme.text}; min-width: 180px; text-align: center;
`
const Select = styled.select`
  padding: 7px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; cursor: pointer;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; }
`
const TodayBtn = styled.button`
  padding: 7px 14px; border-radius: 9px; font-size: 12.5px; font-weight: 500;
  border: 1.5px solid ${({ theme }) => theme.border}; background: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.textMid}; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
  &:hover { background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green}; border-color: rgba(26,122,74,0.3); }
`

const Grid = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`

const WeekRow = styled.div`
  display: grid; grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid ${({ theme }) => theme.border};
`
const WeekLabel = styled.div`
  padding: 10px 4px; text-align: center; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.8px; color: ${({ theme }) => theme.textDim};
`

const DaysGrid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr);`

const DayCell = styled.div<{ $today: boolean; $outside: boolean; $selected: boolean }>`
  min-height: 110px; padding: 8px 6px; border-right: 1px solid ${({ theme }) => theme.border};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme, $outside, $selected }) =>
    $selected ? theme.greenLight : $outside ? theme.bg : theme.surface};
  cursor: pointer; transition: background 0.15s;
  &:hover { background: ${({ theme, $outside }) => $outside ? theme.bg : theme.surface2}; }
  &:nth-child(7n) { border-right: none; }
  @media (max-width: 700px) { min-height: 70px; padding: 4px 3px; }
`

const DayNum = styled.div<{ $today: boolean; $outside: boolean }>`
  font-size: 12px; font-weight: ${({ $today }) => $today ? '700' : '400'};
  color: ${({ theme, $today, $outside }) =>
    $outside ? theme.textDim : $today ? theme.green : theme.text};
  width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: ${({ theme, $today }) => $today ? theme.greenLight : 'transparent'};
  border: ${({ theme, $today }) => $today ? `1.5px solid ${theme.greenMid}` : 'none'};
  margin-bottom: 4px;
`

const EventPill = styled.div<{ $color: string }>`
  background: ${({ $color }) => $color}22; color: ${({ $color }) => $color};
  border-left: 2.5px solid ${({ $color }) => $color};
  padding: 2px 5px; border-radius: 4px; font-size: 10px; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 2px; cursor: pointer;
  @media (max-width: 700px) { font-size: 9px; padding: 1px 3px; }
`

const MorePill = styled.div`
  font-size: 10px; color: ${({ theme }) => theme.textDim}; padding: 1px 4px;
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
  width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${modalIn} 0.22s ease; overflow: hidden;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 90vh; overflow-y: auto; }
`
const ModalHead = styled.div`
  padding: 18px 20px 14px; border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex; align-items: center; justify-content: space-between;
`
const ModalTitle = styled.div`font-family: 'Playfair Display', serif; font-size: 17px; color: ${({ theme }) => theme.text};`
const ModalSub   = styled.div`font-size: 12px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`
const CloseBtn   = styled.button`
  width: 28px; height: 28px; border-radius: 7px; border: none; background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: ${({ theme }) => theme.textDim}; transition: background 0.15s;
  &:hover { background: ${({ theme }) => theme.surface2}; }
`
const ModalBody = styled.div`padding: 16px 20px 20px;`
const ObrigItem = styled.div<{ $color: string }>`
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 10px; border: 1px solid ${({ $color }) => $color}33;
  background: ${({ $color }) => $color}11; margin-bottom: 8px;
`
const ObrigInfo = styled.div`flex: 1; min-width: 0;`
const ObrigTipo = styled.div`font-size: 13px; font-weight: 500; color: ${({ theme }) => theme.text};`
const ObrigCliente = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 1px;`
const StatusBadge = styled.span<{ $color: string }>`
  padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;
  background: ${({ $color }) => $color}22; color: ${({ $color }) => $color};
`
const ActionBtn = styled.button<{ $variant: 'green' | 'gray' }>`
  padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500;
  cursor: pointer; border: 1.5px solid; font-family: 'Inter', sans-serif; transition: all 0.2s;
  background: ${({ theme, $variant }) => $variant === 'green' ? theme.green : theme.surface};
  color: ${({ theme, $variant }) => $variant === 'green' ? '#fff' : theme.textMid};
  border-color: ${({ theme, $variant }) => $variant === 'green' ? theme.green : theme.border};
  &:hover { opacity: 0.85; }
`

// ─── Legend ────────────────────────────────────────────────────────────────────
const Legend = styled.div`display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;`
const LegItem = styled.div`display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${({ theme }) => theme.textMid};`
const Dot = styled.div<{ $color: string }>`width: 10px; height: 10px; border-radius: 3px; background: ${({ $color }) => $color};`

function statusColor(s: string, vencimento: string): string {
  if (s === 'transmitido') return '#16a34a'
  if (s === 'atrasado') return '#dc2626'
  const diff = differenceInDays(parseISO(vencimento), new Date())
  if (diff < 0) return '#dc2626'
  if (diff <= 3) return '#ea580c'
  if (diff <= 7) return '#d97706'
  return '#2563eb'
}
function statusLabel(s: string, vencimento: string): string {
  if (s === 'transmitido') return 'Concluída'
  if (s === 'atrasado') return 'Atrasada'
  const diff = differenceInDays(parseISO(vencimento), new Date())
  if (diff < 0) return 'Atrasada'
  return 'Pendente'
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AgendaFiscalPage() {
  const { obrigacoes, clientes } = useDataStore()
  const { escritorio } = useAuthStore()
  const escId = escritorio?.id

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filterCliente, setFilterCliente] = useState('')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const filtered = useMemo(() =>
    obrigacoes.filter((o: any) => !filterCliente || o.cliente_id === filterCliente),
    [obrigacoes, filterCliente]
  )

  const calDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end   = endOfMonth(currentMonth)
    const days  = eachDayOfInterval({ start, end })
    const startPad = getDay(start)
    const endPad = (7 - (days.length + startPad) % 7) % 7
    const prevDays = Array.from({ length: startPad }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() - startPad + i); return { date: d, outside: true }
    })
    const nextDays = Array.from({ length: endPad }, (_, i) => {
      const d = new Date(end); d.setDate(d.getDate() + i + 1); return { date: d, outside: true }
    })
    return [...prevDays, ...days.map(d => ({ date: d, outside: false })), ...nextDays]
  }, [currentMonth])

  const obrigsByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    filtered.forEach((o: any) => {
      const key = o.vencimento
      if (!map[key]) map[key] = []
      map[key].push(o)
    })
    return map
  }, [filtered])

  const dayObrigacoes = useMemo(() => {
    if (!selectedDay) return []
    const key = format(selectedDay, 'yyyy-MM-dd')
    return obrigsByDay[key] || []
  }, [selectedDay, obrigsByDay])

  async function handleTransmitir(id: string) {
    if (!escId) return
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('obrigacoes')
        .update({ status: 'transmitido' })
        .eq('id', id)
        .eq('escritorio_id', escId)
      if (error) throw error
      toast.success('Obrigação marcada como concluída')
    } catch {
      toast.error('Erro ao atualizar')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Agenda <em>Fiscal</em></PageTitle>
        <PageSub>Visualize e gerencie todas as obrigações fiscais no calendário</PageSub>
      </PageHeader>

      <Toolbar>
        <NavBtn onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft size={15} /></NavBtn>
        <MonthLabel>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</MonthLabel>
        <NavBtn onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight size={15} /></NavBtn>
        <TodayBtn onClick={() => setCurrentMonth(new Date())}>Hoje</TodayBtn>
        <Filter size={13} style={{ opacity: 0.4, marginLeft: 8 }} />
        <Select value={filterCliente} onChange={e => setFilterCliente(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
        </Select>
      </Toolbar>

      <Legend>
        <LegItem><Dot $color="#2563eb" />Pendente</LegItem>
        <LegItem><Dot $color="#d97706" />≤ 7 dias</LegItem>
        <LegItem><Dot $color="#ea580c" />≤ 3 dias</LegItem>
        <LegItem><Dot $color="#dc2626" />Atrasada</LegItem>
        <LegItem><Dot $color="#16a34a" />Concluída</LegItem>
      </Legend>

      <Grid>
        <WeekRow>
          {WEEKDAYS.map(d => <WeekLabel key={d}>{d}</WeekLabel>)}
        </WeekRow>
        <DaysGrid>
          {calDays.map(({ date, outside }, i) => {
            const key   = format(date, 'yyyy-MM-dd')
            const items = obrigsByDay[key] || []
            const isToday   = isSameDay(date, new Date())
            const isSelected = selectedDay ? isSameDay(date, selectedDay) : false
            const show  = items.slice(0, 3)
            const more  = items.length - 3

            return (
              <DayCell
                key={i}
                $today={isToday}
                $outside={outside}
                $selected={isSelected}
                onClick={() => !outside && setSelectedDay(date)}
              >
                <DayNum $today={isToday} $outside={outside}>{format(date, 'd')}</DayNum>
                {!outside && show.map((o: any) => (
                  <EventPill key={o.id} $color={statusColor(o.status, o.vencimento)}
                    title={`${o.tipo} — ${o.clientes?.razao_social || 'sem cliente'}`}
                  >
                    {o.tipo}
                  </EventPill>
                ))}
                {more > 0 && <MorePill>+{more} mais</MorePill>}
              </DayCell>
            )
          })}
        </DaysGrid>
      </Grid>

      {selectedDay && (
        <Overlay onClick={() => setSelectedDay(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <div>
                <ModalTitle>
                  {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </ModalTitle>
                <ModalSub>
                  {dayObrigacoes.length === 0
                    ? 'Nenhuma obrigação neste dia'
                    : `${dayObrigacoes.length} obrigação${dayObrigacoes.length > 1 ? 'ões' : ''}`}
                </ModalSub>
              </div>
              <CloseBtn onClick={() => setSelectedDay(null)}><X size={14} /></CloseBtn>
            </ModalHead>
            <ModalBody>
              {dayObrigacoes.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--textDim)', fontSize: 13 }}>
                  Dia livre de obrigações.
                </p>
              ) : dayObrigacoes.map((o: any) => {
                const color = statusColor(o.status, o.vencimento)
                return (
                  <ObrigItem key={o.id} $color={color}>
                    <ObrigInfo>
                      <ObrigTipo>{o.tipo}</ObrigTipo>
                      <ObrigCliente>{o.clientes?.razao_social || 'Sem cliente'}</ObrigCliente>
                    </ObrigInfo>
                    <StatusBadge $color={color}>
                      {statusLabel(o.status, o.vencimento)}
                    </StatusBadge>
                    {o.status !== 'transmitido' && (
                      <ActionBtn
                        $variant="green"
                        disabled={updatingId === o.id}
                        onClick={() => handleTransmitir(o.id)}
                      >
                        {updatingId === o.id ? '...' : '✓ Concluir'}
                      </ActionBtn>
                    )}
                  </ObrigItem>
                )
              })}
            </ModalBody>
          </Modal>
        </Overlay>
      )}
    </>
  )
}
