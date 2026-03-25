import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, BookOpen, List, FileText,
  DollarSign, Calendar, ArrowLeftRight, Settings, LogOut,
  Sun, Moon, Bell, Search, Menu, CalendarDays, CreditCard,
  Phone, TrendingUp, Timer, Receipt, FolderInput, Shield, Layers,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { useTheme } from '../../styles/ThemeProvider'
import { NotificacoesDropdown } from '../NotificacoesDropdown'
import { useSubscription } from '../../hooks/useSubscription'
import { TrialBanner } from '../../features/subscription/TrialBanner'
import { PaywallModal } from '../../features/subscription/PaywallModal'
import { ChatbotWidget } from '../ChatbotWidget'
import { WelcomeModal } from '../../features/onboarding/WelcomeModal'
import { OnboardingChecklist, RELATORIOS_KEY } from '../../features/onboarding/OnboardingChecklist'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard',    label: 'Dashboard',        icon: LayoutDashboard, path: '/app/dashboard' },
      { id: 'clientes',     label: 'Clientes',          icon: Users,           path: '/app/clientes' },
      { id: 'lancamentos',  label: 'Lançamentos',       icon: BookOpen,        path: '/app/lancamentos' },
      { id: 'plano',        label: 'Plano de Contas',   icon: List,            path: '/app/plano' },
      { id: 'relatorios',   label: 'Relatórios',        icon: FileText,        path: '/app/relatorios' },
    ],
  },
  {
    label: 'Fiscal',
    items: [
      { id: 'folha',        label: 'Folha / DP',        icon: DollarSign,      path: '/app/folha' },
      { id: 'obrigacoes',   label: 'Obrigações',        icon: Calendar,        path: '/app/obrigacoes' },
      { id: 'agenda',       label: 'Agenda Fiscal',     icon: CalendarDays,    path: '/app/agenda' },
      { id: 'conciliacao',  label: 'Conciliação',       icon: ArrowLeftRight,  path: '/app/conciliacao' },
      { id: 'honorarios',   label: 'Honorários',        icon: CreditCard,      path: '/app/honorarios' },
      { id: 'nfse',         label: 'NFS-e',             icon: Receipt,         path: '/app/nfse' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { id: 'fluxo',        label: 'Fluxo de Caixa',   icon: TrendingUp,      path: '/app/fluxo' },
      { id: 'atendimentos', label: 'Atendimentos',      icon: Phone,           path: '/app/atendimentos' },
      { id: 'tempo',        label: 'Controle de Tempo', icon: Timer,           path: '/app/tempo' },
      { id: 'importar',     label: 'Importar Dados',    icon: FolderInput,     path: '/app/importar' },
      { id: 'centro-custo', label: 'Centro de Custo',   icon: Layers,          path: '/app/centro-custo' },
      { id: 'audit',        label: 'Audit Trail',       icon: Shield,          path: '/app/audit' },
      { id: 'config',       label: 'Configurações',     icon: Settings,        path: '/app/config' },
    ],
  },
]

const Wrap = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.bg};
`

const sidebarIn = keyframes`
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
`

const Sidebar = styled.aside<{ $open: boolean }>`
  width: ${({ theme }) => theme.sidebarWidth};
  min-width: ${({ theme }) => theme.sidebarWidth};
  background: ${({ theme }) => theme.surface};
  border-right: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 10;
  box-shadow: 2px 0 12px rgba(0,0,0,0.05);
  animation: ${sidebarIn} 0.45s ease forwards;

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 200;
    animation: none;
    transition: transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    transform: ${({ $open }) => $open ? 'translateX(0)' : 'translateX(-100%)'};
  }
`

const Overlay = styled.div<{ $visible: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: ${({ $visible }) => $visible ? 'block' : 'none'};
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 199;
  }
`

const LogoWrap = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ theme }) => theme.green};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 19px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 2px 10px rgba(26,122,74,0.3);
  flex-shrink: 0;
`

const LogoName = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: ${({ theme }) => theme.text};
  span { color: ${({ theme }) => theme.green}; }
`

const NavSection = styled.nav`
  padding: 12px 8px 2px;
  flex-shrink: 0;
  flex: 1;
  overflow-y: auto;
`

