import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Proteção: aceita chamada do pg_cron (sem auth) com secret, ou do frontend autenticado
  const notifySecret = Deno.env.get('NOTIFY_SECRET')
  const url = new URL(req.url)
  const providedSecret = url.searchParams.get('secret') ?? req.headers.get('x-notify-secret') ?? ''
  const isServiceRole = req.headers.get('authorization')?.startsWith('Bearer ')

  if (notifySecret && providedSecret !== notifySecret && !isServiceRole) {
    return new Response('Unauthorized', { status: 401 })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY não configurada' }), { status: 500 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Se chamada do frontend (teste manual), pode passar escritorio_id específico
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
  const singleEscId: string | null = body.escritorio_id ?? url.searchParams.get('escritorio_id') ?? null

  // Buscar escritórios com notificação ativa
  let escsQuery = supabase
    .from('escritorios')
    .select('id, nome, email, notif_dias_antecedencia')
    .eq('notif_email_ativo', true)
    .not('email', 'is', null)

  if (singleEscId) escsQuery = escsQuery.eq('id', singleEscId)

  const { data: escritorios, error: escErr } = await escsQuery
  if (escErr) return new Response(JSON.stringify({ error: escErr.message }), { status: 500 })

  let totalEnviados = 0
  const erros: string[] = []

  for (const esc of (escritorios ?? [])) {
    const dias = esc.notif_dias_antecedencia ?? 7
    const hoje = new Date()
    const limite = new Date()
    limite.setDate(hoje.getDate() + dias)

    const hojeStr  = hoje.toISOString().split('T')[0]
    const limiteStr = limite.toISOString().split('T')[0]

    // Buscar obrigações pendentes/atrasadas nos próximos X dias
    const { data: obs } = await supabase
      .from('obrigacoes')
      .select('tipo, vencimento, status, clientes(razao_social)')
      .eq('escritorio_id', esc.id)
      .neq('status', 'transmitido')
      .gte('vencimento', hojeStr)
      .lte('vencimento', limiteStr)
      .order('vencimento')
      .limit(50)

    if (!obs || obs.length === 0) continue

    // Montar HTML do email
    const linhas = obs.map((o: any) => {
      const venc = new Date(o.vencimento + 'T00:00:00')
      const diasRestantes = Math.round((venc.getTime() - hoje.getTime()) / 86400000)
      const urgLabel = diasRestantes === 0 ? '⚠️ Vence hoje' : diasRestantes === 1 ? '🔴 Amanhã' : `📅 Em ${diasRestantes} dias`
      const clienteNome = o.clientes?.razao_social ?? '—'
      const dataFormatada = venc.toLocaleDateString('pt-BR')
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px">${o.tipo}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px">${clienteNome}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px">${dataFormatada}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px">${urgLabel}</td>
        </tr>`
    }).join('')

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#14532d 0%,#1a7a4a 100%);padding:28px 32px">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:2px;text-transform:uppercase">TEUcontador</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:400">
        📋 Obrigações vencendo em breve
      </h1>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px">
      <p style="color:#374151;font-size:14px;margin:0 0 20px">
        Olá, <strong>${esc.nome}</strong>! Você tem <strong>${obs.length} obrigação${obs.length !== 1 ? 'ões' : ''}</strong>
        vencendo nos próximos <strong>${dias} dias</strong>:
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Obrigação</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Cliente</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Vencimento</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Prazo</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
      <div style="margin-top:24px;text-align:center">
        <a href="https://app.teucontador.com.br/obrigacoes"
           style="display:inline-block;background:#1a7a4a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
          Ver no sistema →
        </a>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center">
        Você recebe este email porque configurou alertas de obrigações no TEUcontador.<br>
        Para desativar, acesse Configurações → Notificações.
      </p>
    </div>
  </div>
</body>
</html>`

    // Enviar via Resend
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TEUcontador <alertas@teucontador.com.br>',
        to: [esc.email],
        subject: `⚠️ ${obs.length} obrigação${obs.length !== 1 ? 'ões' : ''} vencendo nos próximos ${dias} dias — ${esc.nome}`,
        html,
      }),
    })

    if (resp.ok) {
      totalEnviados++
      // Atualiza timestamp do último envio
      await supabase
        .from('escritorios')
        .update({ notif_ultimo_envio: new Date().toISOString() })
        .eq('id', esc.id)
    } else {
      const errBody = await resp.text()
      erros.push(`${esc.email}: ${errBody}`)
      console.error(`Erro ao enviar para ${esc.email}:`, errBody)
    }
  }

  return new Response(
    JSON.stringify({ ok: true, enviados: totalEnviados, erros }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
