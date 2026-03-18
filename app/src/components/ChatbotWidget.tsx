import { useState, useRef, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { MessageCircle, X, Send, Bot, User, Phone } from 'lucide-react'

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeUp = keyframes`from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); }`
const fadeIn = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }`
const pulse = keyframes`0%,100% { box-shadow: 0 0 0 0 rgba(26,122,74,0.4); } 50% { box-shadow: 0 0 0 8px rgba(26,122,74,0); }`

// ─── Styled ───────────────────────────────────────────────────────────────────
const FloatBtn = styled.button`
  position: fixed; bottom: 28px; right: 28px; z-index: 9000;
  width: 54px; height: 54px; border-radius: 50%;
  background: ${({ theme }) => theme.green}; color: #fff;
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 20px rgba(26,122,74,0.4); transition: transform 0.2s;
  animation: ${pulse} 2.5s ease-in-out infinite;
  &:hover { transform: scale(1.08); }
  @media (max-width: 600px) { bottom: 18px; right: 18px; }
`
const Panel = styled.div`
  position: fixed; bottom: 96px; right: 28px; z-index: 9000;
  width: 360px; max-height: 560px; display: flex; flex-direction: column;
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  animation: ${fadeUp} 0.22s ease;
  @media (max-width: 440px) { width: calc(100vw - 24px); right: 12px; bottom: 82px; max-height: 68vh; }
`
const PanelHead = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  background: ${({ theme }) => theme.green}; border-radius: 18px 18px 0 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`
const HeadAvatar = styled.div`
  width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`
const HeadInfo = styled.div`flex: 1;`
const HeadName = styled.div`font-size: 14px; font-weight: 700; color: #fff;`
const HeadSub = styled.div`font-size: 11px; color: rgba(255,255,255,0.8);`
const CloseBtn = styled.button`
  width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer;
  background: rgba(255,255,255,0.15); color: #fff;
  display: flex; align-items: center; justify-content: center;
  &:hover { background: rgba(255,255,255,0.3); }
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
const MsgBubble = styled.div<{ $user?: boolean }>`
  max-width: 80%; padding: 9px 13px;
  border-radius: ${({ $user }) => $user ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};
  background: ${({ theme, $user }) => $user ? theme.green : theme.surface2};
  color: ${({ theme, $user }) => $user ? '#fff' : theme.text};
  font-size: 13px; line-height: 1.55;
  border: 1px solid ${({ theme, $user }) => $user ? 'transparent' : theme.border};
  white-space: pre-wrap; word-break: break-word;
`
const SupportCard = styled.a`
  display: flex; align-items: center; gap: 10px; margin-top: 6px;
  background: ${({ theme }) => theme.surface2}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px; padding: 10px 14px; text-decoration: none;
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
const SuggestionsArea = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px;
`
const SuggestionBtn = styled.button`
  padding: 5px 11px; border-radius: 20px; font-size: 12px; cursor: pointer;
  background: ${({ theme }) => theme.surface2}; color: ${({ theme }) => theme.textMid};
  border: 1px solid ${({ theme }) => theme.border}; font-family: 'Inter', sans-serif;
  transition: all 0.15s; white-space: nowrap;
  &:hover { background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green}; border-color: ${({ theme }) => theme.green}; }
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

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ: Record<string, string> = {
  'Como cadastrar um cliente?':
    'Vá em **Clientes** no menu lateral, clique em **+ Novo Cliente** e preencha os dados da empresa (razão social, CNPJ, e-mail). Clique em Salvar para concluir.',

  'Como criar um lançamento contábil?':
    'Acesse **Lançamentos Contábeis**, clique em **+ Novo Lançamento** e preencha:\n• Histórico (descrição)\n• Data do lançamento\n• Conta Débito e Conta Crédito\n• Valor\n\nO sistema usa partidas dobradas automaticamente.',

  'Como importar extrato OFX?':
    'Na página de **Conciliação Bancária**, clique em **Importar OFX**, selecione o arquivo exportado pelo seu banco e confirme. As transações aparecem na lista em segundos.',

  'Como gerar relatório em PDF?':
    'Acesse **Relatórios**, selecione o tipo e o período desejado, depois clique no botão **Exportar PDF** no canto superior. O arquivo é gerado e baixado automaticamente.',

  'Como lançar honorários?':
    'Vá em **Honorários**, clique em **+ Novo**, selecione o cliente, defina o valor e o vencimento. O sistema acompanha o status de cada cobrança (pendente, pago, vencido).',

  'Como usar a conciliação bancária?':
    'Importe seu extrato OFX em **Conciliação Bancária**. Para cada transação pendente, clique em **Conciliar** e selecione o lançamento contábil correspondente. O sistema vincula os dois registros.',
}

const SUGGESTIONS = Object.keys(FAQ)

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant'
  content: string
  showSupport?: boolean
}

const WELCOME: Message = {
  role: 'assistant',
  content: 'Olá! 👋 Sou o assistente do TEUcontador. Selecione uma das opções abaixo ou digite sua dúvida.',
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const showSuggestions = messages.length === 1

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  const handleSuggestion = (question: string) => {
    const answer = FAQ[question]
    setMessages(prev => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: answer },
    ])
  }

  const handleFreeText = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages(prev => [
      ...prev,
      { role: 'user', content: text },
      {
        role: 'assistant',
        content: 'Não encontrei uma resposta automática para isso. Entre em contato com nosso suporte via WhatsApp — vamos te ajudar rapidinho!',
        showSupport: true,
      },
    ])
  }

  return (
    <>
      {open && (
        <Panel>
          <PanelHead>
            <HeadAvatar><Bot size={18} color="#fff" /></HeadAvatar>
            <HeadInfo>
              <HeadName>Assistente TEUcontador</HeadName>
              <HeadSub>● Online agora</HeadSub>
            </HeadInfo>
            <CloseBtn onClick={() => setOpen(false)}><X size={14} /></CloseBtn>
          </PanelHead>

          <Messages>
            {messages.map((m, i) => (
              <div key={i}>
                <MsgRow $user={m.role === 'user'}>
                  <MsgAvatar $user={m.role === 'user'}>
                    {m.role === 'user'
                      ? <User size={12} color="#1a7a4a" />
                      : <Bot size={12} color="#6b7280" />}
                  </MsgAvatar>
                  <MsgBubble $user={m.role === 'user'}>{m.content}</MsgBubble>
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
            <div ref={bottomRef} />
          </Messages>

          {showSuggestions && (
            <SuggestionsArea>
              {SUGGESTIONS.map(s => (
                <SuggestionBtn key={s} onClick={() => handleSuggestion(s)}>{s}</SuggestionBtn>
              ))}
            </SuggestionsArea>
          )}

          <Footer>
            <Input
              ref={inputRef}
              placeholder="Digite sua dúvida..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFreeText()}
            />
            <SendBtn onClick={handleFreeText} disabled={!input.trim()}>
              <Send size={14} />
            </SendBtn>
          </Footer>
        </Panel>
      )}

      <FloatBtn onClick={() => setOpen(o => !o)} title="Assistente TEUcontador">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </FloatBtn>
    </>
  )
}
