import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { Plus, X, Trash2, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

const overlayIn = keyframes`from{opacity:0}to{opacity:1}`
const modalIn = keyframes`from{opacity:0;transform:scale(0.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}`

const PageHeader = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;`
const PageTitle = styled.h1`font-family:'Playfair Display',serif;font-size:28px;font-weight:400;letter-spacing:-0.5px;color:${({theme})=>theme.text};em{font-style:italic;color:${({theme})=>theme.green};}`
const PageSub = styled.p`font-size:13px;color:${({theme})=>theme.textDim};margin-top:3px;`
const AddBtn = styled(motion.button)`display:flex;align-items:center;gap:8px;padding:10px 18px;background:${({theme})=>theme.green};color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;`
const Card = styled(motion.div)`background:${({theme})=>theme.surface};border:1px solid ${({theme})=>theme.border};border-radius:14px;overflow:hidden;box-shadow:${({theme})=>theme.shadow};`
const Table = styled.table`width:100%;border-collapse:collapse;`
const Thead = styled.thead`th{padding:10px 14px;text-align:left;font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${({theme})=>theme.textDim};background:${({theme})=>theme.surface2};border-bottom:1px solid ${({theme})=>theme.border};}`
const Tbody = styled.tbody`tr{border-bottom:1px solid ${({theme})=>theme.border};&:last-child{border-bottom:none;}&:hover{background:${({theme})=>theme.surface2};}}td{padding:11px 14px;font-size:13px;}`
const EmptyState = styled.div`text-align:center;padding:60px 20px;color:${({theme})=>theme.textDim};`
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;animation:${overlayIn} 0.18s ease;`
const Modal = styled.div`background:${({theme})=>theme.surface};border-radius:16px;padding:28px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:${modalIn} 0.2s ease;`
const ModalTitle = styled.div`font-family:'Playfair Display',serif;font-size:20px;color:${({theme})=>theme.text};margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;`
const Field = styled.div`display:flex;flex-direction:column;gap:5px;margin-bottom:14px;`
const Label = styled.label`font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${({theme})=>theme.textDim};`
const Input = styled.input`padding:9px 12px;border-radius:8px;border:1.5px solid ${({theme})=>theme.border};background:${({theme})=>theme.surface2};color:${({theme})=>theme.text};font-size:13px;font-family:'Inter',sans-serif;outline:none;&:focus{border-color:${({theme})=>theme.greenMid};}`
const SaveBtn = styled.button`width:100%;padding:11px;border-radius:9px;background:${({theme})=>theme.green};color:#fff;border:none;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer;&:hover{opacity:0.88;}&:disabled{opacity:0.55;cursor:not-allowed;}`
const Toggle = styled.div<{$on:boolean}>`width:36px;height:20px;border-radius:10px;cursor:pointer;position:relative;background:${({$on,theme})=>$on?theme.green:theme.border2};transition:background 0.3s;&::after{content:'';position:absolute;width:14px;height:14px;background:#fff;border-radius:50%;top:3px;left:${({$on})=>$on?'19px':'3px'};transition:left 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.2);}`
const DeleteBtn = styled.button`padding:4px 10px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;background:transparent;color:#dc2626;border:1px solid #fecaca;font-family:'Inter',sans-serif;transition:all 0.2s;&:hover{background:#fee2e2;}`

interface CentroCusto {
  id: string
  codigo: string
  nome: string
  ativo: boolean
  created_at: string
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

export function CentroCustoPage() {
  const { escritorio } = useAuthStore()
  const escId = escritorio?.id
  const [centros, setCentros] = useState<CentroCusto[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ codigo: '', nome: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!escId) return
    setLoading(true)
    const { data } = await supabase.from('centros_custo').select('*').eq('escritorio_id', escId).order('codigo')
    setCentros((data || []) as CentroCusto[])
    setLoading(false)
  }

  useEffect(() => { load() }, [escId])

  const handleSave = async () => {
    if (!form.codigo.trim() || !form.nome.trim()) { toast.error('Preencha código e nome'); return }
    if (!escId) return
    setSaving(true)
    const { error } = await supabase.from('centros_custo').insert({ escritorio_id: escId, codigo: form.codigo.trim().toUpperCase(), nome: form.nome.trim() })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Centro de custo criado!')
    setShowModal(false)
    setForm({ codigo: '', nome: '' })
    load()
  }

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from('centros_custo').update({ ativo: !ativo }).eq('id', id)
    setCentros(prev => prev.map(c => c.id === id ? { ...c, ativo: !ativo } : c))
  }

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Excluir "${nome}"?`)) return
    const { error } = await supabase.from('centros_custo').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Centro de custo excluído.')
    setCentros(prev => prev.filter(c => c.id !== id))
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <motion.div variants={itemVariants}>
        <PageHeader>
          <div>
            <PageTitle>Centro de <em>Custo</em></PageTitle>
            <PageSub>Classifique lançamentos por departamento ou projeto</PageSub>
          </div>
          <AddBtn onClick={() => setShowModal(true)} whileTap={{ scale: 0.97 }}>
            <Plus size={14} /> Novo Centro
          </AddBtn>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          {loading ? (
            <EmptyState>⏳ Carregando...</EmptyState>
          ) : centros.length === 0 ? (
            <EmptyState>
              <Layers size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <div style={{ fontFamily: 'Playfair Display', fontSize: 18, marginBottom: 6 }}>Nenhum centro de custo</div>
              <div style={{ fontSize: 13 }}>Crie centros de custo para classificar seus lançamentos por departamento ou projeto.</div>
            </EmptyState>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </Thead>
              <Tbody>
                {centros.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1a7a4a' }}>{c.codigo}</td>
                    <td>{c.nome}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Toggle $on={c.ativo} onClick={() => toggleAtivo(c.id, c.ativo)} />
                        <span style={{ fontSize: 11, opacity: 0.6 }}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </td>
                    <td>
                      <DeleteBtn onClick={() => handleDelete(c.id, c.nome)}>
                        <Trash2 size={12} style={{ display: 'inline', marginRight: 4 }} />Excluir
                      </DeleteBtn>
                    </td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      </motion.div>

      {showModal && (
        <Overlay onClick={() => setShowModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalTitle>
              Novo Centro de Custo
              <X size={18} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setShowModal(false)} />
            </ModalTitle>
            <Field>
              <Label>Código</Label>
              <Input placeholder="Ex: ADM, PROD, TI" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
            </Field>
            <Field>
              <Label>Nome</Label>
              <Input placeholder="Ex: Administrativo" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSave()} />
            </Field>
            <SaveBtn onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : 'Criar Centro de Custo'}</SaveBtn>
          </Modal>
        </Overlay>
      )}
    </motion.div>
  )
}
