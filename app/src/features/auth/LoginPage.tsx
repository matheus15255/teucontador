import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Building2, Eye, EyeOff, Check, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

type View = 'login' | 'register' | 'forgot' | 'forgot-ok' | 'success'

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 6px rgba(255,255,255,0.5); }
  50% { box-shadow: 0 0 18px rgba(255,255,255,0.9), 0 0 36px rgba(255,255,255,0.3); }
`

const spin = keyframes`to { transform: rotate(360deg); }`

const Page = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  background: #f8f6f1;
`

const Left = styled(motion.div)`
  width: 52%;
  background: linear-gradient(160deg, #1a7a4a 0%, #0d3d24 55%, #081a10 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  z-index: 2;
  @media (max-width: 900px) { display: none; }
`

const LeftGlow1 = styled.div`
  position: absolute;
  top: -10%;
  left: -10%;
  width: 70%;
  height: 70%;
  background: radial-gradient(circle, rgba(26,122,74,0.35) 0%, transparent 70%);
  pointer-events: none;
`

const LeftGlow2 = styled.div`
  position: absolute;
  bottom: -10%;
  right: -10%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(26,122,74,0.2) 0%, transparent 70%);
  pointer-events: none;
`

const LeftPattern = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 75% 15%, rgba(74,222,128,0.08) 0%, transparent 40%),
    radial-gradient(circle at 20% 85%, rgba(0,0,0,0.25) 0%, transparent 50%);
`

const LeftLines = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
`

const LeftContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 52px 64px;
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`

const BrandMark = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
`

const BrandName = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.3px;
  span { color: rgba(255,255,255,0.5); }
`

const HeroArea = styled.div`
  margin-top: auto;
  margin-bottom: 28px;
`

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 6px 16px;
  border-radius: 30px;
  margin-bottom: 32px;
`

