import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { Check, ChevronDown, ChevronUp, X, Rocket } from 'lucide-react'
import { useState } from 'react'

const DISMISSED_KEY = 'teu_checklist_dismissed_v1'
const RELATORIOS_KEY = 'teu_visited_relatorios'

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
`

const Wrap = styled.div`
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow};
  margin-bottom: 24px;
  animation: ${slideDown} 0.3s ease;
  font-family: 'Inter', sans-serif;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
  background: ${({ theme }) => theme.surface};
  &:hover { background: ${({ theme }) => theme.surface2}; }
  transition: background 0.15s;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const RocketIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #1a7a4a18;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a7a4a;
  flex-shrink: 0;
`

const HeaderTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`

const HeaderSub = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.textDim};
  margin-top: 1px;
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ProgressWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ProgressBar = styled.div`
  width: 80px;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.border};
  overflow: hidden;
  @media (max-width: 480px) { width: 50px; }
`

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, #1a7a4a, #22c55e);
  border-radius: 3px;
  transition: width 0.4s ease;
`

const ProgressLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #1a7a4a;
  white-space: nowrap;
`

const DismissBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.textDim};
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s;
  &:hover { color: ${({ theme }) => theme.text}; background: ${({ theme }) => theme.surface3}; }
`

const Body = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  padding: 12px 20px 16px;
`

const StepRow = styled.div<{ $done: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  opacity: ${({ $done }) => $done ? 0.6 : 1};
  &:last-child { border-bottom: none; }
`

const StepCheck = styled.div<{ $done: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid ${({ $done }) => $done ? '#1a7a4a' : '#d1d5db'};
  background: ${({ $done }) => $done ? '#1a7a4a' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
`

const StepInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const StepLabel = styled.div<{ $done: boolean }>`
  font-size: 13px;
  font-weight: ${({ $done }) => $done ? 400 : 500};
  color: ${({ theme, $done }) => $done ? theme.textDim : theme.text};
  text-decoration: ${({ $done }) => $done ? 'line-through' : 'none'};
`

const StepDesc = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.textDim};
  margin-top: 1px;
`

const StepAction = styled.button`
  font-size: 11px;
  font-weight: 600;
  color: #1a7a4a;
  background: #1a7a4a12;
  border: 1px solid #1a7a4a30;
  border-radius: 7px;
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover { background: #1a7a4a22; }
`

const SuccessBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: ${({ theme }) => theme.posBg};
  border-top: 1px solid ${({ theme }) => theme.border};
  font-size: 13px;
  color: ${({ theme }) => theme.pos};
  font-weight: 500;
`

interface Step {
  id: string
  label: string
  desc: string
  completed: boolean
  actionLabel?: string
  actionPath?: string
}

interface Props {
  clientes: number
  lancamentos: number
  obrigacoes: number
  visitedRelatorios: boolean
  onDismiss: () => void
}

export function OnboardingChecklist({ clientes, lancamentos, obrigacoes, visitedRelatorios, onDismiss }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  if (localStorage.getItem(DISMISSED_KEY)) return null

  const steps: Step[] = [
    {
      id: 'conta',
      label: 'Conta criada',
      desc: 'Bem-vindo ao TEUcontador!',
      completed: true,
    },
    {
      id: 'cliente',
      label: 'Adicionar primeiro cliente',
      desc: 'Cadastre uma empresa ou pessoa que você atende',
      completed: clientes > 0,
      actionLabel: 'Ir agora →',
      actionPath: '/app/clientes',
    },
    {
      id: 'obrigacao',
      label: 'Registrar uma obrigação fiscal',
      desc: 'Controle prazos para não perder nenhum vencimento',
      completed: obrigacoes > 0,
      actionLabel: 'Ir agora →',
      actionPath: '/app/obrigacoes',
    },
    {
      id: 'lancamento',
      label: 'Lançar uma movimentação',
      desc: 'Registre receitas ou despesas de um cliente',
      completed: lancamentos > 0,
      actionLabel: 'Ir agora →',
      actionPath: '/app/lancamentos',
    },
    {
      id: 'relatorio',
      label: 'Explorar relatórios',
      desc: 'Veja DRE e balanço gerados automaticamente',
      completed: visitedRelatorios,
      actionLabel: 'Ir agora →',
      actionPath: '/app/relatorios',
    },
  ]

  const done = steps.filter(s => s.completed).length
  const total = steps.length
  const pct = Math.round((done / total) * 100)
  const allDone = done === total

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.setItem(DISMISSED_KEY, '1')
    onDismiss()
  }

  return (
    <Wrap>
      <Header onClick={() => setOpen(o => !o)}>
        <HeaderLeft>
          <RocketIcon><Rocket size={15} /></RocketIcon>
          <div>
            <HeaderTitle>Primeiros passos</HeaderTitle>
            <HeaderSub>{done} de {total} concluídos</HeaderSub>
          </div>
        </HeaderLeft>
        <HeaderRight>
          <ProgressWrap>
            <ProgressBar>
              <ProgressFill $pct={pct} />
            </ProgressBar>
            <ProgressLabel>{pct}%</ProgressLabel>
          </ProgressWrap>
          <DismissBtn onClick={handleDismiss} title="Fechar">
            <X size={13} />
          </DismissBtn>
          {open ? <ChevronUp size={14} color="gray" /> : <ChevronDown size={14} color="gray" />}
        </HeaderRight>
      </Header>

      {open && (
        <Body>
          {steps.map(step => (
            <StepRow key={step.id} $done={step.completed}>
              <StepCheck $done={step.completed}>
                {step.completed && <Check size={12} color="#fff" strokeWidth={3} />}
              </StepCheck>
              <StepInfo>
                <StepLabel $done={step.completed}>{step.label}</StepLabel>
                {!step.completed && <StepDesc>{step.desc}</StepDesc>}
              </StepInfo>
              {!step.completed && step.actionPath && (
                <StepAction onClick={() => navigate(step.actionPath!)}>
                  {step.actionLabel}
                </StepAction>
              )}
            </StepRow>
          ))}
        </Body>
      )}

      {allDone && (
        <SuccessBanner>
          <Check size={16} />
          Configuração completa! Seu escritório está pronto para decolar.
        </SuccessBanner>
      )}
    </Wrap>
  )
}

export { RELATORIOS_KEY }
