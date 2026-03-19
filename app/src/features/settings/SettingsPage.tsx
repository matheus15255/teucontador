import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Save, User, Building2, Shield, Moon, Key, Users, UserPlus, Trash2, Crown, CheckCircle, Clock, Bell, Send } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useTheme } from '../../styles/ThemeProvider'
import type { Escritorio, MembroEscritorio } from '../../types'

const PageHeader = styled.div`margin-bottom: 24px;`
const PageTitle = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const Layout = styled.div`display: grid; grid-template-columns: 220px 1fr; gap: 20px; @media (max-width: 768px) { grid-template-columns: 1fr; }`

const SideNav = styled.div`display: flex; flex-direction: column; gap: 2px;`

const NavItem = styled.button<{ $active: boolean }>`
  display: flex; align-items: center; gap: 10px; padding: 10px 13px; border-radius: 9px;
  cursor: pointer; width: 100%; font-size: 13px;
  font-weight: ${({ $active }) => $active ? 500 : 400};
  color: ${({ theme, $active }) => $active ? theme.green : theme.textMid};
  background: ${({ theme, $active }) => $active ? theme.greenLight : 'transparent'};
  border: 1px solid ${({ $active }) => $active ? 'rgba(26,122,74,0.15)' : 'transparent'};
  font-family: 'Inter', sans-serif; text-align: left; transition: all 0.2s;
  &:hover { background: ${({ theme, $active }) => $active ? theme.greenLight : theme.surface2}; }
`

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`

const CardHead = styled.div`
  padding: 18px 22px; border-bottom: 1px solid ${({ theme }) => theme.border};
`
const CardTitle = styled.div`
  font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 400; color: ${({ theme }) => theme.text};
`
const CardSub = styled.div`font-size: 12px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const CardBody = styled.div`padding: 22px;`

const FormGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 16px; @media (max-width: 600px) { grid-template-columns: 1fr; }`

const Field = styled.div`margin-bottom: 0;`
const FieldLabel = styled.label`
  display: block; font-size: 10px; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; color: ${({ theme }) => theme.textDim}; margin-bottom: 6px;
