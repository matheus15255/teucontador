import { useAuthStore } from '../stores/authStore'

export function usePermission() {
  const { escritorio, user, memberRole } = useAuthStore()
  const isOwner = !!user && escritorio?.user_id === user.id
  const role = isOwner ? 'admin' : (memberRole ?? 'assistente')

  return {
    role,
    isOwner,
    // contador e admin podem criar/editar
    canEdit:   role === 'admin' || role === 'contador',
    // só admin (dono) pode deletar
    canDelete: role === 'admin',
    // só dono pode convidar/remover membros
    canInvite: isOwner,
  }
}
