import { useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'

const TRIAL_DAYS = 14

export function useSubscription() {
  const { escritorio } = useAuthStore()

  const trialDaysRemaining = useMemo(() => {
    if (!escritorio?.created_at) return TRIAL_DAYS
    const elapsed = Math.floor(
      (Date.now() - new Date(escritorio.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(0, TRIAL_DAYS - elapsed)
  }, [escritorio?.created_at])

  const status = escritorio?.subscription_status ?? 'trial'
  const isActive  = status === 'active'
  const isTrial   = status === 'trial' && trialDaysRemaining > 0
  const isExpired = !isActive && trialDaysRemaining <= 0

  return { trialDaysRemaining, isActive, isTrial, isExpired, status }
}