`
const Input = styled.input`
  width: 100%; padding: 10px 14px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; font-size: 13px;
  color: ${({ theme }) => theme.text}; outline: none; font-family: 'Inter', sans-serif;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
  &::placeholder { color: ${({ theme }) => theme.textDim}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

const Select = styled.select`
  width: 100%; padding: 10px 14px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; font-size: 13px;
  color: ${({ theme }) => theme.text}; outline: none; font-family: 'Inter', sans-serif;
  cursor: pointer; &:focus { border-color: ${({ theme }) => theme.greenMid}; }
`

const SaveBtn = styled(motion.button)`
  display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 9px;
  background: ${({ theme }) => theme.green}; color: #fff; border: none; font-size: 13px; font-weight: 600;
  font-family: 'Inter', sans-serif; cursor: pointer; box-shadow: 0 3px 12px rgba(26,122,74,0.25);
  margin-top: 20px; transition: background 0.2s;
  &:hover { background: ${({ theme }) => theme.greenMid}; }
`

const ToggleRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid ${({ theme }) => theme.border};
  &:last-child { border-bottom: none; }
`
const ToggleLabel = styled.div`font-size: 13px; color: ${({ theme }) => theme.text};`
const ToggleSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`
const Toggle = styled.div<{ $on: boolean }>`
  width: 40px; height: 22px; border-radius: 11px; cursor: pointer; position: relative;
  background: ${({ $on, theme }) => $on ? theme.green : theme.border2}; transition: background 0.3s;
  &::after { content: ''; position: absolute; width: 16px; height: 16px; background: #fff; border-radius: 50%;
    top: 3px; left: ${({ $on }) => $on ? '21px' : '3px'}; transition: left 0.3s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
`

const PlanBadge = styled.div`
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px;
  background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green};
  border: 1px solid rgba(26,122,74,0.2); font-size: 12px; font-weight: 600;
`

const AvatarLarge = styled.div`
  width: 64px; height: 64px; border-radius: 50%; background: ${({ theme }) => theme.green};
  display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700;
  color: #fff; margin-bottom: 14px; border: 3px solid ${({ theme }) => theme.greenLight};
`

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

const RoleBadge = styled.span<{ $role: string }>`
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px;
  text-transform: uppercase; letter-spacing: 0.5px;
  background: ${({ $role }) =>
    $role === 'admin'      ? '#dcfce7' :
    $role === 'contador'   ? '#dbeafe' : '#fef9c3'};
  color: ${({ $role }) =>
    $role === 'admin'      ? '#166534' :
    $role === 'contador'   ? '#1e40af' : '#854d0e'};
`

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px;
  display: inline-flex; align-items: center; gap: 4px;
  background: ${({ $status }) => $status === 'ativo' ? '#dcfce7' : '#fef3c7'};
  color: ${({ $status }) => $status === 'ativo' ? '#166534' : '#92400e'};
`

const MemberRow = styled.div`
  display: flex; align-items: center; gap: 12px; padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  &:last-child { border-bottom: none; }
`
const MemberAvatar = styled.div`
  width: 36px; height: 36px; border-radius: 50%; background: ${({ theme }) => theme.green};
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
`
const MemberInfo = styled.div`flex: 1; min-width: 0;`
const MemberEmail = styled.div`font-size: 13px; color: ${({ theme }) => theme.text}; font-weight: 500;`
const MemberMeta = styled.div`display: flex; align-items: center; gap: 6px; margin-top: 3px;`

const InviteRow = styled.div`
  display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: end;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`
const SmallBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 9px;
  font-size: 12px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
  border: none; white-space: nowrap; transition: all 0.2s;
`
const InviteBtn = styled(SmallBtn)`
  background: ${({ theme }) => theme.green}; color: #fff;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`
const RemoveBtn = styled(SmallBtn)`
  background: transparent; color: #dc2626;
  border: 1px solid #fecaca;
  &:hover { background: #fee2e2; }
`

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  contador: 'Contador',
  assistente: 'Assistente',
}

const sections = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'escritorio', label: 'Escritório', icon: Building2 },
  { id: 'equipe', label: 'Equipe', icon: Users },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'aparencia', label: 'Aparência', icon: Moon },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
]

