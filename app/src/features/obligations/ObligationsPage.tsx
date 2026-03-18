import { useEffect, useState, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { Plus, Search, X, Calendar, Check, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { usePermission } from '../../hooks/usePermission'
import type { Obrigacao, Cliente } from '../../types'

const PageHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;`
const PageTitle = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const AddBtn = styled(motion.button)`
  display: flex; align-items: center; gap: 8px; padding: 10px 18px;
  background: ${({ theme }) => theme.green}; color: #fff; border: none; border-radius: 10px;
  font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer;
  box-shadow: 0 3px 15px rgba(26,122,74,0.25); &:hover { background: ${({ theme }) => theme.greenMid}; }
`

const StatsRow = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }`

const StatCard = styled(motion.div)<{ $type?: string }>`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 16px; box-shadow: ${({ theme }) => theme.shadow};
  display: flex; align-items: center; gap: 14px;
`

const StatIconBox = styled.div<{ $bg: string }>`
  width: 40px; height: 40px; border-radius: 10px; background: ${({ $bg }) => $bg};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`

const StatInfo = styled.div``
const StatLabel = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-bottom: 2px;`
const StatValue = styled.div<{ $color?: string }>`
  font-family: 'Playfair Display', serif; font-size: 24px; letter-spacing: -0.5px;
  color: ${({ theme, $color }) => $color || theme.text};
`

const Toolbar = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;`

const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 8px 13px; width: 280px;
  &:focus-within { border-color: ${({ theme }) => theme.greenMid}; }
  input { border: none; background: none; font-size: 13px; color: ${({ theme }) => theme.text}; outline: none; width: 100%; font-family: 'Inter', sans-serif; &::placeholder { color: ${({ theme }) => theme.textDim}; } }
  @media (max-width: 600px) { width: 100%; flex: 1; min-width: 0; }
`

const TabRow = styled.div`
  display: flex; gap: 4px; background: ${({ theme }) => theme.surface2}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 9px; padding: 3px;
`
const Tab = styled.button<{ $active: boolean }>`
  padding: 6px 14px; border-radius: 7px; font-size: 12px;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  color: ${({ theme, $active }) => $active ? theme.green : theme.textDim};
  background: ${({ theme, $active }) => $active ? theme.surface : 'transparent'};
  border: none; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
  box-shadow: ${({ $active }) => $active ? '0 1px 4px rgba(0,0,0,0.07)' : 'none'};
`

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`

const Table = styled.table`width: 100%; border-collapse: collapse;`
const Thead = styled.thead`
  th { padding: 10px 14px; text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: ${({ theme }) => theme.textDim}; background: ${({ theme }) => theme.surface2};
    border-bottom: 1px solid ${({ theme }) => theme.border}; }
`
const Tbody = styled.tbody`
  tr { border-bottom: 1px solid ${({ theme }) => theme.border}; transition: background 0.15s; &:last-child { border-bottom: none; } &:hover { background: ${({ theme }) => theme.surface2}; } }
  td { padding: 11px 14px; font-size: 13px; }
`

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 20px;
  font-size: 10.5px; font-weight: 600;
  background: ${({ theme, $status }) => ({ pendente: theme.warnBg, atrasado: theme.negBg, transmitido: theme.posBg }[$status] || theme.surface2)};
  color: ${({ theme, $status }) => ({ pendente: theme.warn, atrasado: theme.neg, transmitido: theme.pos }[$status] || theme.textDim)};
  &::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
`

const ActionBtn = styled.button`
  padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 600; cursor: pointer;
  font-family: 'Inter', sans-serif; transition: all 0.2s;
  background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green};
  border: 1px solid rgba(26,122,74,0.2); &:hover { background: ${({ theme }) => theme.green}; color: #fff; }
`

const UndoBtn = styled.button`
  padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 600; cursor: pointer;
  font-family: 'Inter', sans-serif; transition: all 0.2s;
  background: transparent; color: ${({ theme }) => theme.textDim};
  border: 1px solid ${({ theme }) => theme.border};
  &:hover { background: ${({ theme }) => theme.negBg}; color: ${({ theme }) => theme.neg}; border-color: ${({ theme }) => theme.neg}; }
`

const EmptyState = styled.div`text-align: center; padding: 60px 20px; color: ${({ theme }) => theme.textDim};`

const overlayIn = keyframes`from { opacity: 0; } to { opacity: 1; }`
const modalIn = keyframes`from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); }`

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: ${overlayIn} 0.18s ease;
  @media (max-width: 600px) { align-items: flex-end; padding: 0; }
`
const Modal = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: ${modalIn} 0.2s ease;
  @media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; overflow-y: auto; }
