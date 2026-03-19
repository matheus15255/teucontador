import styled, { keyframes, css } from 'styled-components'
import { useCheckout } from './useCheckout'
import { ProfileFormModal } from './ProfileFormModal'
import { Clock } from 'lucide-react'

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`

const Banner = styled.div<{ $urgency: 'low' | 'mid' | 'high' | 'critical' }>`
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 9px 16px;
  flex-shrink: 0;

  background: ${({ $urgency }) =>
    $urgency === 'critical' ? 'linear-gradient(90deg, #991b1b 0%, #dc2626 100%)' :
    $urgency === 'high'     ? 'linear-gradient(90deg, #92400e 0%, #b45309 100%)' :
    $urgency === 'mid'      ? 'linear-gradient(90deg, #92400e 0%, #b45309 100%)' :
                              'linear-gradient(90deg, #14532d 0%, #1a7a4a 100%)'};

  ${({ $urgency }) => $urgency === 'critical' && css`
    animation: ${pulse} 2s ease-in-out infinite;
  `}

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11.5px;
    padding: 8px 12px;
    text-align: center;
  }
`

const Btn = styled.button<{ $loading?: boolean; $urgency: 'low' | 'mid' | 'high' | 'critical' }>`
  background: #fff;
  color: ${({ $urgency }) =>
    $urgency === 'critical' ? '#991b1b' :
    $urgency === 'high'     ? '#92400e' :
    $urgency === 'mid'      ? '#92400e' : '#14532d'};
  border: none;
  border-radius: 6px;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: opacity 0.2s, transform 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  &:hover:not(:disabled) { opacity: 0.88; transform: scale(1.02); }
`

const SocialProof = styled.span`
  opacity: 0.75;
  font-size: 11.5px;
  @media (max-width: 640px) { display: none; }
`

interface Props {
  daysRemaining: number
}

export function TrialBanner({ daysRemaining: d }: Props) {
  const { loading, showProfileForm, setShowProfileForm, startCheckout, saveProfileAndCheckout } = useCheckout()

  const urgency: 'low' | 'mid' | 'high' | 'critical' =
    d <= 1  ? 'critical' :
    d <= 3  ? 'high'     :
    d <= 7  ? 'mid'      : 'low'

  const label =
    d === 0 ? 'Seu período termina hoje!' :
    d === 1 ? 'Último dia de teste — assine agora para não perder seus dados' :
    d <= 3  ? `Apenas ${d} dias restantes — não perca seus dados` :
              `${d} dias de teste gratuito restantes`

  const btnLabel = loading ? 'Aguarde...' :
    d <= 1 ? 'Assinar antes que expire →' : 'Assinar agora — R$ 197/mês'

  return (
    <>
      {showProfileForm && (
        <ProfileFormModal
          loading={loading}
          onConfirm={saveProfileAndCheckout}
          onCancel={() => setShowProfileForm(false)}
        />
      )}
      <Banner $urgency={urgency}>
        <Clock size={13} style={{ flexShrink: 0, opacity: 0.85 }} />
        <span>{label}</span>
        <SocialProof>· +100 escritórios já assinaram</SocialProof>
        <Btn $urgency={urgency} $loading={loading} onClick={startCheckout} disabled={loading}>
          {btnLabel}
        </Btn>
      </Banner>
    </>
  )
}
