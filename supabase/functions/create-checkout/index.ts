import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const ABACATEPAY_API_KEY  = Deno.env.get('ABACATEPAY_API_KEY')!
    const ABACATEPAY_PRODUCT_ID = Deno.env.get('ABACATEPAY_PRODUCT_ID')!
    const APP_URL = Deno.env.get('APP_URL') || 'https://teucontador.vercel.app'
    const API = 'https://api.abacatepay.com/v2'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Autenticar usuário pelo JWT
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })

    // Buscar escritório
    const { data: esc } = await supabase
      .from('escritorios')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!esc) return new Response(JSON.stringify({ error: 'Escritório não encontrado' }), { status: 404, headers: CORS })

    // Criar/reusar customer no AbacatePay
    let customerId: string = esc.abacatepay_customer_id
    if (!customerId) {
      const res = await fetch(`${API}/customers/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: esc.nome, metadata: { escritorio_id: esc.id } }),
      })
      const json = await res.json()
      customerId = json.data?.id
      if (customerId) {
        await supabase.from('escritorios').update({ abacatepay_customer_id: customerId }).eq('id', esc.id)
      }
    }

    // Criar checkout de assinatura
    const res = await fetch(`${API}/subscriptions/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: ABACATEPAY_PRODUCT_ID, quantity: 1 }],
        customerId,
        returnUrl: `${APP_URL}/app/dashboard`,
        completionUrl: `${APP_URL}/app/dashboard?subscribed=1`,
        metadata: { escritorio_id: esc.id, user_id: user.id },
      }),
    })

    const json = await res.json()
    const url: string = json.data?.url

    return new Response(JSON.stringify({ url }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