const NavLabel = styled.div`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textDim};
  padding: 0 8px 6px;
  opacity: 0.7;
  margin-top: 8px;
`

const NavItem = styled(motion.button)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 9px;
  cursor: pointer;
  width: 100%;
  color: ${({ theme, $active }) => $active ? theme.green : theme.textDim};
  font-size: 12.5px;
  font-weight: ${({ $active }) => $active ? '500' : '400'};
  font-family: 'Inter', sans-serif;
  margin-bottom: 1px;
  border: 1px solid ${({ theme, $active }) => $active ? `rgba(26,122,74,0.15)` : 'transparent'};
  background: ${({ theme, $active }) => $active ? theme.greenLight : 'transparent'};
  text-align: left;
  transition: all 0.2s;
  svg { flex-shrink: 0; opacity: ${({ $active }) => $active ? 1 : 0.5}; }
  &:hover {
    background: ${({ theme, $active }) => $active ? theme.greenLight : theme.surface2};
    color: ${({ theme, $active }) => $active ? theme.green : theme.text};
    svg { opacity: 0.8; }
  }
`

const SbFooter = styled.div`
  margin-top: auto;
  border-top: 1px solid ${({ theme }) => theme.border};
  padding: 10px 8px;
  flex-shrink: 0;
`

const UserRow = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  &:hover { background: ${({ theme }) => theme.surface2}; }
`

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.green};
  border: 2px solid rgba(26,122,74,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
`

const UserInfo = styled.div`
  flex: 1;
  overflow: hidden;
`

const UserName = styled.div`
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ theme }) => theme.text};
`

const UserRole = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.textDim};
`

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  @media (max-width: 768px) {
    width: 100%;
  }
`

const Topbar = styled.header`
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 22px;
  gap: 10px;
  background: ${({ theme }) => theme.surface}ee;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.border};
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 0 14px;
    gap: 8px;
  }
`

const HamburgerBtn = styled.button`
  display: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border};
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.textMid};
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.surface2};
    border-color: ${({ theme }) => theme.border2};
  }

  @media (max-width: 768px) {
    display: flex;
  }
`

const TopTitle = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 400;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.text};

  @media (max-width: 768px) {
    font-size: 17px;
  }
`

const TopRight = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 9px;
`

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 9px;
  padding: 7px 13px;
  width: 210px;
  transition: all 0.2s;
  &:focus-within {
    border-color: ${({ theme }) => theme.greenMid};
    box-shadow: 0 0 0 3px rgba(34,160,98,0.1);
  }
  input {
    border: none;
    background: none;
    font-size: 12px;
    color: ${({ theme }) => theme.text};
    outline: none;
    width: 100%;
    font-family: 'Inter', sans-serif;
    &::placeholder { color: ${({ theme }) => theme.textDim}; }
  }

  @media (max-width: 768px) {
    display: none;
  }
`

const IconBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.textMid};
  transition: all 0.2s;
  &:hover {
    background: ${({ theme }) => theme.surface2};
    border-color: ${({ theme }) => theme.border2};
  }
`

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 18px 22px;

  @media (max-width: 768px) {
    padding: 14px 14px;
  }
`

