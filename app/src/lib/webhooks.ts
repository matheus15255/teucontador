import { supabase } from './supabase'

export async function fireWebhooks(escId: string, evento: string, payload: Record<string, any>) {
  try {
    const { data } = await supabase
      .from('webhooks')
      .select('url, secret')
      .eq('escritorio_id', escId)
      .eq('evento', evento)
      .eq('ativo', true)

    if (!data || data.length === 0) return

    const body = JSON.stringify({ evento, timestamp: new Date().toISOString(), data: payload })

    await Promise.allSettled(
      data.map(wh =>
        fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(wh.secret ? { 'X-Webhook-Secret': wh.secret } : {}),
          },
          body,
        }).catch(() => {})
      )
    )
  } catch {
    // webhook failures are silent
  }
}
