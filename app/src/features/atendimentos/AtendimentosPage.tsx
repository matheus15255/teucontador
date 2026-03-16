import { useState, useMemo, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import {
  Phone, Mail, Users, MessageCircle, FileText, Plus,
  Search, Trash2, X, Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'

// ─── Styled ─────────────────────────────────────────────────────────────────
const overlayIn = keyframes`from{opacity:0}to{opacity:1}`
const modalIn   = keyframes`from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}`

const PageHeader = styled.div`margin-bottom: 20px;`
const PageTitle  = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const Toolbar = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;`
const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 7px 12px; flex: 1; max-width: 280px;
  &:focus-within { border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
  input { border: none; background: none; font-size: 12.5px; color: ${({ theme }) => theme.text};
    outline: none; width: 100%; font-family: 'Inter', sans-serif; &::placeholder { color: ${({ theme }) => theme.textDim}; } }
  @media (max-width: 600px) { width: 100%; max-width: 100%; flex: 1; }
`
const Select = styled.select`
  padding: 7px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; cursor: pointer;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; }
`
const Spacer = styled.div`flex: 1;`
const AddBtn = styled.button`
  display: flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 10px;
  background: ${({ theme }) => theme.green}; color: #fff; border: none; font-size: 13px;
  font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity 0.2s;
  &:hover { opacity: 0.87; }
`

const StatsRow = styled.div`
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 18px;
  @media (max-width: 1000px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
`
const StatCard = styled.div<{ $color: string }>`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 10px;
  box-shadow: ${({ theme }) => theme.shadow};
`
const IconWrap = styled.div<{ $color: string }>`
  width: 34px; height: 34px; border-radius: 9px; background: ${({ $color }) => $color}22;
  display: flex; align-items: center; justify-content: center; color: ${({ $color }) => $color}; flex-shrink: 0;
`
const StatInfo = styled.div``
const StatValue = styled.div`font-size: 18px; font-weight: 600; color: ${({ theme }) => theme.text}; font-family: 'Playfair Display', serif;`
const StatLabel = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 1px;`

// Card list
const List = styled.div`display: flex; flex-direction: column; gap: 8px;`
const Card = styled.div<{ $color: string }>`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 14px 16px; box-shadow: ${({ theme }) => theme.shadow};
  border-left: 3px solid ${({ $color }) => $color}; transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.09); }
  display: flex; gap: 14px; align-items: flex-start;
`
const CardIcon = styled.div<{ $color: string }>`
  width: 36px; height: 36px; border-radius: 10px; background: ${({ $color }) => $color}22;
  display: flex; align-items: center; justify-content: center; color: ${({ $color }) => $color}; flex-shrink: 0;
`
const CardBody = styled.div`flex: 1; min-width: 0;`
const CardTitle = styled.div`font-size: 14px; font-weight: 500; color: ${({ theme }) => theme.text};`
const CardMeta  = styled.div`font-size: 12px; color: ${({ theme }) => theme.textDim}; margin-top: 3px; display: flex; gap: 10px; flex-wrap: wrap;`
const CardDesc  = styled.div`font-size: 12.5px; color: ${({ theme }) => theme.textMid}; margin-top: 5px; line-height: 1.4;`
const CardActions = styled.div`display: flex; gap: 6px; flex-shrink: 0;`
const DelBtn = styled.button`
  width: 28px; height: 28px; border-radius: 7px; border: 1.5px solid ${({ theme }) => theme.border};
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: ${({ theme }) => theme.textDim}; transition: all 0.2s;
  &:hover { border-color: #dc262633; background: #dc262611; color: #dc2626; }
`

const EmptyState = styled.div`
  padding: 60px 20px; text-align: center; color: ${({ theme }) => theme.textDim}; font-size: 14px;
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px;
`

// Modal
const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 500;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: ${overlayIn} 0.2s ease;
  @media (max-width: 600px) { align-items: flex-end; padding: 0; }
`
const Modal = styled.div`
  background: ${({ theme }) => theme.surface}; border-radius: 16px;
  width: 100%; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${modalIn} 0.22s ease; overflow: hidden;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; overflow-y: auto; }
`
const ModalHead = styled.div`
  padding: 18px 20px 14px; border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex; align-items: center; justify-content: space-between;
`
const ModalTitle = styled.div`font-family: 'Playfair Display', serif; font-size: 18px; color: ${({ theme }) => theme.text};`
const CloseBtn   = styled.button`
  width: 28px; height: 28px; border-radius: 7px; border: none; background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: ${({ theme }) => theme.textDim}; &:hover { background: ${({ theme }) => theme.surface2}; }
`
const ModalBody = styled.div`padding: 18px 20px 20px;`
const FormGrid  = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 14px; @media(max-width:480px){grid-template-columns:1fr;}`
const Field     = styled.div`display: flex; flex-direction: column; gap: 5px;`
const Label     = styled.label`font-size: 11.5px; font-weight: 600; color: ${({ theme }) => theme.textMid}; text-transform: uppercase; letter-spacing: 0.5px;`
const Input     = styled.input`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13.5px; font-family: 'Inter', sans-serif; transition: border 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
`
const ModalSelect = styled.select`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13.5px; font-family: 'Inter', sans-serif;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; }
`
const Textarea = styled.textarea`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; resize: vertical; min-height: 80px;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; }
`
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px;
  border-top: 1px solid ${({ theme }) => theme.border};
`
const SaveBtn = styled.button`
  padding: 9px 22px; border-radius: 10px; background: ${({ theme }) => theme.green};
  color: #fff; border: none; font-size: 13.5px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity 0.2s;
  &:hover { opacity: 0.87; } &:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
`
const CancelBtn = styled.button`
  padding: 9px 18px; border-radius: 10px; background: transparent;
  color: ${({ theme }) => theme.textMid}; border: 1.5px solid ${({ theme }) => theme.border};
  font-size: 13.5px; cursor: pointer; font-family: 'Inter', sans-serif;
  &:hover { background: ${({ theme }) => theme.surface2}; }
`