const pageTitles: Record<string, string> = {
  dashboard:    'Dashboard',
  clientes:     'Clientes / Empresas',
  lancamentos:  'Lançamentos Contábeis',
  plano:        'Plano de Contas',
  relatorios:   'Relatórios Contábeis',
  folha:        'Folha / Depto. Pessoal',
  obrigacoes:   'Obrigações Acessórias',
  conciliacao:  'Conciliação Bancária',
  config:       'Configurações',
  agenda:       'Agenda Fiscal',
  honorarios:   'Honorários Contábeis',
  atendimentos: 'Registro de Atendimentos',
  fluxo:        'Fluxo de Caixa',
  tempo:        'Controle de Tempo',
  nfse:         'Notas de Serviço (NFS-e)',
  audit:        'Audit Trail',
  'centro-custo': 'Centro de Custo',
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, escritorio } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const { preload, unsubscribe } = useDataStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [checklistVisible, setChecklistVisible] = useState(true)
  const [visitedRelatorios, setVisitedRelatorios] = useState(() =>
    !!localStorage.getItem(RELATORIOS_KEY)
  )
  const { isTrial, isExpired, showBanner, daysRemaining, isRenewal, status } = useSubscription()
  const { clientes, lancamentos, obrigacoes } = useDataStore()

  useEffect(() => {
    if (escritorio?.id) preload(escritorio.id)
  }, [escritorio?.id])

  useEffect(() => {
    return () => { unsubscribe() }
  }, [])

  // Após retorno do pagamento: recarrega escritório e limpa param da URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('subscribed') === '1' && user) {
      useAuthStore.getState().loadEscritorio(user)
      navigate(location.pathname, { replace: true })
    }
  }, [location.search])

  // Track relatorios visit
  useEffect(() => {
    if (location.pathname.includes('/relatorios')) {
      localStorage.setItem(RELATORIOS_KEY, '1')
      setVisitedRelatorios(true)
    }
  }, [location.pathname])

  const currentPage = location.pathname.split('/').pop() || 'dashboard'
  const meta = user?.user_metadata || {}
  const initials = meta.nome_completo
    ? meta.nome_completo.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : (user?.email?.[0] || '?').toUpperCase()

  const handleSignOut = async () => {
    if (confirm('Deseja sair do TEUcontador?')) {
      await signOut()
      navigate('/login')
    }
  }

  const handleNavClick = (path: string) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const isDashboard = location.pathname === '/app/dashboard' || location.pathname === '/app'
  const nomePerfil = user?.user_metadata?.nome_completo || user?.email || ''

  return (
    <Wrap>
      {isExpired && (
        <PaywallModal
          onSignOut={handleSignOut}
          expired={status === 'cancelled' ? 'subscription' : 'trial'}
        />
      )}
      <WelcomeModal nome={nomePerfil} onClose={() => {}} />
      <Overlay $visible={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <Sidebar $open={sidebarOpen}>
        <LogoWrap>
          <img src="/img/logo.png" alt="TEUcontador" style={{ height: 200, width: 'auto', maxWidth: '100%', display: 'block' }} />
        </LogoWrap>

        <NavSection>
          {navGroups.map(group => (
            <div key={group.label}>
              <NavLabel>{group.label}</NavLabel>
              {group.items.map(item => (
                <NavItem
                  key={item.id}
                  $active={currentPage === item.id}
                  onClick={() => handleNavClick(item.path)}
                  whileTap={{ scale: 0.97 }}
                >
                  <item.icon size={14} />
                  {item.label}
                </NavItem>
              ))}
            </div>
          ))}
        </NavSection>

        <SbFooter>
          <NavItem
            onClick={toggleTheme}
            style={{ marginBottom: 4 }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? 'Modo Claro' : 'Modo Escuro'}
          </NavItem>
          <UserRow onClick={handleSignOut}>
            <Avatar>{initials}</Avatar>
            <UserInfo>
              <UserName>{meta.nome_completo || user?.email}</UserName>
              <UserRole>Contador · {meta.plano || 'Pro'}</UserRole>
            </UserInfo>
            <LogOut size={13} style={{ opacity: 0.4, flexShrink: 0 }} />
          </UserRow>
        </SbFooter>
      </Sidebar>

      <Main>
        <Topbar>
          <HamburgerBtn onClick={() => setSidebarOpen(prev => !prev)} aria-label="Abrir menu">
            <Menu size={16} />
          </HamburgerBtn>
          <TopTitle>{pageTitles[currentPage] || 'TEUcontador'}</TopTitle>
          <TopRight>
            <SearchBox>
              <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
              <input placeholder="Buscar..." />
            </SearchBox>
            <IconBtn onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </IconBtn>
            <NotificacoesDropdown
              open={notifOpen}
              onToggle={() => setNotifOpen(v => !v)}
              onClose={() => setNotifOpen(false)}
            />
          </TopRight>
        </Topbar>

        {showBanner && <TrialBanner daysRemaining={daysRemaining} isRenewal={isRenewal} />}

        <Content>
          {isDashboard && checklistVisible && (
            <OnboardingChecklist
              clientes={clientes.length}
              lancamentos={lancamentos.length}
              obrigacoes={obrigacoes.length}
              visitedRelatorios={visitedRelatorios}
              onDismiss={() => setChecklistVisible(false)}
            />
          )}
          <Outlet />
        </Content>
      </Main>
      <ChatbotWidget />
    </Wrap>
  )
}
