import { useState, useRef, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { MessageCircle, X, Send, Bot, User, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); }`
const fadeIn = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }`
const pulse = keyframes`0%,100% { box-shadow: 0 0 0 0 rgba(26,122,74,0.4); } 50% { box-shadow: 0 0 0 8px rgba(26,122,74,0); }`

// ─── Layout ───────────────────────────────────────────────────────────────────
const Bubble = styled.button<{ $open: boolean }>`
  position: fixed; bottom: 28px; right: 28px; z-index: 9000;
  width: 54px; height: 54px; border-radius: 50%;
  background: ${({ theme }) => theme.green}; color: #fff;
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 20px rgba(26,122,74,0.4);
  transition: transform 0.2s, opacity 0.2s;
  animation: ${pulse} 2.5s ease-in-out infinite;
  &:hover { transform: scale(1.08); }
  @media (max-width: 600px) { bottom: 18px; right: 18px; }
`

const Panel = styled.div`
  position: fixed; bottom: 96px; right: 28px; z-index: 9000;
  width: 360px; max-height: 540px; display: flex; flex-direction: column;
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  animation: ${fadeUp} 0.22s ease;
  @media (max-width: 440px) { width: calc(100vw - 24px); right: 12px; bottom: 82px; max-height: 65vh; }
`

const PanelHead = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.green}; border-radius: 18px 18px 0 0;
`

const HeadAvatar = styled.div`
  width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`

const HeadInfo = styled.div`flex: 1;`
const HeadName = styled.div`font-size: 14px; font-weight: 700; color: #fff;`
const HeadStatus = styled.div`font-size: 11px; color: rgba(255,255,255,0.8);`

const CloseBtn = styled.button`
  width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer;
  background: rgba(255,255,255,0.15); color: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s; &:hover { background: rgba(255,255,255,0.3); }
`

const Messages = styled.div`
  flex: 1; overflow-y: auto; padding: 14px 14px 8px;
  display: flex; flex-direction: column; gap: 10px;
  scrollbar-width: thin; scrollbar-color: ${({ theme }) => theme.border} transparent;
`

const MsgRow = styled.div<{ $user?: boolean }>`
  display: flex; gap: 8px; align-items: flex-end;
  flex-direction: ${({ $user }) => $user ? 'row-reverse' : 'row'};
  animation: ${fadeIn} 0.2s ease;
`

const MsgAvatar = styled.div<{ $user?: boolean }>`
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: ${({ theme, $user }) => $user ? theme.greenLight : theme.surface2};
  border: 1px solid ${({ theme }) => theme.border};
  display: flex; align-items: center; justify-content: center;
`

const Bubble2 = styled.div<{ $user?: boolean }>`
  max-width: 78%; padding: 9px 13px; border-radius: ${({ $user }) => $user ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};
  background: ${({ theme, $user }) => $user ? theme.green : theme.surface2};
  color: ${({ theme, $user }) => $user ? '#fff' : theme.text};
  font-size: 13px; line-height: 1.5;
  border: 1px solid ${({ theme, $user }) => $user ? 'transparent' : theme.border};
  white-space: pre-wrap; word-break: break-word;
`

const SupportCard = styled.a`
  display: flex; align-items: center; gap: 10px;
  background: ${({ theme }) => theme.surface2}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px; padding: 10px 14px; text-decoration: none; margin-top: 4px;
  transition: background 0.15s; cursor: pointer;
  &:hover { background: ${({ theme }) => theme.greenLight}; border-color: ${({ theme }) => theme.green}; }
`

const SupportIcon = styled.div`
  width: 32px; height: 32px; border-radius: 50%; background: ${({ theme }) => theme.greenLight};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`

const SupportText = styled.div`
  font-size: 12px; color: ${({ theme }) => theme.textMid};
  strong { display: block; font-size: 13px; color: ${({ theme }) => theme.green}; }
`

