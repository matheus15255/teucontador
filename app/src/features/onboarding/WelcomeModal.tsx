import { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { Users, Calendar, TrendingUp, ArrowRight, X } from 'lucide-react'

const STORAGE_KEY = 'teu_welcome_seen_v1'

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
  z-index: 8500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease;
`

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 22px;
  padding: 40px 36px 32px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.25);
  animation: ${slideUp} 0.38s ease;
  border: 1px solid ${({ theme }) => theme.border};
  position: relative;
  font-family: 'Inter', sans-serif;
  @media (max-width: 520px) { padding: 28px 20px 24px; }
`

const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.textDim};
  transition: all 0.15s;
  &:hover { background: ${({ theme }) => theme.surface3}; color: ${({ theme }) => theme.text}; }
`

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
`

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #1a7a4a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
`

const LogoName = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  span { color: #1a7a4a; }
`

const Title = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  margin: 0 0 8px;
  line-height: 1.25;
  em { font-style: italic; color: #1a7a4a; }
`

const Sub = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.textDim};
  margin: 0 0 28px;
  line-height: 1.6;
`

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

const StepCard = styled.div`
  background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const StepIcon = styled.div<{ $color: string }>`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: ${({ $color }) => $color}18;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
`

const StepLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;
`

const StepDesc = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.textDim};
  line-height: 1.4;
`

const CTABtn = styled.button`
  width: 100%;
  padding: 14px;
  background: #1a7a4a;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s, transform 0.15s;
  &:hover { opacity: 0.9; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
`

const TrialNote = styled.div`
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.textDim};
`

const STEPS = [
  {
    icon: <Users size={16} />,
    color: '#3b82f6',
    label: 'Adicione seus clientes',
    desc: 'Cadastre os escritórios e empresas que você atende',
  },
  {
    icon: <Calendar size={16} />,
    color: '#f59e0b',
    label: 'Controle obrigações',
    desc: 'Nunca perca um prazo fiscal com alertas automáticos',
  },
  {
    icon: <TrendingUp size={16} />,
    color: '#1a7a4a',
    label: 'Acompanhe resultados',
    desc: 'Relatórios e DRE gerados automaticamente',
  },
]

interface Props {
  nome: string
  onClose: () => void
}

export function WelcomeModal({ nome, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // small delay so the app loads first
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
    onClose()
  }

  if (!visible) return null

  const firstName = nome?.split(' ')[0] || 'Contador'

  return (
    <Overlay onClick={handleClose}>
      <Card onClick={e => e.stopPropagation()}>
        <CloseBtn onClick={handleClose}><X size={14} /></CloseBtn>

        <LogoRow>
          <LogoIcon>T</LogoIcon>
          <LogoName>TEU<span>contador</span></LogoName>
        </LogoRow>

        <Title>
          Bem-vindo, <em>{firstName}!</em>
        </Title>
        <Sub>
          Seu período gratuito de 14 dias começou. Veja o que você pode fazer agora mesmo:
        </Sub>

        <StepsGrid>
          {STEPS.map(s => (
            <StepCard key={s.label}>
              <StepIcon $color={s.color}>{s.icon}</StepIcon>
              <StepLabel>{s.label}</StepLabel>
              <StepDesc>{s.desc}</StepDesc>
            </StepCard>
          ))}
        </StepsGrid>

        <CTABtn onClick={handleClose}>
          Começar agora <ArrowRight size={16} />
        </CTABtn>

        <TrialNote>
          14 dias grátis · Sem cartão de crédito · Cancele quando quiser
        </TrialNote>
      </Card>
    </Overlay>
  )
}
