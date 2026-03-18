import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'sonner'

export function useCheckout() {
  const { escritorio, setEscritorio } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)

  const needsProfile = () =>
    !escritorio?.telefone || !escritorio?.cpf_cnpj

  const startCheckout = async () => {
    if (needsProfile()) {
      setShowProfileForm(true)
      return
    }
    await _doCheckout()
  }

  const saveProfileAndCheckout = async (telefone: string, cpf_cnpj: string) => {
    if (!escritorio) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('escritorios')
        .update({ telefone, cpf_cnpj })
        .eq('id', escritorio.id)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      setEscritorio(data)
      setShowProfileForm(false)
      await _doCheckout()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar perfil')
      setLoading(false)
    }
  }

  const _doCheckout = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { escritorioId: escritorio?.id },
      })

      // Extrair mensagem real da edge function (Supabase esconde no context)
      if (error) {
        let msg = error.message
        try {
          const ctx = (error as any).context
          const body = ctx instanceof Response
            ? await ctx.json()
            : typeof ctx?.body === 'string'
              ? JSON.parse(ctx.body)
              : ctx
          if (body?.error) msg = body.error
        } catch { /* usa error.message mesmo */ }
        throw new Error(msg)
      }

      if (!data?.url) throw new Error('Erro ao gerar link de pagamento')
      window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar pagamento')
      setLoading(false)
    }
  }

  return { loading, showProfileForm, setShowProfileForm, startCheckout, saveProfileAndCheckout }
}
