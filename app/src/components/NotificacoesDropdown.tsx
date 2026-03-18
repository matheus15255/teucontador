import { useMemo, useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import { Bell, AlertTriangle, Clock, Users, CheckSquare, X } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { useDataStore } from '../stores/dataStore'
import { useNavigate } from 'react-router-dom'

const fadeIn = keyframes`from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); }`

const Wrap = styled.div`position: relative; display: inline-flex;`

const BellBtn = styled.button<{ $hasNew: boolean }>`
  width: 32px; height: 32px; border-radius: 8px;
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme, $hasNew }) => $hasNew ? 'rgba(234,88,12,0.4)' : theme.border};
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: ${({ theme }) => theme.textMid}; transition: all 0.2s; position: relative;
  &:hover { background: ${({ theme }) => theme.surface2}; border-color: ${({ theme }) => theme.border2}; }
  @media (max-width: 480px) { display: flex; }
`

const Badge = styled.span`
  position: absolute; top: -4px; right: -4px;
  min-width: 16px; height: 16px; border-radius: 8px;
  background: #ea580c; color: #fff; font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px; font-family: 'Inter', sans-serif;
  border: 2px solid ${({ theme }) => theme.surface};
`

const Panel = styled.div<{ $top: number; $right: number }>`
  position: fixed; top: ${({ $top }) => $top}px; right: ${({ $right }) => $right}px;
  width: 340px; background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  z-index: 8000; animation: ${fadeIn} 0.18s ease;
  overflow: hidden;
  @media (max-width: 480px) { width: calc(100vw - 24px); right: 12px; }
`

const PanelHead = styled.div`
  padding: 14px 16px 12px; border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex; align-items: center; justify-content: space-between;
`
const PanelTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 15px; color: ${({ theme }) => theme.text};
`
const CloseBtn = styled.button`
  width: 24px; height: 24px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  color: ${({ theme }) => theme.textDim}; transition: background 0.15s;
  &:hover { background: ${({ theme }) => theme.surface2}; }
`

const List = styled.div`max-height: 380px; overflow-y: auto;`

const Item = styled.button<{ $color: string }>`
  display: flex; align-items: flex-start; gap: 10px; width: 100%;
  padding: 11px 16px; border: none; background: transparent;
  cursor: pointer; text-align: left; transition: background 0.15s;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
`

const IconWrap = styled.div<{ $color: string }>`
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  background: ${({ $color }) => $color}22;
  display: flex; align-items: center; justify-content: center;
  color: ${({ $color }) => $color};
`

const ItemBody = styled.div`flex: 1; min-width: 0;`
const ItemTitle = styled.div`font-size: 12.5px; font-weight: 500; color: ${({ theme }) => theme.text}; line-height: 1.3;`
const ItemSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`

const Empty = styled.div`
  padding: 32px 16px; text-align: center;
  color: ${({ theme }) => theme.textDim}; font-size: 13px;
`

interface Notif {
  id: string
  title: string
  sub: string
  color: string
  icon: React.ElementType
  route: string
}

interface Props {
  open: boolean
  onToggle: () => void
  onClose: () => void
}

export function NotificacoesDropdown({ open, onToggle, onClose }: Props) {
  const { obrigacoes, clientes, tarefas } = useDataStore()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [panelPos, setPanelPos] = useState({ top: 60, right: 20 })
  const today = new Date()

  useEffect(() => {
    if (!open) return
    // Calculate panel position from button rect
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right,
      })
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  const notifs = useMemo<Notif[]>(() => {
    const list: Notif[] = []

    // Obrigações atrasadas
    const atrasadas = obrigacoes.filter(o => o.status === 'atrasado')
    if (atrasadas.length > 0) {
      list.push({
        id: 'obrig-atrasadas',
        title: `${atrasadas.length} obrigação${atrasadas.length > 1 ? 'ões' : ''} atrasada${atrasadas.length > 1 ? 's' : ''}`,
        sub: atrasadas.slice(0, 2).map((o: any) => o.tipo).join(', ') + (atrasadas.length > 2 ? ` +${atrasadas.length - 2}` : ''),
        color: '#dc2626',
        icon: AlertTriangle,
        route: '/app/obrigacoes',
      })
    }

    // Obrigações vencendo em ≤7 dias
    const vencendo = obrigacoes.filter(o => {
      if (o.status === 'transmitido') return false
      const diff = differenceInDays(parseISO(o.vencimento), today)
      return diff >= 0 && diff <= 7
    })
    if (vencendo.length > 0) {
      list.push({
        id: 'obrig-vencendo',
        title: `${vencendo.length} obrigação${vencendo.length > 1 ? 'ões' : ''} vencendo em 7 dias`,
        sub: vencendo.slice(0, 2).map((o: any) => `${o.tipo} — ${o.clientes?.razao_social ?? 'sem cliente'}`).join(' | '),
        color: '#d97706',
        icon: Clock,
        route: '/app/obrigacoes',
      })
    }

    // Clientes atrasados
    const clientesAtrasados = clientes.filter((c: any) => c.situacao === 'atrasado')
    if (clientesAtrasados.length > 0) {
      list.push({
        id: 'clientes-atrasados',
        title: `${clientesAtrasados.length} cliente${clientesAtrasados.length > 1 ? 's' : ''} com honorários atrasados`,
        sub: clientesAtrasados.slice(0, 2).map((c: any) => c.razao_social).join(', '),
        color: '#dc2626',
        icon: Users,
        route: '/app/clientes',
      })
    }

    // Tarefas vencendo hoje ou atrasadas
    const tarefasAlerta = tarefas.filter((t: any) => {
      if (t.status === 'concluida' || !t.data_vencimento) return false
      const diff = differenceInDays(parseISO(t.data_vencimento), today)
      return diff <= 0
    })
    if (tarefasAlerta.length > 0) {
      list.push({
        id: 'tarefas-vencidas',
        title: `${tarefasAlerta.length} tarefa${tarefasAlerta.length > 1 ? 's' : ''} vencida${tarefasAlerta.length > 1 ? 's' : ''} ou para hoje`,
        sub: tarefasAlerta.slice(0, 2).map((t: any) => t.titulo).join(', '),
        color: '#7c3aed',
        icon: CheckSquare,
        route: '/app/dashboard',
      })
    }

    // Agenda fiscal — obrigações vencendo amanhã
    const amanha = obrigacoes.filter(o => {
      if (o.status === 'transmitido') return false
      const diff = differenceInDays(parseISO(o.vencimento), today)
      return diff === 1
    })
    if (amanha.length > 0) {
      list.push({
        id: 'obrig-amanha',
        title: `${amanha.length} obrigação${amanha.length > 1 ? 'ões' : ''} vence amanhã!`,
        sub: amanha.map((o: any) => o.tipo).join(', '),
        color: '#ea580c',
        icon: AlertTriangle,
        route: '/app/agenda',
      })
    }

    return list
  }, [obrigacoes, clientes, tarefas, today])

  return (
    <Wrap ref={ref}>
      <BellBtn ref={btnRef} $hasNew={notifs.length > 0} onClick={onToggle}>
        <Bell size={14} />
        {notifs.length > 0 && <Badge>{notifs.length > 9 ? '9+' : notifs.length}</Badge>}
      </BellBtn>

      {open && createPortal(
        <Panel $top={panelPos.top} $right={panelPos.right}>
          <PanelHead>
            <PanelTitle>Notificações</PanelTitle>
            <CloseBtn onClick={onClose}><X size={13} /></CloseBtn>
          </PanelHead>
          <List>
            {notifs.length === 0 ? (
              <Empty>Tudo em dia! Nenhuma notificação.</Empty>
            ) : notifs.map(n => (
              <Item key={n.id} $color={n.color} onClick={() => { navigate(n.route); onClose() }}>
                <IconWrap $color={n.color}><n.icon size={14} /></IconWrap>
                <ItemBody>
                  <ItemTitle>{n.title}</ItemTitle>
                  <ItemSub>{n.sub}</ItemSub>
                </ItemBody>
              </Item>
            ))}
          </List>
        </Panel>,
        document.body
      )}
    </Wrap>
  )
}
