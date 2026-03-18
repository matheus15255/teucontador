import { useState } from 'react'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const slideUp = keyframes`from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); }`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease;
`

const Card = styled.div`
  background: ${({ theme }) => theme.surface};
  border-radius: 20px;
  padding: 36px 32px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
  animation: ${slideUp} 0.35s ease;
  border: 1px solid ${({ theme }) => theme.border};
`

const Title = styled.h2`
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 0 0 8px;
`

const Sub = styled.p`
  font-size: 13.5px;
  color: ${({ theme }) => theme.textDim};
  font-family: 'Inter', sans-serif;
  margin: 0 0 24px;
  line-height: 1.6;
`

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.textMid};
  font-family: 'Inter', sans-serif;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const Input = styled.input`
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.bg};
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  &:focus { border-color: ${({ theme }) => theme.green}; }
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`

const Btn = styled.button<{ $loading?: boolean }>`
  width: 100%;
  padding: 14px;
  background: ${({ theme }) => theme.green};
  color: #fff;
  border: none;
  border-radius: 11px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.9; }
`

const CancelBtn = styled.button`
  display: block;
  width: 100%;
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.textDim};
  font-family: 'Inter', sans-serif;
  background: none;
  border: none;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.text}; }
`

interface Props {
  loading: boolean
  onConfirm: (telefone: string, cpf_cnpj: string) => void
  onCancel: () => void
}

export function ProfileFormModal({ loading, onConfirm, onCancel }: Props) {
  const [telefone, setTelefone] = useState('')
  const [cpf_cnpj, setCpfCnpj] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!telefone.trim() || !cpf_cnpj.trim()) return
    onConfirm(telefone.trim(), cpf_cnpj.trim())
  }

  return (
    <Overlay>
      <Card>
        <Title>Completar perfil</Title>
        <Sub>
          Para processar o pagamento precisamos do seu telefone e CPF/CNPJ.
          Esses dados são enviados com segurança ao processador de pagamentos.
        </Sub>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div>
              <Label>Telefone (com DDD)</Label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>CPF ou CNPJ</Label>
              <Input
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                value={cpf_cnpj}
                onChange={e => setCpfCnpj(e.target.value)}
                required
              />
            </div>
          </FieldGroup>
          <Btn type="submit" $loading={loading} disabled={loading}>
            {loading ? 'Aguarde...' : 'Salvar e continuar para o pagamento'}
          </Btn>
        </form>
        <CancelBtn type="button" onClick={onCancel}>Cancelar</CancelBtn>
      </Card>
    </Overlay>
  )
}
