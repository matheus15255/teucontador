import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const rawBody = await req.text()
  const body = JSON.parse(rawBody)

  // AbacatePay v1 webhook payload: { event, billing: { ... } }
  const event: string = body.event
  const billing = body.billing ?? body.data

  // Identificar escritório pelo externalId do produto
  const escritorioId: string = billing?.products?.[0]?.externalId ?? billing?.metadata?.escritorio_id

  console.log('Webhook event:', event, 'escritorioId:', escritorioId)

  if (!escritorioId) return new Response('missing escritorio_id', { status: 400 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Eventos de pagamento confirmado
  if (['billing.paid', 'billing.completed', 'checkout.completed', 'subscription.completed', 'subscription.renewed'].includes(event)) {
    await supabase
      .from('escritorios')
      .update({ subscription_status: 'active', subscription_id: billing?.id })
      .eq('id', escritorioId)
  }

  // Eventos de cancelamento
  if (['billing.cancelled', 'billing.refunded', 'subscription.cancelled'].includes(event)) {
    await supabase
      .from('escritorios')
      .update({ subscription_status: 'cancelled' })
      .eq('id', escritorioId)
  }

  return new Response('ok', { status: 200 })
})
