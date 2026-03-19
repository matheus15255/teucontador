import styled, { keyframes, css } from 'styled-components'
import { useCheckout } from './useCheckout'
import { ProfileFormModal } from './ProfileFormModal'
import { Clock, RefreshCw } from 'lucide-react'

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
  daysRemaining: number | null
  isRenewal?: boolean
}

export function TrialBanner({ daysRemaining: d, isRenewal = false }: Props) {
  const { loading, showProfileForm, setShowProfileForm, startCheckout, saveProfileAndCheckout } = useCheckout()

  const days = d ?? 0

  const urgency: 'low' | 'mid' | 'high' | 'critical' =
    days <= 1 ? 'critical' :
    days <= 3 ? 'high'     :
    days <= 7 ? 'mid'      : 'low'

  // Mensagens diferenciadas para trial vs renovação
  const label = isRenewal
    ? days === 0 ? 'Sua assinatura vence hoje — renove agora para não perder o acesso'
    : days === 1 ? 'Último dia de assinatura — renove agora'
    : days <= 3  ? `Sua assinatura vence em ${days} dias — renove para continuar`
    :              `Sua assinatura vence em ${days} dias`
    : days === 0 ? 'Seu período de teste termina hoje!'
    : days === 1 ? 'Último dia de teste — assine agora para não perder seus dados'
    : days <= 3  ? `Apenas ${days} dias restantes — não perca seus dados`
    :              `${days} dias de teste gratuito restantes`

  const btnLabel = loading ? 'Aguarde...' :
    isRenewal
      ? (days <= 1 ? 'Renovar antes que expire →' : 'Renovar assinatura')
      : (days <= 1 ? 'Assinar antes que expire →' : 'Assinar agora — R$ 197/mês')

  const Icon = isRenewal ? RefreshCw : Clock

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
        <Icon size={13} style={{ flexShrink: 0, opacity: 0.85 }} />
        <span>{label}</span>
        {!isRenewal && <SocialProof>· +100 escritórios já assinaram</SocialProof>}
        <Btn $urgency={urgency} $loading={loading} onClick={startCheckout} disabled={loading}>
          {btnLabel}
        </Btn>
      </Banner>
    </>
  )
}