`
const ModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid ${({ theme }) => theme.border};
`
const ModalTitle = styled.div`font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400; color: ${({ theme }) => theme.text};`
const CloseBtn = styled.button`
  width: 32px; height: 32px; border-radius: 8px; background: ${({ theme }) => theme.surface2};
  border: 1px solid ${({ theme }) => theme.border}; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: ${({ theme }) => theme.textDim};
  &:hover { background: ${({ theme }) => theme.negBg}; color: ${({ theme }) => theme.neg}; }
`
const ModalBody = styled.div`padding: 24px;`
const Field = styled.div`margin-bottom: 14px;`
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
`
const Select = styled.select`
  width: 100%; padding: 10px 14px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; font-size: 13px;
  color: ${({ theme }) => theme.text}; outline: none; font-family: 'Inter', sans-serif;
  cursor: pointer; &:focus { border-color: ${({ theme }) => theme.greenMid}; }
`
const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid ${({ theme }) => theme.border};
`
const CancelBtn = styled.button`
  padding: 10px 20px; border-radius: 9px; background: ${({ theme }) => theme.surface2};
  border: 1.5px solid ${({ theme }) => theme.border}; font-size: 13px; font-weight: 500;
  color: ${({ theme }) => theme.textMid}; cursor: pointer; font-family: 'Inter', sans-serif;
`
const SaveBtn = styled(motion.button)`
  padding: 10px 22px; border-radius: 9px; background: ${({ theme }) => theme.green};
  color: #fff; border: none; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif;
  cursor: pointer; box-shadow: 0 3px 12px rgba(26,122,74,0.25);
  &:hover { background: ${({ theme }) => theme.greenMid}; }
`

const obrigacaoTipos = ['DCTF', 'EFD ICMS/IPI', 'EFD Contribuições', 'ECF', 'DEFIS', 'DIRF', 'RAIS', 'CAGED', 'eSocial', 'DCTFWeb', 'GFIP', 'GPS', 'DARF', 'DAE', 'GIA', 'SPED Fiscal']

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

