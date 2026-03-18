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

    // Validar dados obrigatórios para o pagamento
    const { data: authUser } = await supabase.auth.admin.getUserById(esc.user_id)
    const email = esc.email || authUser?.user?.email
    const telefone = esc.telefone
    const cpf_cnpj = esc.cpf_cnpj

    if (!email) {
      return new Response(JSON.stringify({ error: 'E-mail não cadastrado. Atualize seu perfil antes de assinar.' }), { status: 422, headers: CORS })
    }
    if (!telefone) {
      return new Response(JSON.stringify({ error: 'Telefone não cadastrado. Atualize seu perfil antes de assinar.' }), { status: 422, headers: CORS })
    }
    if (!cpf_cnpj) {
      return new Response(JSON.stringify({ error: 'CPF/CNPJ não cadastrado. Atualize seu perfil antes de assinar.' }), { status: 422, headers: CORS })
    }

    const name = esc.nome || 'Cliente TEUcontador'

    // Criar ou reutilizar customer no AbacatePay
    let customerId: string = esc.abacatepay_customer_id
    let customerData: Record<string, string>

    if (!customerId) {
      const custRes = await fetch(`${API}/customer/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, cellphone: telefone, taxId: cpf_cnpj }),
      })

      if (!custRes.ok) {
        const errBody = await custRes.text()
        return new Response(
          JSON.stringify({ error: `Erro ao criar cliente no AbacatePay (${custRes.status})`, details: errBody }),
          { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
        )
      }

      const custJson = await custRes.json()
      customerId = custJson.data?.id

      if (!customerId) {
        return new Response(
          JSON.stringify({ error: 'AbacatePay não retornou ID do cliente', details: custJson }),
          { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
        )
      }

      await supabase.from('escritorios').update({ abacatepay_customer_id: customerId }).eq('id', esc.id)
    }

    // Criar billing — AbacatePay exige todos os campos do customer mesmo quando já existe
    const billingRes = await fetch(`${API}/billing/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { id: customerId, name, email, cellphone: telefone, taxId: cpf_cnpj },
        products: [{
          externalId: `${esc.id}-${Date.now()}`,
          name: 'TEUcontador — Plano Completo',
          quantity: 1,
          price: 19700,
        }],
        metadata: { escritorio_id: esc.id },
        methods: ['PIX'],
        frequency: 'ONE_TIME',
        returnUrl: `${APP_URL}/app/dashboard`,
        completionUrl: `${APP_URL}/app/dashboard?subscribed=1`,
      }),
    })

    if (!billingRes.ok) {
      const errBody = await billingRes.text()
      return new Response(
        JSON.stringify({ error: `Erro ao criar cobrança no AbacatePay (${billingRes.status})`, details: errBody }),
        { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    const billing = await billingRes.json()
    const url: string = billing.data?.url

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'AbacatePay não retornou URL de pagamento', details: billing }),
        { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ url }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
