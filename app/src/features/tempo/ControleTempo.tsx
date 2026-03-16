import { useState, useMemo, useRef, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { Timer, Play, Square, Plus, Trash2, Search, X, Clock } from 'lucide-react'
import { format, differenceInMinutes, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'

// ─── Styled ─────────────────────────────────────────────────────────────────
const overlayIn = keyframes`from{opacity:0}to{opacity:1}`
const modalIn   = keyframes`from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}`
const pulse     = keyframes`0%,100%{opacity:1}50%{opacity:0.5}`

const PageHeader = styled.div`margin-bottom: 20px;`
const PageTitle  = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

// Timer Widget
const TimerCard = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; padding: 20px; box-shadow: ${({ theme }) => theme.shadow}; margin-bottom: 20px;
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
`
const TimerDisplay = styled.div<{ $running: boolean }>`
  font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 400;
  color: ${({ theme, $running }) => $running ? theme.green : theme.text};
  min-width: 110px;
  animation: ${({ $running }) => $running ? pulse : 'none'} 2s ease-in-out infinite;
`
const TimerFields = styled.div`display: flex; gap: 10px; flex: 1; flex-wrap: wrap; align-items: center;`
const TimerSelect = styled.select`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; flex: 1; min-width: 140px;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; }
`
const TimerInput = styled.input`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; flex: 2; min-width: 160px;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; }
  &::placeholder { color: ${({ theme }) => theme.textDim}; }
`
const PlayBtn = styled.button<{ $running: boolean }>`
  display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px;
  background: ${({ theme, $running }) => $running ? '#dc2626' : theme.green};
  color: #fff; border: none; font-size: 13.5px; font-weight: 600;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity 0.2s; white-space: nowrap;
  &:hover { opacity: 0.87; } &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const Toolbar = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;`
const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 7px 12px; flex: 1; max-width: 280px;
  &:focus-within { border-color: ${({ theme }) => theme.greenMid}; }
  input { border: none; background: none; font-size: 12.5px; color: ${({ theme }) => theme.text};
    outline: none; width: 100%; font-family: 'Inter', sans-serif;
    &::placeholder { color: ${({ theme }) => theme.textDim}; } }
`
const Select = styled.select`
  padding: 7px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif;
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
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`
const StatCard = styled.div<{ $accent: string }>`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 16px; box-shadow: ${({ theme }) => theme.shadow};
  border-left: 3px solid ${({ $accent }) => $accent};
`
const StatLabel = styled.div`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};`
const StatValue = styled.div`font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400; color: ${({ theme }) => theme.text}; margin-top: 4px;`

const Table = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`
const TableHead = styled.div`
  display: grid; grid-template-columns: 2fr 1.5fr 1fr 80px 90px;
  padding: 10px 18px; border-bottom: 1px solid ${({ theme }) => theme.border};
  @media (max-width: 700px) { grid-template-columns: 2fr 1fr 90px; }
`
const Th = styled.div`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};`
const Row = styled.div`
  display: grid; grid-template-columns: 2fr 1.5fr 1fr 80px 90px;
  padding: 12px 18px; border-bottom: 1px solid ${({ theme }) => theme.border};
  align-items: center;
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
  @media (max-width: 700px) { grid-template-columns: 2fr 1fr 90px; }
