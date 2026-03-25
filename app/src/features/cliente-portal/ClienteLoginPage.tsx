import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useClientePortalStore } from '../../stores/clientePortalStore'

const spin = keyframes`to { transform: rotate(360deg); }`
const glow = keyframes`
  0%, 100% { box-shadow: 0 0 6px rgba(255,255,255,0.5); }
  50% { box-shadow: 0 0 18px rgba(255,255,255,0.9), 0 0 36px rgba(255,255,255,0.3); }
`

const Page = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  background: #f0f4ff;
`

const Left = styled(motion.div)`
  width: 52%;
  background: linear-gradient(160deg, #007bff 0%, #0056b3 55%, #003380 100%);
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
  background: radial-gradient(circle, rgba(0,123,255,0.35) 0%, transparent 70%);
  pointer-events: none;
`

const LeftGlow2 = styled.div`
  position: absolute;
  bottom: -10%;
  right: -10%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(0,123,255,0.2) 0%, transparent 70%);
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
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
`

const BrandName = styled.div`
  font-family: 'Inter', sans-serif;
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
  font-family: 'Inter', sans-serif;
  font-size: clamp(40px, 4.5vw, 58px);
  line-height: 1.06;
  letter-spacing: -2px;
  font-weight: 400;
  margin-bottom: 22px;
  color: #fff;
  em { font-style: italic; color: #60a5fa; }
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

const SecurityBadges = styled.div`display: flex; gap: 8px;`

const SecurityBadge = styled.div`
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
  background: #f0f4ff;
  overflow-y: auto;
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
  font-family: 'Inter', sans-serif;
  font-size: 36px;
  font-weight: 400;
  letter-spacing: -1px;
  margin-bottom: 8px;
  line-height: 1.1;
  color: #1a1a1a;
  em { font-style: italic; color: #007bff; }
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

const SubmitBtn = styled(motion.button)<{ $loading?: boolean }>`
  width: 100%;
  padding: 14px;
  border-radius: 11px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
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
  box-shadow: 0 4px 24px rgba(0,123,255,0.35);
  transition: all 0.25s;
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  pointer-events: ${({ $loading }) => $loading ? 'none' : 'auto'};
  &:hover { background: linear-gradient(135deg, #3395ff 0%, #007bff 100%); box-shadow: 0 6px 28px rgba(0,123,255,0.45); }
`

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`

const BackLink = styled.button`
  position: absolute;
  top: 24px;
  left: 24px;
  background: none;
  border: none;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s;
  &:hover { color: #fff; background: rgba(255,255,255,0.1); }
  @media (max-width: 900px) {
    color: #4a4a4a;
    top: 16px;
    left: 16px;
  }
`

const OfficeLink = styled.div`
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

const features = [
  { icon: '📊', title: 'Lançamentos', desc: 'Visualize receitas e despesas em tempo real' },
  { icon: '🏦', title: 'Transações', desc: 'Acompanhe transações bancárias conciliadas' },
  { icon: '📑', title: 'Obrigações', desc: 'Fique por dentro das suas obrigações fiscais' },
]

export function ClienteLoginPage() {
  const navigate = useNavigate()
  const { setSession } = useClientePortalStore()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const doLogin = async () => {
    if (!email || !senha) { setError('Preencha e-mail e senha'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: rpcError } = await supabase.rpc('login_cliente', {
        p_email: email,
        p_senha: senha,
      })
      if (rpcError) {
        setError('Erro ao autenticar. Tente novamente.')
        console.error(rpcError)
        return
      }
      if (!data || !data.id) {
        setError('E-mail ou senha incorretos.')
        return
      }
      setSession({
        id: data.id,
        razao_social: data.razao_social,
        cnpj: data.cnpj,
        regime: data.regime,
        email_acesso: data.email_acesso,
        senha_acesso: data.senha_acesso,
        honorarios: data.honorarios,
        situacao: data.situacao,
        responsavel: data.responsavel,
        municipio: data.municipio,
        estado: data.estado,
      })
      toast.success(`Bem-vindo, ${data.razao_social}!`)
      navigate('/portal/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page>
      <Left
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: 'relative' }}
      >
        <BackLink onClick={() => navigate('/')}>
          ← Voltar
        </BackLink>
        <LeftGlow1 />
        <LeftGlow2 />
        <LeftPattern />
        <LeftLines />
        <LeftContent>
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <Brand>
              <img src="/img/logo.png" alt="TEUcontador" style={{ height: 64, width: 'auto', display: 'block' }} />
            </Brand>
          </motion.div>

          <HeroArea>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <HeroBadge>
                <BadgeDot />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#fff' }}>
                  Área Exclusiva do Cliente
                </span>
              </HeroBadge>
            </motion.div>

            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.7 }}>
              <HeroTitle>
                Portal do<br />
                <em>Cliente</em>
              </HeroTitle>
            </motion.div>

            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.75 }}>
              <HeroDesc>
                Acesse seus dados financeiros com segurança e acompanhe a saúde do seu negócio em tempo real.
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
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                <strong style={{ color: '#fff', fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 2 }}>Dados protegidos</strong>
                com criptografia SSL
              </div>
              <SecurityBadges>
                <SecurityBadge>SSL</SecurityBadge>
                <SecurityBadge>LGPD</SecurityBadge>
              </SecurityBadges>
            </LeftBottom>
          </motion.div>
        </LeftContent>
      </Left>

      <Right>
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ width: '100%', maxWidth: 440, position: 'relative' }}
        >
          {/* Mobile back link */}
          <div style={{ display: 'none' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#4a4a4a', marginBottom: 16 }}>
              ← Voltar
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key="login" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <FormHeader>
                <FormEyebrow>Área do Cliente</FormEyebrow>
                <FormTitle>Acessar o <em>Portal</em></FormTitle>
                <FormSub>Entre com suas credenciais para visualizar seus dados financeiros.</FormSub>
              </FormHeader>

              <Field>
                <FieldLabel>E-mail</FieldLabel>
                <InputWrap>
                  <Mail size={15} />
                  <Input
                    type="email"
                    placeholder="seu@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doLogin()}
                    $error={!!error}
                  />
                </InputWrap>
              </Field>

              <Field>
                <FieldLabel>Senha</FieldLabel>
                <InputWrap>
                  <Lock size={15} />
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doLogin()}
                    $error={!!error}
                  />
                  <PwdToggle type="button" onClick={() => setShowPwd(p => !p)}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </PwdToggle>
                </InputWrap>
                {error && <ErrMsg>{error}</ErrMsg>}
              </Field>

              <SubmitBtn type="button" onClick={doLogin} $loading={loading} whileTap={{ scale: 0.98 }}>
                {loading ? <Spinner /> : <>Entrar <ChevronRight size={16} /></>}
              </SubmitBtn>

              <OfficeLink>
                É um escritório? <button onClick={() => navigate('/login')}>Faça login aqui →</button>
              </OfficeLink>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </Right>
    </Page>
  )
}
