import styled, { keyframes } from 'styled-components'
import { Check, Lock } from 'lucide-react'
import { useCheckout } from './useCheckout'
import { ProfileFormModal } from './ProfileFormModal'

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease;
`

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 20px;
  padding: 40px 36px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
  animation: ${slideUp} 0.35s ease;
  border: 1px solid ${({ theme }) => theme.border};

  @media (max-width: 480px) {
    padding: 28px 20px;
    border-radius: 16px;
  }
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
`

const LogoIcon = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: ${({ theme }) => theme.green};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
`

const LogoName = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  span { color: ${({ theme }) => theme.green}; }
`

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(234, 88, 12, 0.1);
  color: #ea580c;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11.5px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  margin-bottom: 16px;
`

const Title = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 8px;
  line-height: 1.3;
`

const Sub = styled.p`
  font-size: 13.5px;
  color: ${({ theme }) => theme.textDim};
  font-family: 'Inter', sans-serif;
  margin: 0 0 24px;
  line-height: 1.6;
`

const PlanBox = styled.div`
  border: 2px solid ${({ theme }) => theme.green};
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
  background: ${({ theme }) => theme.greenLight};
`

const PlanName = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 4px;
`

const Price = styled.div`
  font-family: 'Inter', sans-serif;
  color: ${({ theme }) => theme.green};
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  span {
    font-size: 14px;
    font-weight: 400;
    color: ${({ theme }) => theme.textDim};
  }
`

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Feature = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: ${({ theme }) => theme.textMid};
`

const CheckIcon = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${({ theme }) => theme.green};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const CTA = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 14px;
  background: ${({ theme }) => theme.green};
  color: #fff;
  border: none;
  border-radius: 11px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: opacity 0.2s, transform 0.15s;
  margin-top: 4px;
  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:active:not(:disabled) { transform: translateY(0); }
`

const SignOutLink = styled.button`
  display: block;
  width: 100%;
  text-align: center;
  margin-top: 14px;
  font-size: 12px;
  color: ${({ theme }) => theme.textDim};
  font-family: 'Inter', sans-serif;
  background: none;
  border: none;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.text}; }
`

const FEATURES = [
  'Clientes e empresas ilimitados',
  'Lançamentos e plano de contas',
  'Folha de pagamento / DP',
  'Obrigações e agenda fiscal',
  'Honorários e NFS-e',
  'Fluxo de caixa e relatórios',
  'Portal do cliente',
  'Suporte por WhatsApp',
]

interface Props {
  onSignOut: () => void
  expired?: 'trial' | 'subscription'
}

export function PaywallModal({ onSignOut, expired = 'trial' }: Props) {
  const { loading, showProfileForm, setShowProfileForm, startCheckout, saveProfileAndCheckout } = useCheckout()

  const isSubscription = expired === 'subscription'

  return (
    <>
    {showProfileForm && (
      <ProfileFormModal
        loading={loading}
        onConfirm={saveProfileAndCheckout}
        onCancel={() => setShowProfileForm(false)}
      />
    )}
    <Overlay>
      <Card>
        <Logo>
          <img src="/img/logo.png" alt="TEUcontador" style={{ height: 100, width: 'auto', display: 'block' }} />
        </Logo>

        <Badge>
          <Lock size={11} />
          {isSubscription ? 'Assinatura expirada' : 'Período de teste encerrado'}
        </Badge>

        <Title>
          {isSubscription ? 'Renove sua assinatura' : 'Continue usando o TEUcontador'}
        </Title>
        <Sub>
          {isSubscription
            ? 'Sua assinatura expirou. Renove agora para recuperar o acesso completo à plataforma e não perder seus dados.'
            : 'Seu período gratuito de 14 dias terminou. Assine para continuar com acesso completo à plataforma.'
          }
        </Sub>

        <PlanBox>
          <PlanName>Plano Completo</PlanName>
          <Price>R$ 197<span>/mês</span></Price>
          <FeatureList>
            {FEATURES.map(f => (
              <Feature key={f}>
                <CheckIcon><Check size={10} color="#fff" strokeWidth={3} /></CheckIcon>
                {f}
              </Feature>
            ))}
          </FeatureList>
        </PlanBox>

        <CTA $loading={loading} onClick={startCheckout} disabled={loading}>
          {loading ? 'Aguarde...' : isSubscription ? 'Renovar assinatura — R$ 197/mês' : 'Assinar agora — R$ 197/mês'}
        </CTA>

        <SignOutLink onClick={onSignOut}>Sair da conta</SignOutLink>
      </Card>
    </Overlay>
    </>
  )
}
