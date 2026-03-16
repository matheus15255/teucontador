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

    const body = await req.json().catch(() => ({}))
    const escritorioId: string = body.escritorioId

    if (!escritorioId) {
      return new Response(JSON.stringify({ error: 'escritorioId obrigatório' }), { status: 400, headers: CORS })
    }

    const { data: esc } = await supabase
      .from('escritorios')
      .select('*')
      .eq('id', escritorioId)
      .single()

    if (!esc) {
      return new Response(JSON.stringify({ error: 'Escritório não encontrado' }), { status: 404, headers: CORS })
    }

    // Criar ou reutilizar customer no AbacatePay
    let customerId: string = esc.abacatepay_customer_id
    let customerData: Record<string, string>

    if (!customerId) {
      const { data: user } = await supabase.auth.admin.getUserById(esc.user_id)
      const email = esc.email || user?.user?.email || 'sem-email@teucontador.com.br'
      const name  = esc.nome || 'Cliente TEUcontador'

      const custRes = await fetch(`${API}/customer/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          cellphone: esc.telefone || '11999999999',
          taxId: esc.cpf_cnpj || '529.982.247-25',
        }),
      })
      const custJson = await custRes.json()
      console.log('Customer response:', JSON.stringify(custJson))

      customerId = custJson.data?.id
      customerData = { id: customerId, name, email, cellphone: esc.telefone || '11999999999', taxId: esc.cpf_cnpj || '529.982.247-25' }

      if (customerId) {
        await supabase.from('escritorios').update({ abacatepay_customer_id: customerId }).eq('id', esc.id)
      }
    } else {
      const { data: user } = await supabase.auth.admin.getUserById(esc.user_id)
      customerData = {
        id: customerId,
        name: esc.nome || 'Cliente',
        email: esc.email || user?.user?.email || '',
        cellphone: esc.telefone || '11999999999',
        taxId: esc.cpf_cnpj || '529.982.247-25',
      }
    }

    // Criar billing
    const billingRes = await fetch(`${API}/billing/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: customerData,
        products: [{
          externalId: esc.id,
          name: 'TEUcontador — Plano Pro',
          quantity: 1,
          price: 19700,
        }],
        methods: ['PIX'],
        frequency: 'ONE_TIME',
        returnUrl: `${APP_URL}/app/dashboard`,
        completionUrl: `${APP_URL}/app/dashboard?subscribed=1`,
      }),
    })

    const billing = await billingRes.json()
    console.log('Billing response:', JSON.stringify(billing))

    const url: string = billing.data?.url

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Erro AbacatePay', details: billing }),
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