const Typing = styled.div`
  display: flex; align-items: center; gap: 4px; padding: 10px 14px;
  background: ${({ theme }) => theme.surface2}; border-radius: 14px 14px 14px 4px;
  border: 1px solid ${({ theme }) => theme.border};
  span {
    width: 6px; height: 6px; border-radius: 50%;
    background: ${({ theme }) => theme.textDim};
    animation: bounce 1.2s infinite ease-in-out;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
  @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
`

const Footer = styled.div`
  display: flex; gap: 8px; align-items: center;
  padding: 10px 12px; border-top: 1px solid ${({ theme }) => theme.border};
`

const Input = styled.input`
  flex: 1; padding: 9px 12px; border-radius: 10px;
  border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface2}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; outline: none;
  &:focus { border-color: ${({ theme }) => theme.greenMid}; }
  &::placeholder { color: ${({ theme }) => theme.textDim}; }
`

const SendBtn = styled.button`
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: ${({ theme }) => theme.green}; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: opacity 0.15s;
  &:hover { opacity: 0.85; } &:disabled { opacity: 0.4; cursor: not-allowed; }
`

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant'
  content: string
  showSupport?: boolean
}

const INITIAL_MSG: Message = {
  role: 'assistant',
  content: 'Olá! 👋 Sou o assistente do TEUcontador. Como posso ajudar você hoje?',
}

const SUPPORT_KEYWORDS = [
  'não consigo', 'erro', 'problema', 'bug', 'falhou', 'não funciona',
  'não sei', 'não entendi', 'como faz', 'suporte humano', 'falar com alguém',
]

function needsSupport(text: string): boolean {
  const lower = text.toLowerCase()
  return SUPPORT_KEYWORDS.some(k => lower.includes(k))
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Não autenticado')

      const apiMessages = history
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: apiMessages }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no servidor')

      const reply = data.text as string
      const showSupport = needsSupport(text) || needsSupport(reply)

      setMessages(prev => [...prev, { role: 'assistant', content: reply, showSupport }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, tive um problema técnico. Para ajuda imediata, entre em contato com nosso suporte.',
        showSupport: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <Panel>
          <PanelHead>
            <HeadAvatar><Bot size={18} color="#fff" /></HeadAvatar>
            <HeadInfo>
              <HeadName>Assistente TEUcontador</HeadName>
              <HeadStatus>● Online agora</HeadStatus>
            </HeadInfo>
            <CloseBtn onClick={() => setOpen(false)}><X size={14} /></CloseBtn>
          </PanelHead>

          <Messages>
            {messages.map((m, i) => (
              <div key={i}>
                <MsgRow $user={m.role === 'user'}>
                  <MsgAvatar $user={m.role === 'user'}>
                    {m.role === 'user' ? <User size={12} color="#1a7a4a" /> : <Bot size={12} color="#6b7280" />}
                  </MsgAvatar>
                  <Bubble2 $user={m.role === 'user'}>{m.content}</Bubble2>
                </MsgRow>
                {m.showSupport && (
                  <div style={{ paddingLeft: 34 }}>
                    <SupportCard href="https://wa.me/5513991169000" target="_blank" rel="noopener noreferrer">
                      <SupportIcon><Phone size={15} color="#1a7a4a" /></SupportIcon>
                      <SupportText>
                        <strong>(13) 99116-9000</strong>
                        Suporte via WhatsApp · Clique para abrir
                      </SupportText>
                    </SupportCard>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <MsgRow>
                <MsgAvatar><Bot size={12} color="#6b7280" /></MsgAvatar>
                <Typing><span /><span /><span /></Typing>
              </MsgRow>
            )}
            <div ref={bottomRef} />
          </Messages>

          <Footer>
            <Input
              ref={inputRef}
              placeholder="Digite sua dúvida..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            />
            <SendBtn onClick={send} disabled={!input.trim() || loading}>
              <Send size={14} />
            </SendBtn>
          </Footer>
        </Panel>
      )}

      <Bubble $open={open} onClick={() => setOpen(o => !o)} title="Assistente TEUcontador">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </Bubble>
    </>
  )
}
