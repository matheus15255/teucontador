import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const body = await req.json()
  const event: string = body.event
  const data = body.data

  const escritorioId: string = data?.metadata?.escritorio_id
  if (!escritorioId) return new Response('missing escritorio_id', { status: 400 })

  if (event === 'subscription.completed' || event === 'subscription.renewed') {
    await supabase
      .from('escritorios')
      .update({ subscription_status: 'active', subscription_id: data?.id })
      .eq('id', escritorioId)
  } else if (event === 'subscription.cancelled') {
    await supabase
      .from('escritorios')
      .update({ subscription_status: 'cancelled' })
      .eq('id', escritorioId)
  }

  return new Response('ok', { status: 200 })
})