export function SettingsPage() {
  const { user, escritorio: escStore } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const [section, setSection] = useState('perfil')
  const [saving, setSaving] = useState(false)
  const [escritorio, setEscritorioData] = useState<Partial<Escritorio>>({})
  const [nome, setNome] = useState(user?.user_metadata?.nome_completo || '')
  const [notifications, setNotifications] = useState({ email: true, push: false, weekly: true })
  const [notifEmailAtivo, setNotifEmailAtivo] = useState(true)
  const [notifDias, setNotifDias] = useState(7)
  const [notifUltimoEnvio, setNotifUltimoEnvio] = useState<string | null>(null)
  const [savingNotif, setSavingNotif] = useState(false)
  const [testando, setTestando] = useState(false)

  // Equipe
  const [membros, setMembros] = useState<MembroEscritorio[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'contador' | 'assistente'>('contador')
  const [inviting, setInviting] = useState(false)
  const isOwner = escStore?.user_id === user?.id

  useEffect(() => {
    const loadEscritorio = async () => {
      const { data } = await supabase.from('escritorios').select('*').single()
      if (data) {
        setEscritorioData(data)
        setNotifEmailAtivo(data.notif_email_ativo ?? true)
        setNotifDias(data.notif_dias_antecedencia ?? 7)
        setNotifUltimoEnvio(data.notif_ultimo_envio ?? null)
      }
    }
    loadEscritorio()
  }, [])

  useEffect(() => {
    if (section === 'equipe' && escStore?.id) loadMembros()
  }, [section, escStore?.id])

  const loadMembros = async () => {
    const { data } = await supabase
      .from('membros_escritorio')
      .select('*')
      .eq('escritorio_id', escStore!.id)
      .order('created_at', { ascending: true })
    if (data) setMembros(data)
  }

  const handleInvite = async () => {
    if (!inviteEmail || !escStore?.id) return
    setInviting(true)
    const { error } = await supabase.from('membros_escritorio').insert({
      escritorio_id: escStore.id,
      email: inviteEmail.toLowerCase().trim(),
      role: inviteRole,
      invited_by: user?.id,
    })
    setInviting(false)
    if (error) {
      if (error.code === '23505') toast.error('Este e-mail já foi convidado.')
      else toast.error(error.message)
      return
    }
    toast.success(`Convite enviado para ${inviteEmail}`)
    setInviteEmail('')
    loadMembros()
  }

  const handleRemoveMembro = async (id: string, email: string) => {
    if (!confirm(`Remover ${email} da equipe?`)) return
    const { error } = await supabase.from('membros_escritorio').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Membro removido.')
    setMembros(prev => prev.filter(m => m.id !== id))
  }

  const handleChangeRole = async (id: string, role: string) => {
    const { error } = await supabase.from('membros_escritorio').update({ role }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setMembros(prev => prev.map(m => m.id === id ? { ...m, role: role as any } : m))
    toast.success('Função atualizada.')
  }

  const handleSavePerfil = async () => {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { nome_completo: nome } })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Perfil atualizado!')
  }

  const handleSaveEscritorio = async () => {
    if (!escritorio.id) return
    setSaving(true)
    const { id, user_id, created_at, ...rest } = escritorio as any
    const { error } = await supabase.from('escritorios').update(rest).eq('id', id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Dados do escritório atualizados!')
  }

  const upd = (k: string, v: any) => setEscritorioData(p => ({ ...p, [k]: v }))

  const handleSaveNotif = async () => {
    if (!escritorio.id) return
    setSavingNotif(true)
    const { error } = await supabase
      .from('escritorios')
      .update({ notif_email_ativo: notifEmailAtivo, notif_dias_antecedencia: notifDias })
      .eq('id', escritorio.id)
    setSavingNotif(false)
    if (error) { toast.error(error.message); return }
    toast.success('Preferências de notificação salvas!')
  }

  const handleTestarNotif = async () => {
    if (!escritorio.id) return
    setTestando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const supabaseUrl = (supabase as any).supabaseUrl as string
      const resp = await fetch(`${supabaseUrl}/functions/v1/notify-obligations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ escritorio_id: escritorio.id }),
      })
      const result = await resp.json()
      if (result.enviados > 0) {
        toast.success(`E-mail enviado para ${escritorio.email}!`)
        setNotifUltimoEnvio(new Date().toISOString())
      } else if (result.erros?.length > 0) {
        toast.error('Erro ao enviar: ' + result.erros[0])
      } else {
        toast.info('Nenhuma obrigação vencendo no período configurado.')
      }
    } catch {
      toast.error('Erro ao chamar a função de notificação.')
    } finally {
      setTestando(false)
    }
  }

  const meta = user?.user_metadata || {}
  const initials = nome
    ? nome.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : (user?.email?.[0] || '?').toUpperCase()

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader>
          <PageTitle>Configurações <em>&</em> Preferências</PageTitle>
          <PageSub>Gerencie seu perfil, escritório e preferências do sistema</PageSub>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Layout>
          <SideNav>
            {sections.map(s => (
              <NavItem key={s.id} $active={section === s.id} onClick={() => setSection(s.id)}>
                <s.icon size={15} />
                {s.label}
              </NavItem>
            ))}
          </SideNav>

          <div>
            {section === 'perfil' && (
              <Card>
                <CardHead>
                  <CardTitle>Meu Perfil</CardTitle>
                  <CardSub>Informações pessoais e da conta</CardSub>
                </CardHead>
                <CardBody>
                  <AvatarLarge>{initials}</AvatarLarge>
                  <PlanBadge>📦 Plano {meta.plano || 'Pro'}</PlanBadge>
                  <div style={{ marginTop: 20 }}>
                    <FormGrid>
                      <Field style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel>Nome Completo</FieldLabel>
                        <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" />
                      </Field>
                      <Field>
                        <FieldLabel>E-mail</FieldLabel>
                        <Input value={user?.email || ''} disabled />
                      </Field>
                      <Field>
                        <FieldLabel>Plano</FieldLabel>
                        <Input value={meta.plano || 'Pro'} disabled />
                      </Field>
                    </FormGrid>
                  </div>
                  <SaveBtn onClick={handleSavePerfil} whileTap={{ scale: 0.97 }} disabled={saving}>
                    <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Perfil'}
                  </SaveBtn>
                </CardBody>
              </Card>
            )}

            {section === 'escritorio' && (
              <Card>
                <CardHead>
                  <CardTitle>Dados do Escritório</CardTitle>
                  <CardSub>Informações do seu escritório contábil</CardSub>
                </CardHead>
                <CardBody>
                  <FormGrid>
                    <Field style={{ gridColumn: '1 / -1' }}>
                      <FieldLabel>Nome do Escritório</FieldLabel>
                      <Input value={escritorio.nome || ''} onChange={e => upd('nome', e.target.value)} placeholder="Nome do escritório" />
                    </Field>
                    <Field>
                      <FieldLabel>E-mail Comercial</FieldLabel>
                      <Input type="email" value={escritorio.email || ''} onChange={e => upd('email', e.target.value)} placeholder="contato@escritorio.com" />
                    </Field>
                    <Field>
                      <FieldLabel>Plano</FieldLabel>
                      <Select value={escritorio.plano || 'pro'} onChange={e => upd('plano', e.target.value)}>
                        <option value="starter">Starter — R$ 197/mês</option>
                        <option value="pro">Pro — R$ 397/mês</option>
                        <option value="enterprise">Enterprise — R$ 897/mês</option>
                      </Select>
                    </Field>
                  </FormGrid>
                  <SaveBtn onClick={handleSaveEscritorio} whileTap={{ scale: 0.97 }} disabled={saving || !escritorio.id}>
                    <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Escritório'}
                  </SaveBtn>
                </CardBody>
              </Card>
            )}

            {section === 'equipe' && (
              <Card>
                <CardHead>
                  <CardTitle>Equipe</CardTitle>
                  <CardSub>Convide pessoas para acessar este escritório</CardSub>
                </CardHead>
                <CardBody>
                  {/* Dono */}
                  <FieldLabel style={{ marginBottom: 10 }}>Proprietário</FieldLabel>
                  <MemberRow>
                    <MemberAvatar>{(user?.email?.[0] || '?').toUpperCase()}</MemberAvatar>
                    <MemberInfo>
                      <MemberEmail>{user?.user_metadata?.nome_completo || user?.email}</MemberEmail>
                      <MemberMeta>
                        <RoleBadge $role="admin"><Crown size={9} style={{ display: 'inline', marginRight: 3 }} />Proprietário</RoleBadge>
                        <StatusBadge $status="ativo"><CheckCircle size={9} />Ativo</StatusBadge>
                      </MemberMeta>
                    </MemberInfo>
                  </MemberRow>

                  {/* Membros */}
                  {membros.length > 0 && (
                    <>
                      <FieldLabel style={{ marginTop: 20, marginBottom: 10 }}>Membros ({membros.length})</FieldLabel>
                      {membros.map(m => (
                        <MemberRow key={m.id}>
                          <MemberAvatar style={{ background: m.status === 'pendente' ? '#9ca3af' : undefined }}>
                            {m.email[0].toUpperCase()}
                          </MemberAvatar>
                          <MemberInfo>
                            <MemberEmail>{m.email}</MemberEmail>
                            <MemberMeta>
                              {isOwner ? (
                                <Select
                                  value={m.role}
                                  onChange={e => handleChangeRole(m.id, e.target.value)}
                                  style={{ width: 'auto', padding: '2px 6px', fontSize: 11, height: 'auto' }}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="contador">Contador</option>
                                  <option value="assistente">Assistente</option>
                                </Select>
                              ) : (
                                <RoleBadge $role={m.role}>{roleLabels[m.role]}</RoleBadge>
                              )}
                              <StatusBadge $status={m.status}>
                                {m.status === 'ativo' ? <><CheckCircle size={9} />Ativo</> : <><Clock size={9} />Pendente</>}
                              </StatusBadge>
                            </MemberMeta>
                          </MemberInfo>
                          {isOwner && (
                            <RemoveBtn onClick={() => handleRemoveMembro(m.id, m.email)}>
                              <Trash2 size={13} />
                            </RemoveBtn>
                          )}
                        </MemberRow>
                      ))}
                    </>
                  )}

                  {/* Convidar */}
                  {isOwner && (
                    <>
                      <FieldLabel style={{ marginTop: 24, marginBottom: 10 }}>Convidar membro</FieldLabel>
                      <InviteRow>
                        <Field style={{ marginBottom: 0 }}>
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleInvite()}
                          />
                        </Field>
                        <Field style={{ marginBottom: 0 }}>
                          <Select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)}>
                            <option value="contador">Contador</option>
                            <option value="assistente">Assistente</option>
                            <option value="admin">Admin</option>
                          </Select>
                        </Field>
                        <InviteBtn onClick={handleInvite} disabled={inviting || !inviteEmail}>
                          <UserPlus size={14} />{inviting ? 'Enviando...' : 'Convidar'}
                        </InviteBtn>
                      </InviteRow>
                      <div style={{ marginTop: 10, fontSize: 11, color: '#8a8a8a', lineHeight: 1.5 }}>
                        A pessoa receberá acesso ao criar conta ou fazer login com este e-mail.
                        <br />
                        <strong>Admin:</strong> acesso total · <strong>Contador:</strong> cria e edita · <strong>Assistente:</strong> somente leitura
                      </div>
                    </>
                  )}

                  {!isOwner && (
                    <div style={{ marginTop: 16, fontSize: 13, color: '#8a8a8a' }}>
                      Apenas o proprietário pode convidar ou remover membros.
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {section === 'notificacoes' && (
              <Card>
                <CardHead>
                  <CardTitle>Notificações por E-mail</CardTitle>
                  <CardSub>Alertas automáticos de obrigações fiscais vencendo</CardSub>
                </CardHead>
                <CardBody>
                  {/* Toggle principal */}
                  <ToggleRow>
                    <div>
                      <ToggleLabel>Alertas de obrigações vencendo</ToggleLabel>
                      <ToggleSub>Receba um e-mail quando tiver obrigações próximas do vencimento</ToggleSub>
                    </div>
                    <Toggle $on={notifEmailAtivo} onClick={() => setNotifEmailAtivo(v => !v)} />
                  </ToggleRow>

                  {/* Dias de antecedência */}
                  <div style={{ marginTop: 20, opacity: notifEmailAtivo ? 1 : 0.4, transition: 'opacity 0.2s', pointerEvents: notifEmailAtivo ? 'auto' : 'none' }}>
                    <FieldLabel>Antecedência do alerta</FieldLabel>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {[1, 3, 5, 7, 14].map(d => (
                        <button
                          key={d}
                          onClick={() => setNotifDias(d)}
                          style={{
                            padding: '7px 16px', borderRadius: 8, border: '1.5px solid',
                            fontSize: 13, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                            fontWeight: notifDias === d ? 700 : 400,
                            borderColor: notifDias === d ? '#1a7a4a' : '#e5e7eb',
                            background: notifDias === d ? '#f0fdf4' : 'transparent',
                            color: notifDias === d ? '#1a7a4a' : '#374151',
                          }}
                        >
                          {d} dia{d !== 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, opacity: 0.6 }}>
                      Você receberá um e-mail quando houver obrigações vencendo nos próximos <strong>{notifDias} dias</strong>.
                      O envio ocorre automaticamente às 8h todos os dias.
                    </div>
                  </div>

                  {/* E-mail destino */}
                  <div style={{ marginTop: 20 }}>
                    <FieldLabel>E-mail de destino</FieldLabel>
                    <div style={{ fontSize: 13, padding: '10px 14px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151' }}>
                      {escritorio.email || <span style={{ opacity: 0.5 }}>Configure o e-mail comercial na aba Escritório</span>}
                    </div>
                  </div>

                  {/* Último envio */}
                  {notifUltimoEnvio && (
                    <div style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>
                      Último envio: {new Date(notifUltimoEnvio).toLocaleString('pt-BR')}
                    </div>
                  )}

                  {/* Botões */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                    <SaveBtn onClick={handleSaveNotif} whileTap={{ scale: 0.97 }} disabled={savingNotif}>
                      <Save size={14} /> {savingNotif ? 'Salvando...' : 'Salvar Preferências'}
                    </SaveBtn>
                    <button
                      onClick={handleTestarNotif}
                      disabled={testando || !escritorio.email}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                        borderRadius: 9, border: '1.5px solid #1a7a4a', background: 'transparent',
                        color: '#1a7a4a', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                        cursor: testando || !escritorio.email ? 'not-allowed' : 'pointer',
                        opacity: testando || !escritorio.email ? 0.5 : 1,
                        marginTop: 20,
                      }}
                    >
                      <Send size={14} /> {testando ? 'Enviando...' : 'Enviar teste agora'}
                    </button>
                  </div>
                  {!escritorio.email && (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#dc2626' }}>
                      Configure o e-mail comercial em Escritório para usar notificações.
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {section === 'aparencia' && (
              <Card>
                <CardHead>
                  <CardTitle>Aparência</CardTitle>
                  <CardSub>Personalize o visual do sistema</CardSub>
                </CardHead>
                <CardBody>
                  <ToggleRow>
                    <div>
                      <ToggleLabel>{isDark ? '🌙 Modo Escuro ativo' : '☀️ Modo Claro ativo'}</ToggleLabel>
                      <ToggleSub>Alterna entre tema claro e escuro</ToggleSub>
                    </div>
                    <Toggle $on={isDark} onClick={toggleTheme} />
                  </ToggleRow>
                  <ToggleRow>
                    <div>
                      <ToggleLabel>Animações</ToggleLabel>
                      <ToggleSub>Habilitar animações de transição</ToggleSub>
                    </div>
                    <Toggle $on={true} onClick={() => toast.info('Em breve!')} />
                  </ToggleRow>
                  <ToggleRow>
                    <div>
                      <ToggleLabel>Compacto</ToggleLabel>
                      <ToggleSub>Reduzir espaçamento das tabelas</ToggleSub>
                    </div>
                    <Toggle $on={false} onClick={() => toast.info('Em breve!')} />
                  </ToggleRow>
                </CardBody>
              </Card>
            )}

            {section === 'seguranca' && (
              <Card>
                <CardHead>
                  <CardTitle>Segurança</CardTitle>
                  <CardSub>Senha, 2FA e sessões ativas</CardSub>
                </CardHead>
                <CardBody>
                  <div style={{ marginBottom: 20 }}>
                    <FieldLabel>Nova Senha</FieldLabel>
                    <Input type="password" placeholder="••••••••" style={{ marginBottom: 10 }} />
                    <FieldLabel>Confirmar Nova Senha</FieldLabel>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <SaveBtn
                    onClick={async () => {
                      toast.info('Funcionalidade de alteração de senha em desenvolvimento')
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Key size={14} /> Alterar Senha
                  </SaveBtn>
                  <div style={{ marginTop: 28 }}>
                    <ToggleRow>
                      <div>
                        <ToggleLabel>Autenticação em dois fatores (2FA)</ToggleLabel>
                        <ToggleSub>Aumenta a segurança da sua conta</ToggleSub>
                      </div>
                      <Toggle $on={false} onClick={() => toast.info('Em breve!')} />
                    </ToggleRow>
                    <ToggleRow>
                      <div>
                        <ToggleLabel>Alertas de login</ToggleLabel>
                        <ToggleSub>Receba notificações de novos acessos</ToggleSub>
                      </div>
                      <Toggle $on={notifications.email} onClick={() => setNotifications(p => ({ ...p, email: !p.email }))} />
                    </ToggleRow>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </Layout>
      </motion.div>
    </motion.div>
  )
}
