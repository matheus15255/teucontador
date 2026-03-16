import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const ABACATEPAY_API_KEY = Deno.env.get('ABACATEPAY_API_KEY')!
    const APP_URL = Deno.env.get('APP_URL') || 'https://teucontador-koda.vercel.app'
    const API = 'https://api.abacatepay.com/v1'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Autenticar usuário pelo JWT
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })
    }

    // Buscar escritório
    const { data: esc } = await supabase
      .from('escritorios')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!esc) {
      return new Response(JSON.stringify({ error: 'Escritório não encontrado' }), { status: 404, headers: CORS })
    }

    // Criar billing no AbacatePay v1
    const billingRes = await fetch(`${API}/billing/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [{
          externalId: esc.id,
          name: 'TEUcontador — Plano Pro',
          quantity: 1,
          price: 19700, // R$ 197,00 em centavos
        }],
        methods: ['PIX'],
        frequency: 'ONE_TIME',
        returnUrl: `${APP_URL}/app/dashboard`,
        completionUrl: `${APP_URL}/app/dashboard?subscribed=1`,
        metadata: { escritorio_id: esc.id, user_id: user.id },
      }),
    })

    const billing = await billingRes.json()
    console.log('AbacatePay billing response:', JSON.stringify(billing))

    const url: string = billing.data?.url

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Erro ao criar cobrança', details: billing }),
        { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ url }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
