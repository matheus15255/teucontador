import styled from 'styled-components'
import { useCheckout } from './useCheckout'
import { ProfileFormModal } from './ProfileFormModal'

const Banner = styled.div`
  background: linear-gradient(90deg, #92400e 0%, #b45309 100%);
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11.5px;
    padding: 8px 12px;
    text-align: center;
  }
`

const Btn = styled.button<{ $loading?: boolean }>`
  background: #fff;
  color: #92400e;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: opacity 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
`

interface Props {
  daysRemaining: number
}

export function TrialBanner({ daysRemaining }: Props) {
  const { loading, showProfileForm, setShowProfileForm, startCheckout, saveProfileAndCheckout } = useCheckout()

  const label = daysRemaining === 1 ? '1 dia restante' : `${daysRemaining} dias restantes`

  return (
    <>
      {showProfileForm && (
        <ProfileFormModal
          loading={loading}
          onConfirm={saveProfileAndCheckout}
          onCancel={() => setShowProfileForm(false)}
        />
      )}
      <Banner>
        <span>Período de teste gratuito — <strong>{label}</strong></span>
        <Btn $loading={loading} onClick={startCheckout} disabled={loading}>
          {loading ? 'Aguarde...' : 'Assinar agora — R$ 197/mês'}
        </Btn>
      </Banner>
    </>
  )
}
