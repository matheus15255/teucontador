import { useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'

const TRIAL_DAYS = 14
const WARN_DAYS  = 7   // mostra banner quando assinatura paga tem ≤7 dias

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export function useSubscription() {
  const { escritorio } = useAuthStore()

  // ── Dias restantes do período de teste ───────────────────────────────────
  const trialDaysRemaining = useMemo(() => {
    if (!escritorio?.created_at) return TRIAL_DAYS
    const elapsed = Math.floor(
      (Date.now() - new Date(escritorio.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(0, TRIAL_DAYS - elapsed)
  }, [escritorio?.created_at])

  // ── Dias restantes da assinatura paga ────────────────────────────────────
  const subscriptionDaysRemaining = useMemo(() => {
    if (!escritorio?.subscription_expires_at) return null
    const days = daysBetween(new Date(), new Date(escritorio.subscription_expires_at))
    return Math.max(0, days)
  }, [escritorio?.subscription_expires_at])

  const status = escritorio?.subscription_status ?? 'trial'

  // Ativo = status 'active' E assinatura ainda não venceu (ou não tem data configurada)
  const isActive = status === 'active' && (
    subscriptionDaysRemaining === null || subscriptionDaysRemaining > 0
  )

  // Em trial = status 'trial' com dias ainda sobrando
  const isTrial = status === 'trial' && trialDaysRemaining > 0

  // Expirado = não ativo e não em trial
  const isExpired = !isActive && !isTrial

  // Quantos dias mostrar no banner
  const daysRemaining = isActive
    ? (subscriptionDaysRemaining ?? null)
    : trialDaysRemaining

  // Mostrar banner: sempre durante trial OU assinatura paga com ≤ WARN_DAYS
  const showBanner = isTrial || (
    isActive &&
    subscriptionDaysRemaining !== null &&
    subscriptionDaysRemaining <= WARN_DAYS
  )

  // É renovação (assinatura paga) vs trial
  const isRenewal = isActive && subscriptionDaysRemaining !== null && subscriptionDaysRemaining <= WARN_DAYS

  return {
    trialDaysRemaining,
    subscriptionDaysRemaining,
    daysRemaining,
    isActive,
    isTrial,
    isExpired,
    showBanner,
    isRenewal,
    status,
  }
}
