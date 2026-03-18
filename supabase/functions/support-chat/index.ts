import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { error: authError } = await supabase.auth.getUser()
    if (authError) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const { messages } = await req.json()

    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''

    const system = `Você é o assistente virtual do TEUcontador, um sistema de gestão contábil brasileiro.
Seu papel é ajudar os usuários (contadores e escritórios de contabilidade) a usar o sistema.

O TEUcontador possui os seguintes módulos:
- Dashboard: visão geral com KPIs, honorários, receitas e despesas
- Clientes: cadastro e gestão de clientes/empresas
- Lançamentos Contábeis: partidas dobradas, histórico, contas de débito e crédito
- Plano de Contas: estrutura contábil personalizada
- Relatórios: exportação em PDF e Excel
- Folha / DP: departamento pessoal e folha de pagamento
- Obrigações Fiscais: controle de prazos e obrigações
- Agenda Fiscal: calendário de vencimentos
- Conciliação Bancária: importação de OFX e vinculação com lançamentos
- Honorários: controle de cobranças mensais
- NFS-e: emissão de notas fiscais de serviço
- Fluxo de Caixa: controle financeiro
- Atendimentos: registro de atendimentos a clientes
- Controle de Tempo: cronômetro e registro de horas
- Configurações: perfil do escritório, tema, plano de assinatura

Instruções importantes:
1. Responda em português brasileiro, de forma direta e objetiva.
2. Limite cada resposta a no máximo 3 parágrafos curtos.
3. Tente sempre resolver a dúvida do usuário com as informações disponíveis.
4. Use marcadores ou listas quando ajudar a clareza.
5. SOMENTE inclua a tag [SUPORTE_HUMANO] no final da resposta se a questão envolver:
   - Problemas técnicos graves que você genuinamente não consegue resolver
   - Perda de dados confirmada
   - Problemas de cobrança ou pagamento
   - Solicitações que exigem ação de um humano no sistema
   NÃO use [SUPORTE_HUMANO] para dúvidas comuns de uso, mesmo que o usuário mencione "erro" ou "problema" — tente resolver primeiro.`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system,
        messages,
      }),
    })

    const data = await resp.json()

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Erro ao chamar IA' }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const raw: string = data.content?.[0]?.text ?? ''
    const showSupport = raw.includes('[SUPORTE_HUMANO]')
    const text = raw.replace('[SUPORTE_HUMANO]', '').trim()

    return new Response(JSON.stringify({ text, showSupport }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
