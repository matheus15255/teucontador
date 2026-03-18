import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Verificar token secreto do webhook (deve ser configurado no AbacatePay como query param)
  const webhookToken = Deno.env.get('ABACATEPAY_WEBHOOK_TOKEN')
  if (webhookToken) {
    const url = new URL(req.url)
    const receivedToken = url.searchParams.get('token') ?? req.headers.get('x-webhook-token') ?? ''
    if (receivedToken !== webhookToken) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    const rawBody = await req.text()
    body = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const event: string = (body.event as string) ?? ''
  const billing = (body.billing ?? body.data) as Record<string, unknown> | undefined

  // Identificar escritório pelo externalId do produto
  const products = billing?.products as Array<Record<string, unknown>> | undefined
  const escritorioId: string = (products?.[0]?.externalId as string) ??
    ((billing?.metadata as Record<string, unknown>)?.escritorio_id as string) ?? ''

  if (!escritorioId) {
    return new Response('missing escritorio_id', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Eventos de pagamento confirmado
  if (['billing.paid', 'billing.completed', 'checkout.completed', 'subscription.completed', 'subscription.renewed'].includes(event)) {
    await supabase
      .from('escritorios')
      .update({ subscription_status: 'active', subscription_id: billing?.id as string })
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