export function ObligationsPage() {
  const { canEdit } = usePermission()
  const { escritorio } = useAuthStore()
  const escId = escritorio?.id
  const {
    obrigacoes: cachedObrigacoes, setObrigacoes: setCachedObrigacoes,
    clientes: cachedClientes,
  } = useDataStore()

  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>(cachedObrigacoes)
  const [filtered, setFiltered] = useState<Obrigacao[]>([])
  const [clientes, setClientes] = useState<Cliente[]>(cachedClientes)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('todos')
  const [loading, setLoading] = useState(cachedObrigacoes.length === 0)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo: 'DCTF', vencimento: '', status: 'pendente', cliente_id: ''
  })

  const load = async () => {
    if (!escId) return
    if (obrigacoes.length === 0) setLoading(true)
    const { data: obs } = await supabase.from('obrigacoes').select('*,clientes(razao_social)').eq('escritorio_id', escId).order('vencimento').limit(300)
    const result = (obs || []) as Obrigacao[]
    setObrigacoes(result)
    setCachedObrigacoes(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [escId])

  const getEffStatus = (o: Obrigacao) =>
    o.status === 'pendente' && o.vencimento && new Date(o.vencimento) < new Date()
      ? 'atrasado'
      : (o.status || 'pendente')

  useEffect(() => {
    let list = obrigacoes
    if (tab !== 'todos') list = list.filter(o => getEffStatus(o) === tab)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(o => o.tipo?.toLowerCase().includes(q) || (o as any).clientes?.razao_social?.toLowerCase().includes(q))
    }
    setFiltered(list)
  }, [obrigacoes, search, tab])

  const { pendentes, atrasadas, transmitidos } = useMemo(() => ({
    pendentes:    obrigacoes.filter(o => getEffStatus(o) === 'pendente').length,
    atrasadas:    obrigacoes.filter(o => getEffStatus(o) === 'atrasado').length,
    transmitidos: obrigacoes.filter(o => getEffStatus(o) === 'transmitido').length,
  }), [obrigacoes])

  const handleSave = async () => {
    if (!form.tipo || !form.vencimento) { toast.error('Tipo e vencimento são obrigatórios'); return }
    if (!escId) { toast.error('Escritório não carregado'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('obrigacoes').insert({ ...form, escritorio_id: escId, cliente_id: form.cliente_id || null })
      if (error) { toast.error(error.message); return }
      toast.success('Obrigação cadastrada!')
      setShowModal(false)
      setForm({ tipo: 'DCTF', vencimento: '', status: 'pendente', cliente_id: '' })
      load()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const markDone = async (id: string) => {
    const { error } = await supabase.from('obrigacoes').update({ status: 'transmitido' }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Obrigação concluída!')
    load()
  }

  const markUndone = async (id: string) => {
    const { error } = await supabase.from('obrigacoes').update({ status: 'pendente' }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.info('Obrigação reaberta')
    load()
  }

  const upd = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))


  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <motion.div variants={itemVariants}>
        <PageHeader>
          <div>
            <PageTitle>Obrigações <em>Acessórias</em></PageTitle>
            <PageSub>Calendário fiscal — {obrigacoes.length} obrigações registradas</PageSub>
          </div>
          <AddBtn onClick={() => setShowModal(true)} whileTap={{ scale: 0.97 }} disabled={!canEdit} style={{ opacity: !canEdit ? 0.4 : 1, cursor: !canEdit ? 'not-allowed' : 'pointer' }}>
            <Plus size={15} /> Nova Obrigação
          </AddBtn>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatsRow>
          <StatCard whileHover={{ y: -2 }}>
            <StatIconBox $bg="#fef3cd"><Clock size={18} color="#b45309" /></StatIconBox>
            <StatInfo>
              <StatLabel>Pendentes</StatLabel>
              <StatValue $color="#b45309">{pendentes}</StatValue>
            </StatInfo>
          </StatCard>
          <StatCard whileHover={{ y: -2 }}>
            <StatIconBox $bg="#fdf0f0"><AlertTriangle size={18} color="#c53030" /></StatIconBox>
            <StatInfo>
              <StatLabel>Atrasadas</StatLabel>
              <StatValue $color="#c53030">{atrasadas}</StatValue>
            </StatInfo>
          </StatCard>
          <StatCard whileHover={{ y: -2 }}>
            <StatIconBox $bg="#e8f5ee"><Check size={18} color="#1a7a4a" /></StatIconBox>
            <StatInfo>
              <StatLabel>Concluídas</StatLabel>
              <StatValue $color="#1a7a4a">{transmitidos}</StatValue>
            </StatInfo>
          </StatCard>
        </StatsRow>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Toolbar>
          <SearchBox>
            <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
            <input placeholder="Buscar obrigação..." value={search} onChange={e => setSearch(e.target.value)} />
          </SearchBox>
          <TabRow>
            {[['todos', 'Todas'], ['pendente', 'Pendentes'], ['atrasado', 'Atrasadas'], ['transmitido', 'Concluídas']].map(([v, l]) => (
              <Tab key={v} $active={tab === v} onClick={() => setTab(v)}>{l}</Tab>
            ))}
          </TabRow>
        </Toolbar>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          {loading ? (
            <EmptyState>⏳ Carregando...</EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <div style={{ fontFamily: 'Playfair Display', fontSize: 20, marginBottom: 6 }}>Nenhuma obrigação</div>
              <div style={{ fontSize: 13 }}>Adicione obrigações para acompanhar os vencimentos</div>
            </EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <Thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Cliente</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </Thead>
                <Tbody>
                  {filtered.map(o => {
                    const effStatus = getEffStatus(o)
                    return (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 500 }}>{o.tipo}</td>
                        <td style={{ fontSize: 12 }}>{(o as any).clientes?.razao_social || 'Geral'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {o.vencimento ? new Date(o.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td><StatusBadge $status={effStatus}>{effStatus === 'pendente' ? 'Pendente' : effStatus === 'atrasado' ? 'Atrasado' : 'Concluído'}</StatusBadge></td>
                        <td>
                          {effStatus === 'transmitido' ? (
                            <UndoBtn onClick={() => markUndone(o.id)}>Desfazer</UndoBtn>
                          ) : (
                            <ActionBtn onClick={() => markDone(o.id)}>
                              <Check size={11} style={{ marginRight: 4 }} />
                              Concluir
                            </ActionBtn>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </Tbody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {showModal && (
          <Overlay onClick={() => setShowModal(false)}>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHead>
                <ModalTitle>Nova Obrigação</ModalTitle>
                <CloseBtn onClick={() => setShowModal(false)}><X size={14} /></CloseBtn>
              </ModalHead>
              <ModalBody>
                <Field>
                  <FieldLabel>Tipo de Obrigação *</FieldLabel>
                  <Select value={form.tipo} onChange={e => upd('tipo', e.target.value)}>
                    {obrigacaoTipos.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Vencimento *</FieldLabel>
                  <Input type="date" value={form.vencimento} onChange={e => upd('vencimento', e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select value={form.status} onChange={e => upd('status', e.target.value)}>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="transmitido">Concluída</option>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Cliente (opcional)</FieldLabel>
                  <Select value={form.cliente_id} onChange={e => upd('cliente_id', e.target.value)}>
                    <option value="">Geral (todos os clientes)</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </Select>
                </Field>
              </ModalBody>
              <ModalFooter>
                <CancelBtn onClick={() => setShowModal(false)}>Cancelar</CancelBtn>
                <SaveBtn onClick={handleSave} whileTap={{ scale: 0.97 }} disabled={saving || !canEdit}>
                  {saving ? 'Salvando...' : 'Cadastrar Obrigação'}
                </SaveBtn>
              </ModalFooter>
            </Modal>
          </Overlay>
        )}
    </motion.div>
  )
}
