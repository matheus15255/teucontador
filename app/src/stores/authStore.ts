import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Escritorio } from '../types'
import { useDataStore } from './dataStore'

interface AuthState {
  user: User | null
  escritorio: Escritorio | null
  memberRole: 'admin' | 'contador' | 'assistente' | null  // null = dono (admin)
  isInitialized: boolean
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  setEscritorio: (e: Escritorio) => void
  loadEscritorio: (user: User) => Promise<void>
}

let _authListenerUnsubscribe: (() => void) | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  escritorio: null,
  memberRole: null,
  isInitialized: false,

  loadEscritorio: async (user: User) => {
    // 1. Escritório próprio (dono)
    const { data: escs, error: escErr } = await supabase
      .from('escritorios').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: true }).limit(1)

    if (escErr) console.error('[authStore] loadEscritorio escritorios:', escErr.message)

    if (escs?.[0]) {
      // Aceita convites pendentes com o mesmo email (criou conta após convite)
      await supabase.from('membros_escritorio')
        .update({ user_id: user.id, status: 'ativo' })
        .eq('email', user.email!)
        .eq('status', 'pendente')
      set({ escritorio: escs[0], memberRole: null })
      useDataStore.getState().preload(escs[0].id)
      return
    }

    // 2. Membro ativo de outro escritório
    const { data: membros } = await supabase
      .from('membros_escritorio')
      .select('*, escritorios(*)')
      .eq('user_id', user.id)
      .eq('status', 'ativo')
      .limit(1)

    if (membros?.[0]?.escritorios) {
      const esc = membros[0].escritorios as Escritorio
      set({ escritorio: esc, memberRole: membros[0].role })
      useDataStore.getState().preload(esc.id)
      return
    }

    // 3. Convite pendente pelo email
    const { data: pendentes } = await supabase
      .from('membros_escritorio')
      .select('*, escritorios(*)')
      .eq('email', user.email!)
      .eq('status', 'pendente')
      .limit(1)

    if (pendentes?.[0]?.escritorios) {
      await supabase.from('membros_escritorio')
        .update({ user_id: user.id, status: 'ativo' })
        .eq('id', pendentes[0].id)
      const esc = pendentes[0].escritorios as Escritorio
      set({ escritorio: esc, memberRole: pendentes[0].role })
      useDataStore.getState().preload(esc.id)
      return
    }

    // 4. Sem escritório — cria novo
    const nome = user.user_metadata?.nome_completo || user.email || 'Escritório'
    const { data: novos } = await supabase
      .from('escritorios').insert({ user_id: user.id, nome }).select('*').limit(1)
    const esc = novos?.[0] ?? null
    if (esc) {
      set({ escritorio: esc, memberRole: null })
      useDataStore.getState().preload(esc.id)
    }
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    set({ user, isInitialized: true })
    if (user) await get().loadEscritorio(user)

    if (_authListenerUnsubscribe) _authListenerUnsubscribe()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      set({ user: u })
      if (u) await get().loadEscritorio(u)
      else set({ escritorio: null })
    })
    _authListenerUnsubscribe = () => subscription.unsubscribe()
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, escritorio: null, memberRole: null })
  },

  setEscritorio: (e) => set({ escritorio: e }),
}))