`
const Td  = styled.div`font-size: 13px; color: ${({ theme }) => theme.text};`
const TdSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`
const TdHide = styled(Td)`@media (max-width: 700px) { display: none; }`
const DelBtn = styled.button`
  width: 28px; height: 28px; border-radius: 7px; border: 1.5px solid ${({ theme }) => theme.border};
  background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: ${({ theme }) => theme.textDim}; transition: all 0.2s;
  &:hover { border-color: #dc262633; background: #dc262611; color: #dc2626; }
`
const EmptyState = styled.div`
  padding: 50px 20px; text-align: center; color: ${({ theme }) => theme.textDim}; font-size: 14px;
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
  width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
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
  font-size: 13.5px; font-family: 'Inter', sans-serif;
  &:focus { outline: none; border-color: ${({ theme }) => theme.greenMid}; box-shadow: 0 0 0 3px rgba(34,160,98,0.1); }
`
const ModalSelect = styled.select`
  padding: 9px 12px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13.5px; font-family: 'Inter', sans-serif;
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatMinutes(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}
function formatElapsed(startedAt: Date): string {
  const secs = Math.floor((Date.now() - startedAt.getTime()) / 1000)
  const h = Math.floor(secs / 3600).toString().padStart(2, '0')
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function ControleTempo() {
  const { escritorio } = useAuthStore()
  const { clientes, registrosTempo, setRegistrosTempo } = useDataStore()
  const escId = escritorio?.id

  const [search, setSearch]               = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const [showModal, setShowModal]         = useState(false)
  const [saving, setSaving]               = useState(false)
  const savingRef = useRef(false)

  // Timer state
  const [timerRunning, setTimerRunning]   = useState(false)
  const [timerStart, setTimerStart]       = useState<Date | null>(null)
  const [timerDisplay, setTimerDisplay]   = useState('00:00:00')
  const [timerCliente, setTimerCliente]   = useState('')
  const [timerDesc, setTimerDesc]         = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Manual form
  const blank = () => ({
    cliente_id: '', descricao: '', inicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    fim: format(new Date(), "yyyy-MM-dd'T'HH:mm"), responsavel: '',
  })
  const [form, setForm] = useState(blank())

  // Timer tick
  useEffect(() => {
    if (timerRunning && timerStart) {
      intervalRef.current = setInterval(() => {
        setTimerDisplay(formatElapsed(timerStart))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (!timerRunning) setTimerDisplay('00:00:00')
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerRunning, timerStart])

  async function handleTimer() {
    if (!timerRunning) {
      if (!timerDesc) { toast.error('Informe a descrição antes de iniciar'); return }
      setTimerStart(new Date())
      setTimerRunning(true)
      toast.success('Timer iniciado')
    } else {
      // Parar e salvar
      if (!escId || !timerStart) return
      setTimerRunning(false)
      const fim = new Date()
      const minutos = Math.max(1, differenceInMinutes(fim, timerStart))
      const { error } = await supabase
        .from('registros_tempo')
        .insert({
          escritorio_id: escId,
          cliente_id: timerCliente || null,
          descricao: timerDesc,
          inicio: timerStart.toISOString(),
          fim: fim.toISOString(),
          minutos,
        })
      if (error) { toast.error('Erro ao salvar tempo'); return }
      const { data: fresh } = await supabase
        .from('registros_tempo').select('*,clientes(razao_social)')
        .eq('escritorio_id', escId).order('inicio', { ascending: false }).limit(300)
      setRegistrosTempo(fresh || [])
      toast.success(`Tempo salvo: ${formatMinutes(minutos)}`)
      setTimerDesc(''); setTimerCliente('')
    }
  }

  async function handleSave() {
    if (savingRef.current) return
    if (!form.descricao) { toast.error('Informe a descrição'); return }
    if (!escId) return
    savingRef.current = true; setSaving(true)
    try {
      const inicio = new Date(form.inicio)
      const fim    = new Date(form.fim)
      const minutos = Math.max(1, differenceInMinutes(fim, inicio))
      const { error } = await supabase
        .from('registros_tempo')
        .insert({
          escritorio_id: escId,
          cliente_id: form.cliente_id || null,
          descricao: form.descricao,
          inicio: inicio.toISOString(),
          fim: fim.toISOString(),
          minutos,
          responsavel: form.responsavel || null,
        })
      if (error) throw error
      const { data: fresh } = await supabase
        .from('registros_tempo').select('*,clientes(razao_social)')
        .eq('escritorio_id', escId).order('inicio', { ascending: false }).limit(300)
      setRegistrosTempo(fresh || [])
      toast.success('Registro salvo')
      setShowModal(false); setForm(blank())
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar')
    } finally {
      savingRef.current = false; setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!escId || !confirm('Excluir registro?')) return
    const { error } = await supabase.from('registros_tempo').delete().eq('id', id).eq('escritorio_id', escId)
    if (error) { toast.error('Erro ao excluir'); return }
    setRegistrosTempo(registrosTempo.filter((r: any) => r.id !== id))
    toast.success('Excluído')
  }

  const filtered = useMemo(() => {
    let list = [...registrosTempo]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r: any) =>
        r.descricao?.toLowerCase().includes(q) || r.clientes?.razao_social?.toLowerCase().includes(q)
      )
    }
    if (filterCliente) list = list.filter((r: any) => r.cliente_id === filterCliente)
    return list
  }, [registrosTempo, search, filterCliente])

  const stats = useMemo(() => {
    const totalMin = registrosTempo.reduce((s: number, r: any) => s + (r.minutos || 0), 0)
    const hoje = format(new Date(), 'yyyy-MM-dd')
    const hojeMin = registrosTempo
      .filter((r: any) => r.inicio?.startsWith(hoje))
      .reduce((s: number, r: any) => s + (r.minutos || 0), 0)
    const byCliente: Record<string, number> = {}
    registrosTempo.forEach((r: any) => {
      const key = r.clientes?.razao_social || 'Sem cliente'
      byCliente[key] = (byCliente[key] || 0) + (r.minutos || 0)
    })
    const topCliente = Object.entries(byCliente).sort((a, b) => b[1] - a[1])[0]
    return { totalMin, hojeMin, topCliente: topCliente?.[0] || '—', topMin: topCliente?.[1] || 0 }
  }, [registrosTempo])

  return (
    <>
      <PageHeader>
        <PageTitle>Controle de <em>Tempo</em></PageTitle>
        <PageSub>Registre horas trabalhadas por cliente e acompanhe a produtividade</PageSub>
      </PageHeader>

      {/* Timer */}
      <TimerCard>
        <Clock size={20} style={{ opacity: 0.4, flexShrink: 0 }} />
        <TimerDisplay $running={timerRunning}>{timerDisplay}</TimerDisplay>
        <TimerFields>
          <TimerSelect value={timerCliente} onChange={e => setTimerCliente(e.target.value)}>
            <option value="">— Sem cliente —</option>
            {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
          </TimerSelect>
          <TimerInput
            placeholder="Descrição da atividade..."
            value={timerDesc}
            onChange={e => setTimerDesc(e.target.value)}
            disabled={timerRunning}
          />
        </TimerFields>
        <PlayBtn $running={timerRunning} onClick={handleTimer}>
          {timerRunning ? <><Square size={14} />Parar</> : <><Play size={14} />Iniciar</>}
        </PlayBtn>
      </TimerCard>

      <StatsRow>
        <StatCard $accent="#1a7a4a">
          <StatLabel>Total Acumulado</StatLabel>
          <StatValue>{formatMinutes(stats.totalMin)}</StatValue>
        </StatCard>
        <StatCard $accent="#2563eb">
          <StatLabel>Hoje</StatLabel>
          <StatValue>{formatMinutes(stats.hojeMin)}</StatValue>
        </StatCard>
        <StatCard $accent="#7c3aed">
          <StatLabel>Top Cliente</StatLabel>
          <StatValue style={{ fontSize: 16 }}>{stats.topCliente}</StatValue>
          <div style={{ fontSize: 12, color: 'var(--textDim)', marginTop: 2 }}>{formatMinutes(stats.topMin)}</div>
        </StatCard>
      </StatsRow>

      <Toolbar>
        <SearchBox>
          <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
          <input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </SearchBox>
        <Select value={filterCliente} onChange={e => setFilterCliente(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
        </Select>
        <Spacer />
        <AddBtn onClick={() => setShowModal(true)}><Plus size={14} />Manual</AddBtn>
      </Toolbar>

      <Table>
        <TableHead>
          <Th>Descrição</Th>
          <TdHide as="div" style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.7px',color:'var(--textDim)' }}>Cliente</TdHide>
          <Th>Data</Th>
          <TdHide as="div" style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.7px',color:'var(--textDim)' }}>Duração</TdHide>
          <Th style={{ textAlign: 'right' }}>Ações</Th>
        </TableHead>
        {filtered.length === 0 ? (
          <EmptyState>Nenhum registro. Inicie o timer ou adicione manualmente.</EmptyState>
        ) : filtered.map((r: any) => (
          <Row key={r.id}>
            <Td>{r.descricao}<TdSub>{r.responsavel}</TdSub></Td>
            <TdHide>{r.clientes?.razao_social || '—'}</TdHide>
            <Td>{r.inicio ? format(parseISO(r.inicio), 'dd/MM/yy HH:mm', { locale: ptBR }) : '—'}</Td>
            <TdHide>{formatMinutes(r.minutos || 0)}</TdHide>
            <Td style={{ textAlign: 'right' }}>
              <DelBtn onClick={() => handleDelete(r.id)}><Trash2 size={12} /></DelBtn>
            </Td>
          </Row>
        ))}
      </Table>

      {showModal && (
        <Overlay onClick={() => setShowModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Registro Manual</ModalTitle>
              <CloseBtn onClick={() => setShowModal(false)}><X size={14} /></CloseBtn>
            </ModalHead>
            <ModalBody>
              <FormGrid>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Descrição *</Label>
                  <Input placeholder="O que foi feito..." value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
                </Field>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Cliente</Label>
                  <ModalSelect value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                    <option value="">— Sem cliente —</option>
                    {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </ModalSelect>
                </Field>
                <Field>
                  <Label>Início</Label>
                  <Input type="datetime-local" value={form.inicio}
                    onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Fim</Label>
                  <Input type="datetime-local" value={form.fim}
                    onChange={e => setForm(f => ({ ...f, fim: e.target.value }))} />
                </Field>
                <Field style={{ gridColumn: '1/-1' }}>
                  <Label>Responsável</Label>
                  <Input placeholder="Nome..." value={form.responsavel}
                    onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
                </Field>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={() => setShowModal(false)}>Cancelar</CancelBtn>
              <SaveBtn disabled={saving} onClick={handleSave}>{saving ? 'Salvando...' : 'Salvar'}</SaveBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </>
  )
}