const BadgeDot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  animation: ${glow} 2s infinite;
`

const HeroTitle = styled.h1`
  font-family: 'Playfair Display', serif;
  font-size: clamp(44px, 5vw, 64px);
  line-height: 1.04;
  letter-spacing: -2px;
  font-weight: 400;
  margin-bottom: 22px;
  color: #fff;
  em { font-style: italic; color: #4ade80; opacity: 0.9; }
`

const HeroDesc = styled.p`
  font-size: 15px;
  color: rgba(255,255,255,0.65);
  line-height: 1.75;
  max-width: 420px;
  margin-bottom: 44px;
  font-weight: 300;
`

const Features = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 52px;
`

const Feat = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 11px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.3s;
  &:hover { background: rgba(255,255,255,0.1); }
`

const FeatIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(255,255,255,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
`

const FeatText = styled.div`
  font-size: 13px;
  color: rgba(255,255,255,0.75);
  font-weight: 300;
  strong { color: #fff; font-weight: 500; }
`

const LeftBottom = styled.div`
  border-top: 1px solid rgba(255,255,255,0.12);
  padding-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ClientCount = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.55);
  strong { color: #fff; font-weight: 600; font-size: 14px; display: block; margin-bottom: 2px; }
`

const TrustBadges = styled.div`display: flex; gap: 8px;`

const TrustBadge = styled.div`
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  font-size: 9px;
  color: rgba(255,255,255,0.65);
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 600;
`

const Right = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f8f6f1;
  overflow-y: auto;
  @media (max-width: 600px) { padding: 24px 20px; align-items: flex-start; }
`

const FormHeader = styled.div`margin-bottom: 36px;`

const FormEyebrow = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #22a062;
  margin-bottom: 10px;
`

const FormTitle = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 400;
  letter-spacing: -1px;
  margin-bottom: 8px;
  line-height: 1.1;
  color: #1a1a1a;
  em { font-style: italic; color: #1a7a4a; }
`

const FormSub = styled.p`
  font-size: 14px;
  color: #8a8a8a;
  font-weight: 300;
  line-height: 1.6;
`

const Field = styled.div`margin-bottom: 16px;`

const FieldLabel = styled.label`
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #8a8a8a;
  margin-bottom: 7px;
`

const InputWrap = styled.div`
  position: relative;
  svg:first-child {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #8a8a8a;
    pointer-events: none;
  }
`

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  padding: 12px 14px 12px 42px;
  background: #fff;
  border: 1.5px solid ${({ $error }) => $error ? '#d94040' : '#e2ddd6'};
  border-radius: 11px;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  font-family: 'Inter', sans-serif;
  transition: all 0.25s;
  &:focus {
    border-color: #22a062;
    box-shadow: 0 0 0 4px rgba(34,160,98,0.1);
  }
  &::placeholder { color: #8a8a8a; }
`

const PwdToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #8a8a8a;
  display: flex;
  align-items: center;
  &:hover { color: #4a4a4a; }
`

const ErrMsg = styled.div`
  font-size: 11.5px;
  color: #d94040;
  margin-top: 5px;
`

const StrengthBars = styled.div`
  display: flex;
  gap: 4px;
  margin: 7px 0 4px;
`

const StrengthBar = styled.div<{ $active: boolean; $color: string }>`
  height: 3px;
  flex: 1;
  border-radius: 2px;
  background: ${({ $active, $color }) => $active ? $color : '#e2ddd6'};
  transition: background 0.3s;
`

const ForgotLink = styled.button`
  font-size: 12px;
  color: #22a062;
  cursor: pointer;
  font-weight: 500;
  background: none;
  border: none;
  &:hover { text-decoration: underline; }
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  div { flex: 1; height: 1px; background: #e2ddd6; }
  span { font-size: 11px; color: #8a8a8a; font-weight: 500; }
`

const OAuthRow = styled.div`display: flex; gap: 10px;`

const OAuthBtn = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  background: #fff;
  border: 1.5px solid #e2ddd6;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  color: #4a4a4a;
  transition: all 0.2s;
  &:hover { border-color: #22a062; color: #1a7a4a; }
`

const SubmitBtn = styled(motion.button)<{ $loading?: boolean }>`
  width: 100%;
  padding: 14px;
  border-radius: 11px;
  background: linear-gradient(135deg, #1a7a4a 0%, #0f5233 100%);
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 24px rgba(26,122,74,0.35);
  transition: all 0.25s;
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  pointer-events: ${({ $loading }) => $loading ? 'none' : 'auto'};
  &:hover { background: linear-gradient(135deg, #22a062 0%, #1a7a4a 100%); box-shadow: 0 6px 28px rgba(26,122,74,0.45); }
`

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

const PlanCard = styled.div<{ $selected: boolean }>`
  padding: 13px 10px;
  border-radius: 11px;
  background: ${({ $selected }) => $selected ? '#e8f5ee' : '#fff'};
  border: 1.5px solid ${({ $selected }) => $selected ? '#1a7a4a' : '#e2ddd6'};
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  box-shadow: ${({ $selected }) => $selected ? '0 0 0 3px rgba(26,122,74,0.1)' : 'none'};
  &:hover { border-color: #22a062; }
`

const Steps = styled.div`display: flex; align-items: center; margin-bottom: 28px;`

const StepDot = styled.div<{ $active: boolean; $done: boolean }>`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  background: ${({ $active, $done }) => $active ? '#1a7a4a' : $done ? '#e8f5ee' : '#e2ddd6'};
  color: ${({ $active, $done }) => $active ? '#fff' : $done ? '#1a7a4a' : '#8a8a8a'};
  box-shadow: ${({ $active }) => $active ? '0 0 0 4px rgba(26,122,74,0.15)' : 'none'};
  flex-shrink: 0;
  transition: all 0.3s;
`

const StepLine = styled.div<{ $done: boolean }>`
  flex: 1;
  height: 1px;
  background: ${({ $done }) => $done ? '#1a7a4a' : '#e2ddd6'};
  margin: 0 8px;
  transition: background 0.3s;
`

const SwitchLink = styled.div`
  font-size: 13px;
  color: #8a8a8a;
  text-align: center;
  margin-top: 22px;
  button {
    color: #22a062;
    font-weight: 600;
    cursor: pointer;
    background: none;
    border: none;
    font-size: 13px;
    &:hover { text-decoration: underline; }
  }
`

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e8f5ee;
  border: 2px solid #1a7a4a;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
`

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 400px) { grid-template-columns: 1fr; }
`

const BtnRow = styled.div`display: flex; gap: 10px;`

const BackBtn = styled(SubmitBtn)`
  background: transparent;
  color: #4a4a4a;
  border: 1.5px solid #e2ddd6;
  box-shadow: none;
  flex: 0 0 auto;
  width: auto;
  padding: 14px 20px;
  &:hover { background: #f0ede8; }
`

const plans = [
  { id: 'starter', name: 'Starter', price: 'R$ 197', period: '/mês' },
  { id: 'pro', name: 'Pro', price: 'R$ 397', period: '/mês' },
  { id: 'enterprise', name: 'Enterprise', price: 'R$ 897', period: '/mês' },
]

const features = [
  { icon: '📊', title: 'SPED Fiscal', desc: 'EFD ICMS/IPI e Contribuições' },
  { icon: '👥', title: 'Folha / eSocial', desc: 'Processamento e transmissão' },
  { icon: '🏦', title: 'Open Finance', desc: 'Conciliação automatizada' },
  { icon: '📑', title: 'Relatórios CFC', desc: 'NBC TG 26 — Balanço e DRE' },
]

function getStrength(pwd: string) {
  let s = 0
  if (pwd.length >= 8) s++
  if (/[A-Z]/.test(pwd)) s++
  if (/[0-9]/.test(pwd)) s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return s
}

const strengthColors = ['#d94040', '#e87d1a', '#e8c91a', '#1a7a4a']
const strengthLabels = ['Muito fraca', 'Fraca', 'Boa', 'Forte 🔒']

export function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [view, setView] = useState<View>('login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [regStep, setRegStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('pro')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPwd, setLoginPwd] = useState('')
  const [loginErr, setLoginErr] = useState('')

  const [regNome, setRegNome] = useState('')
  const [regSobrenome, setRegSobrenome] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPwd, setRegPwd] = useState('')
  const [regEscritorio, setRegEscritorio] = useState('')
  const [terms, setTerms] = useState(false)

  const [forgotEmail, setForgotEmail] = useState('')

  const pwdStrength = getStrength(regPwd)

  useEffect(() => {
    if (user) navigate('/app/dashboard')
  }, [user, navigate])

  const doLogin = async () => {
    if (!loginEmail || !loginPwd) { setLoginErr('Preencha e-mail e senha'); return }
    setLoading(true)
    setLoginErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPwd })
    setLoading(false)
    if (error) {
      console.error('Supabase auth error:', error)
      setLoginErr(error.message)
    } else {
      navigate('/app/dashboard')
    }
  }

  const doRegister = async () => {
    if (!terms) { toast.error('Aceite os termos de uso'); return }
    if (!regEmail || !regPwd || !regNome) { toast.error('Preencha nome, e-mail e senha'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPwd,
      options: { data: { nome_completo: `${regNome} ${regSobrenome}`.trim(), plano: selectedPlan } }
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('escritorios').insert({
        user_id: data.user.id,
        nome: regEscritorio || `${regNome} ${regSobrenome}`.trim(),
        plano: selectedPlan,
        email: regEmail
      })
    }
    setLoading(false)
    setView('success')
  }

  const doForgot = async () => {
    if (!forgotEmail) { toast.error('Digite um e-mail válido'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + '/login'
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setView('forgot-ok')
  }

  const loginOAuth = async (provider: 'google' | 'azure') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/app/dashboard' }
    })
  }

  return (
    <Page>
      <Left
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <LeftGlow1 />
        <LeftGlow2 />
        <LeftPattern />
        <LeftLines />
        <LeftContent>
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <Brand>
              <BrandMark>T</BrandMark>
              <div>
                <BrandName>TEU<span>contador</span></BrandName>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: 2 }}>
                  Sistema Contábil
                </div>
              </div>
            </Brand>
          </motion.div>

          <HeroArea>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <HeroBadge>
                <BadgeDot />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#fff' }}>
                  Plataforma Contábil Completa
                </span>
              </HeroBadge>
            </motion.div>

            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.7 }}>
              <HeroTitle>
                Contabilidade<br />
                <em>inteligente</em> para<br />
                escritórios modernos
              </HeroTitle>
            </motion.div>

            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.75 }}>
              <HeroDesc>
                Automatize lançamentos, gere relatórios e gerencie obrigações fiscais com eficiência e precisão.
              </HeroDesc>
            </motion.div>

            <Features>
              {features.map((f, i) => (
                <motion.div key={f.title} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.85 + i * 0.08 }}>
                  <Feat>
                    <FeatIcon>{f.icon}</FeatIcon>
                    <FeatText><strong>{f.title}</strong> — {f.desc}</FeatText>
                  </Feat>
                </motion.div>
              ))}
            </Features>
          </HeroArea>

          <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1 }}>
            <LeftBottom>
              <ClientCount>
                <strong>+2.400</strong>
                escritórios ativos
              </ClientCount>
              <TrustBadges>
                <TrustBadge>ISO 27001</TrustBadge>
                <TrustBadge>LGPD</TrustBadge>
                <TrustBadge>CFC</TrustBadge>
              </TrustBadges>
            </LeftBottom>
          </motion.div>
        </LeftContent>
      </Left>

      <Right>
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ width: '100%', maxWidth: 440 }}
        >
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                <FormHeader>
                  <FormEyebrow>Bem-vindo de volta</FormEyebrow>
                  <FormTitle>Faça seu <em>login</em></FormTitle>
                  <FormSub>Acesse sua conta para continuar gerenciando seu escritório.</FormSub>
                </FormHeader>

                <OAuthRow>
                  <OAuthBtn type="button" onClick={() => loginOAuth('google')}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </OAuthBtn>
                  <OAuthBtn type="button" onClick={() => loginOAuth('azure')}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M11.4 0H0v11.4h11.4V0z" fill="#F25022"/><path d="M24 0H12.6v11.4H24V0z" fill="#7FBA00"/><path d="M11.4 12.6H0V24h11.4V12.6z" fill="#00A4EF"/><path d="M24 12.6H12.6V24H24V12.6z" fill="#FFB900"/></svg>
                    Microsoft
                  </OAuthBtn>
                </OAuthRow>

                <Divider><div /><span>ou continue com e-mail</span><div /></Divider>

                <Field>
                  <FieldLabel>E-mail</FieldLabel>
                  <InputWrap>
                    <Mail size={15} />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && doLogin()}
                      $error={!!loginErr}
                    />
                  </InputWrap>
                </Field>

                <Field>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <FieldLabel style={{ margin: 0 }}>Senha</FieldLabel>
                    <ForgotLink type="button" onClick={() => setView('forgot')}>Esqueceu?</ForgotLink>
                  </div>
                  <InputWrap>
                    <Lock size={15} />
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPwd}
                      onChange={e => setLoginPwd(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && doLogin()}
                      $error={!!loginErr}
                    />
                    <PwdToggle type="button" onClick={() => setShowPwd(p => !p)}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </PwdToggle>
                  </InputWrap>
                  {loginErr && <ErrMsg>{loginErr}</ErrMsg>}
                </Field>

                <SubmitBtn type="button" onClick={doLogin} $loading={loading} whileTap={{ scale: 0.98 }}>
                  {loading ? <Spinner /> : <>Entrar <ChevronRight size={16} /></>}
                </SubmitBtn>

                <SwitchLink>
                  Não tem conta? <button onClick={() => setView('register')}>Criar conta gratuita</button>
                </SwitchLink>
              </motion.div>
            )}

            {view === 'register' && (
              <motion.div key="register" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                <FormHeader>
                  <FormEyebrow>Criar conta</FormEyebrow>
                  <FormTitle>Comece <em>gratuitamente</em></FormTitle>
                  <FormSub>14 dias grátis, sem cartão de crédito.</FormSub>
                </FormHeader>

                <Steps>
                  {[1, 2, 3].map((s) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 3 ? 1 : undefined }}>
                      <StepDot $active={regStep === s} $done={regStep > s}>
                        {regStep > s ? <Check size={12} /> : s}
                      </StepDot>
                      {s < 3 && <StepLine $done={regStep > s} />}
                    </div>
                  ))}
                </Steps>

                <AnimatePresence mode="wait">
                  {regStep === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <TwoCol>
                        <Field>
                          <FieldLabel>Nome</FieldLabel>
                          <InputWrap>
                            <User size={15} />
                            <Input placeholder="João" value={regNome} onChange={e => setRegNome(e.target.value)} />
                          </InputWrap>
                        </Field>
                        <Field>
                          <FieldLabel>Sobrenome</FieldLabel>
                          <InputWrap>
                            <User size={15} />
                            <Input placeholder="Silva" value={regSobrenome} onChange={e => setRegSobrenome(e.target.value)} />
                          </InputWrap>
                        </Field>
                      </TwoCol>
                      <Field>
                        <FieldLabel>E-mail</FieldLabel>
                        <InputWrap>
                          <Mail size={15} />
                          <Input type="email" placeholder="seu@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                        </InputWrap>
                      </Field>
                      <Field>
                        <FieldLabel>Senha</FieldLabel>
                        <InputWrap>
                          <Lock size={15} />
                          <Input type={showPwd ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" value={regPwd} onChange={e => setRegPwd(e.target.value)} />
                          <PwdToggle type="button" onClick={() => setShowPwd(p => !p)}>
                            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                          </PwdToggle>
                        </InputWrap>
                        {regPwd && (
                          <>
                            <StrengthBars>
                              {[1,2,3,4].map(i => (
                                <StrengthBar key={i} $active={i <= pwdStrength} $color={strengthColors[pwdStrength - 1] || '#e2ddd6'} />
                              ))}
                            </StrengthBars>
                            <div style={{ fontSize: 10.5, color: '#8a8a8a' }}>{strengthLabels[pwdStrength - 1] || ''}</div>
                          </>
                        )}
                      </Field>
                      <SubmitBtn type="button" onClick={() => { if (!regNome || !regEmail || !regPwd) { toast.error('Preencha todos os campos'); return } setRegStep(2) }} whileTap={{ scale: 0.98 }}>
                        Continuar <ChevronRight size={16} />
                      </SubmitBtn>
                    </motion.div>
                  )}

                  {regStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <Field>
                        <FieldLabel>Nome do Escritório</FieldLabel>
                        <InputWrap>
                          <Building2 size={15} />
                          <Input placeholder="Ex: Contabilidade Silva & Associados" value={regEscritorio} onChange={e => setRegEscritorio(e.target.value)} />
                        </InputWrap>
                      </Field>
                      <FieldLabel>Escolha seu plano</FieldLabel>
                      <PlanGrid>
                        {plans.map(p => (
                          <PlanCard key={p.id} $selected={selectedPlan === p.id} onClick={() => setSelectedPlan(p.id)}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{p.name}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a7a4a', margin: '3px 0' }}>{p.price}</div>
                            <div style={{ fontSize: 9, color: '#8a8a8a' }}>{p.period}</div>
                          </PlanCard>
                        ))}
                      </PlanGrid>
                      <BtnRow>
                        <BackBtn type="button" onClick={() => setRegStep(1)} whileTap={{ scale: 0.98 }}>
                          Voltar
                        </BackBtn>
                        <SubmitBtn type="button" onClick={() => setRegStep(3)} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                          Continuar <ChevronRight size={16} />
                        </SubmitBtn>
                      </BtnRow>
                    </motion.div>
                  )}

                  {regStep === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <div style={{ background: '#f8f6f1', border: '1px solid #e2ddd6', borderRadius: 11, padding: '16px', marginBottom: 16, fontSize: 13, color: '#4a4a4a', lineHeight: 1.6 }}>
                        <strong style={{ color: '#1a1a1a', display: 'block', marginBottom: 8 }}>Resumo da conta</strong>
                        <div>👤 {regNome} {regSobrenome}</div>
                        <div>📧 {regEmail}</div>
                        <div>🏢 {regEscritorio || `${regNome} ${regSobrenome}`}</div>
                        <div>📦 Plano {plans.find(p => p.id === selectedPlan)?.name} — {plans.find(p => p.id === selectedPlan)?.price}/mês</div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                        <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ marginTop: 3, accentColor: '#1a7a4a', width: 15, height: 15 }} />
                        <span style={{ fontSize: 12, color: '#8a8a8a', lineHeight: 1.5 }}>
                          Li e concordo com os <a href="#" style={{ color: '#22a062' }}>Termos de Uso</a> e <a href="#" style={{ color: '#22a062' }}>Política de Privacidade</a> do TEUcontador.
                        </span>
                      </label>
                      <BtnRow>
                        <BackBtn type="button" onClick={() => setRegStep(2)} whileTap={{ scale: 0.98 }}>
                          Voltar
                        </BackBtn>
                        <SubmitBtn type="button" onClick={doRegister} $loading={loading} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                          {loading ? <Spinner /> : <>Criar conta <Check size={16} /></>}
                        </SubmitBtn>
                      </BtnRow>
                    </motion.div>
                  )}
                </AnimatePresence>

                <SwitchLink>
                  Já tem conta? <button onClick={() => setView('login')}>Fazer login</button>
                </SwitchLink>
              </motion.div>
            )}

            {view === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                <FormHeader>
                  <FormEyebrow>Recuperar acesso</FormEyebrow>
                  <FormTitle>Redefinir <em>senha</em></FormTitle>
                  <FormSub>Enviaremos um link de recuperação para seu e-mail.</FormSub>
                </FormHeader>
                <Field>
                  <FieldLabel>E-mail cadastrado</FieldLabel>
                  <InputWrap>
                    <Mail size={15} />
                    <Input type="email" placeholder="seu@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && doForgot()} />
                  </InputWrap>
                </Field>
                <SubmitBtn type="button" onClick={doForgot} $loading={loading} whileTap={{ scale: 0.98 }}>
                  {loading ? <Spinner /> : <>Enviar link <ChevronRight size={16} /></>}
                </SubmitBtn>
                <SwitchLink><button onClick={() => setView('login')}>← Voltar ao login</button></SwitchLink>
              </motion.div>
            )}

            {view === 'forgot-ok' && (
              <motion.div key="forgot-ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                <SuccessIcon><span style={{ fontSize: 28 }}>📧</span></SuccessIcon>
                <FormTitle style={{ textAlign: 'center', fontSize: 28 }}>E-mail <em>enviado!</em></FormTitle>
                <FormSub style={{ textAlign: 'center', marginTop: 8 }}>Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</FormSub>
                <SubmitBtn type="button" onClick={() => setView('login')} whileTap={{ scale: 0.98 }} style={{ marginTop: 28 }}>
                  Voltar ao login
                </SubmitBtn>
              </motion.div>
            )}

            {view === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                <SuccessIcon><Check size={28} color="#1a7a4a" /></SuccessIcon>
                <FormTitle style={{ textAlign: 'center', fontSize: 28 }}>Conta <em>criada!</em></FormTitle>
                <FormSub style={{ textAlign: 'center', marginTop: 8 }}>Bem-vindo ao TEUcontador! Verifique seu e-mail para confirmar seu cadastro.</FormSub>
                <SubmitBtn type="button" onClick={() => navigate('/app/dashboard')} whileTap={{ scale: 0.98 }} style={{ marginTop: 28 }}>
                  Ir para o Dashboard <ChevronRight size={16} />
                </SubmitBtn>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Right>
    </Page>
  )
}
