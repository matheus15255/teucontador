import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ClienteSession {
  id: string
  razao_social: string
  cnpj?: string
  regime?: string
  email_acesso: string
  senha_acesso: string
  honorarios?: number
  situacao?: string
  responsavel?: string
  municipio?: string
  estado?: string
}

interface ClientePortalState {
  session: ClienteSession | null
  setSession: (s: ClienteSession | null) => void
  logout: () => void
}

export const useClientePortalStore = create<ClientePortalState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (s) => set({ session: s }),
      logout: () => set({ session: null }),
    }),
    { name: 'cliente-portal-session' }
  )
)
