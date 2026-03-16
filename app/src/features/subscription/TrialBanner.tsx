import { useState } from 'react'
import styled from 'styled-components'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'sonner'

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
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const handleAssinar = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (error || !data?.url) throw new Error(error?.message || 'Erro ao criar checkout')
      window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar pagamento')
      setLoading(false)
    }
  }

  const label = daysRemaining === 1 ? '1 dia restante' : `${daysRemaining} dias restantes`

  return (
    <Banner>
      <span>Período de teste gratuito — <strong>{label}</strong></span>
      <Btn $loading={loading} onClick={handleAssinar} disabled={loading}>
        {loading ? 'Aguarde...' : 'Assinar agora'}
      </Btn>
    </Banner>
  )
}
