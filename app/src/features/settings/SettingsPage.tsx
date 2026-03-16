import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Save, User, Building2, Shield, Bell, Moon, Sun, Key } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useTheme } from '../../styles/ThemeProvider'
import type { Escritorio } from '../../types'

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

const sections = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'escritorio', label: 'Escritório', icon: Building2 },
  { id: 'aparencia', label: 'Aparência', icon: Moon },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
]

export function SettingsPage() {
  const { user } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const [section, setSection] = useState('perfil')
  const [saving, setSaving] = useState(false)
  const [escritorio, setEscritorioData] = useState<Partial<Escritorio>>({})
  const [nome, setNome] = useState(user?.user_metadata?.nome_completo || '')
  const [notifications, setNotifications] = useState({ email: true, push: false, weekly: true })

  useEffect(() => {
    const loadEscritorio = async () => {
      const { data } = await supabase.from('escritorios').select('*').single()
      if (data) setEscritorioData(data)
    }
    loadEscritorio()
  }, [])

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
