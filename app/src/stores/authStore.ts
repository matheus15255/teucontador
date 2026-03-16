import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Escritorio } from '../types'
import { useDataStore } from './dataStore'

interface AuthState {
  user: User | null
  escritorio: Escritorio | null
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
  isInitialized: false,

  loadEscritorio: async (user: User) => {
    const { data: escs } = await supabase.from('escritorios').select('*').eq('user_id', user.id).limit(1)
    let esc = escs?.[0] ?? null
    if (!esc) {
      const nome = user.user_metadata?.nome_completo || user.email || 'Escritório'
      const { data: novos } = await supabase.from('escritorios').insert({ user_id: user.id, nome }).select('*').limit(1)
      esc = novos?.[0] ?? null
    }
    if (esc) {
      set({ escritorio: esc })
      // Dispara preload imediatamente — sem esperar AppLayout montar
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
    set({ user: null, escritorio: null })
  },

  setEscritorio: (e) => set({ escritorio: e }),
}))
