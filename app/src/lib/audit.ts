import { supabase } from './supabase'

export async function logAudit(params: {
  escId: string
  tabela: string
  registroId?: string
  acao: 'criar' | 'editar' | 'excluir'
  dadosAntes?: Record<string, any>
  dadosDepois?: Record<string, any>
  usuarioEmail?: string
}) {
  try {
    await supabase.from('audit_log').insert({
      escritorio_id: params.escId,
      tabela: params.tabela,
      registro_id: params.registroId ?? null,
      acao: params.acao,
      dados_antes: params.dadosAntes ?? null,
      dados_depois: params.dadosDepois ?? null,
      usuario_email: params.usuarioEmail ?? null,
    })
  } catch {
    // audit failures should not break the main flow
  }
}