// ─── Config tipos ──────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'ligacao',  label: 'Ligação',  icon: Phone,          color: '#2563eb' },
  { value: 'email',    label: 'E-mail',   icon: Mail,           color: '#7c3aed' },
  { value: 'reuniao',  label: 'Reunião',  icon: Users,          color: '#0891b2' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle,  color: '#16a34a' },
  { value: 'outro',    label: 'Outro',    icon: FileText,       color: '#6b7280' },
]
const tipoInfo = (t: string) => TIPOS.find(x => x.value === t) || TIPOS[4]

// ─── Component ─────────────────────────────────────────────────────────────────
export function AtendimentosPage() {
  const { escritorio } = useAuthStore()
  const { clientes, atendimentos, setAtendimentos } = useDataStore()
  const escId = escritorio?.id

  const [search, setSearch]          = useState('')
  const [filterTipo, setFilterTipo]  = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [showModal, setShowModal]    = useState(false)
  const [saving, setSaving]          = useState(false)
  const savingRef = useRef(false)

  const blank = () => ({
    cliente_id: '',
    tipo: 'ligacao',
    assunto: '',
    descricao: '',
    data_atendimento: format(new Date(), 'yyyy-MM-dd'),
    duracao_min: '',
    responsavel: '',
  })
  const [form, setForm] = useState(blank())

  const filtered = useMemo(() => {
    let list = [...atendimentos]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((a: any) =>
        a.assunto?.toLowerCase().includes(q) ||
        a.descricao?.toLowerCase().includes(q) ||
        a.clientes?.razao_social?.toLowerCase().includes(q) ||
        a.responsavel?.toLowerCase().includes(q)
      )
    }
    if (filterTipo)    list = list.filter((a: any) => a.tipo === filterTipo)
    if (filterCliente) list = list.filter((a: any) => a.cliente_id === filterCliente)
    return list
  }, [atendimentos, search, filterTipo, filterCliente])

  const stats = useMemo(() => {
    const counts: Record<string, number> = {}
    TIPOS.forEach(t => { counts[t.value] = atendimentos.filter((a: any) => a.tipo === t.value).length })
    return counts
  }, [atendimentos])

  async function handleSave() {
    if (savingRef.current) return
    if (!form.assunto) { toast.error('Informe o assunto', { duration: 4000 }); return }
    if (!escId) return
    savingRef.current = true; setSaving(true)
    try {
      const payload = {
        escritorio_id: escId,
        cliente_id: form.cliente_id || null,
        tipo: form.tipo,
        assunto: form.assunto,
        descricao: form.descricao || null,
        data_atendimento: form.data_atendimento,
        duracao_min: form.duracao_min ? parseInt(String(form.duracao_min)) : null,
        responsavel: form.responsavel || null,
      }
      const { error } = await supabase.from('atendimentos').insert(payload)
      if (error) throw error
      const { data: fresh } = await supabase
        .from('atendimentos').select('*,clientes(razao_social)')
        .eq('escritorio_id', escId).order('data_atendimento', { ascending: false }).limit(300)
      setAtendimentos(fresh || [])
      toast.success('Atendimento registrado')
      setShowModal(false); setForm(blank())
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar', { duration: 5000 })
    } finally {
      savingRef.current = false; setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!escId || !confirm('Excluir este atendimento?')) return
    const { error } = await supabase.from('atendimentos').delete().eq('id', id).eq('escritorio_id', escId)
    if (error) { toast.error('Erro ao excluir'); return }
    setAtendimentos(atendimentos.filter((a: any) => a.id !== id))
    toast.success('Excluído')
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Registro de <em>Atendimentos</em></PageTitle>
        <PageSub>Histórico de contatos com clientes — ligações, e-mails, reuniões e WhatsApp</PageSub>
      </PageHeader>

      <StatsRow>
        {TIPOS.map(t => (
          <StatCard key={t.value} $color={t.color}>
            <IconWrap $color={t.color}><t.icon size={16} /></IconWrap>
            <StatInfo>
              <StatValue>{stats[t.value]}</StatValue>
              <StatLabel>{t.label}</StatLabel>
            </StatInfo>
          </StatCard>
        ))}
      </StatsRow>

      <Toolbar>
        <SearchBox>
          <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
          <input placeholder="Buscar assunto, cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </SearchBox>
        <Filter size={13} style={{ opacity: 0.4 }} />
        <Select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Select value={filterCliente} onChange={e => setFilterCliente(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
        </Select>
        <Spacer />
        <AddBtn onClick={() => setShowModal(true)}><Plus size={14} />Novo Atendimento</AddBtn>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState>Nenhum atendimento encontrado.<br />Registre o primeiro contato com um cliente.</EmptyState>
      ) : (
        <List>
          {filtered.map((a: any) => {
            const info = tipoInfo(a.tipo)
            return (
              <Card key={a.id} $color={info.color}>
                <CardIcon $color={info.color}><info.icon size={16} /></CardIcon>
                <CardBody>
                  <CardTitle>{a.assunto}</CardTitle>
                  <CardMeta>
                    <span>{info.label}</span>
                    {a.clientes?.razao_social && <span>· {a.clientes.razao_social}</span>}
                    <span>· {format(new Date(a.data_atendimento + 'T00:00'), "dd/MM/yyyy", { locale: ptBR })}</span>
                    {a.duracao_min && <span>· {a.duracao_min} min</span>}
                    {a.responsavel && <span>· {a.responsavel}</span>}
                  </CardMeta>
                  {a.descricao && <CardDesc>{a.descricao}</CardDesc>}
                </CardBody>
                <CardActions>
                  <DelBtn onClick={() => handleDelete(a.id)}><Trash2 size={12} /></DelBtn>
                </CardActions>
              </Card>
            )
          })}
        </List>
      )}

      {showModal && (
        <Overlay onClick={() => setShowModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Novo Atendimento</ModalTitle>
              <CloseBtn onClick={() => setShowModal(false)}><X size={14} /></CloseBtn>
            </ModalHead>
            <ModalBody>
              <FormGrid>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Assunto *</Label>
                  <Input placeholder="Ex: Dúvida sobre DASN..." value={form.assunto}
                    onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Tipo</Label>
                  <ModalSelect value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </ModalSelect>
                </Field>
                <Field>
                  <Label>Cliente</Label>
                  <ModalSelect value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">— Sem cliente —</option>
                    {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </ModalSelect>
                </Field>
                <Field>
                  <Label>Data</Label>
                  <Input type="date" value={form.data_atendimento}
                    onChange={e => setForm(f => ({ ...f, data_atendimento: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Duração (min)</Label>
                  <Input type="number" min="0" placeholder="Ex: 30" value={form.duracao_min}
                    onChange={e => setForm(f => ({ ...f, duracao_min: e.target.value }))} />
                </Field>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Responsável</Label>
                  <Input placeholder="Nome do responsável" value={form.responsavel}
                    onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
                </Field>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Descrição / Observações</Label>
                  <Textarea placeholder="Detalhes do atendimento..." value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
                </Field>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={() => setShowModal(false)}>Cancelar</CancelBtn>
              <SaveBtn disabled={saving} onClick={handleSave}>{saving ? 'Salvando...' : 'Registrar'}</SaveBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </>
  )
}
