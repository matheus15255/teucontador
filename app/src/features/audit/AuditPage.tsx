import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Search, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

const PageHeader = styled.div`margin-bottom: 24px;`
const PageTitle = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`
const Toolbar = styled.div`display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;`
const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px; background: ${({ theme }) => theme.surface};
  border: 1.5px solid ${({ theme }) => theme.border}; border-radius: 9px; padding: 8px 13px; width: 280px;
  &:focus-within { border-color: ${({ theme }) => theme.greenMid}; }
  input { border: none; background: none; font-size: 13px; color: ${({ theme }) => theme.text}; outline: none; width: 100%; font-family: 'Inter', sans-serif; &::placeholder { color: ${({ theme }) => theme.textDim}; } }
  @media (max-width: 600px) { width: 100%; }
`
const FilterSelect = styled.select`
  padding: 8px 13px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; color: ${({ theme }) => theme.text};
  font-size: 13px; font-family: 'Inter', sans-serif; outline: none; cursor: pointer;
`
const Card = styled(motion.div)`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; overflow: hidden; box-shadow: ${({ theme }) => theme.shadow};
`
const Table = styled.table`width: 100%; border-collapse: collapse;`
const Thead = styled.thead`
  th { padding: 10px 14px; text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: ${({ theme }) => theme.textDim};
    background: ${({ theme }) => theme.surface2}; border-bottom: 1px solid ${({ theme }) => theme.border}; }
`
const Tbody = styled.tbody`
  tr { border-bottom: 1px solid ${({ theme }) => theme.border}; &:last-child { border-bottom: none; } &:hover { background: ${({ theme }) => theme.surface2}; } }
  td { padding: 10px 14px; font-size: 12px; color: ${({ theme }) => theme.text}; }
`
const AcaoBadge = styled.span<{ $acao: string }>`
  display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 20px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  background: ${({ $acao }) => $acao === 'criar' ? '#d1fae5' : $acao === 'editar' ? '#dbeafe' : '#fee2e2'};
  color: ${({ $acao }) => $acao === 'criar' ? '#065f46' : $acao === 'editar' ? '#1e40af' : '#991b1b'};
`
const EmptyState = styled.div`text-align: center; padding: 60px 20px; color: ${({ theme }) => theme.textDim};`

interface AuditEntry {
  id: string
  tabela: string
  registro_id: string | null
  acao: string
  usuario_email: string | null
  created_at: string
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

export function AuditPage() {
  const { escritorio } = useAuthStore()
  const escId = escritorio?.id
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAcao, setFilterAcao] = useState('')

  useEffect(() => {
    if (!escId) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('audit_log')
        .select('id, tabela, registro_id, acao, usuario_email, created_at')
        .eq('escritorio_id', escId)
        .order('created_at', { ascending: false })
        .limit(200)
      setEntries((data || []) as AuditEntry[])
      setLoading(false)
    }
    load()
  }, [escId])

  const filtered = entries.filter(e => {
    if (filterAcao && e.acao !== filterAcao) return false
    if (search) {
      const q = search.toLowerCase()
      return e.tabela?.toLowerCase().includes(q) || e.usuario_email?.toLowerCase().includes(q) || e.registro_id?.toLowerCase().includes(q)
    }
    return true
  })

  const tabelaLabel: Record<string, string> = {
    clientes: 'Clientes', lancamentos: 'Lançamentos', obrigacoes: 'Obrigações',
    colaboradores: 'Colaboradores', honorarios: 'Honorários', tarefas: 'Tarefas',
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <motion.div variants={itemVariants}>
        <PageHeader>
          <PageTitle>Audit <em>Trail</em></PageTitle>
          <PageSub>Registro completo de todas as alterações feitas no sistema</PageSub>
        </PageHeader>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Toolbar>
          <SearchBox>
            <Search size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
            <input placeholder="Buscar por tabela ou usuário..." value={search} onChange={e => setSearch(e.target.value)} />
          </SearchBox>
          <FilterSelect value={filterAcao} onChange={e => setFilterAcao(e.target.value)}>
            <option value="">Todas as ações</option>
            <option value="criar">Criar</option>
            <option value="editar">Editar</option>
            <option value="excluir">Excluir</option>
          </FilterSelect>
        </Toolbar>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          {loading ? (
            <EmptyState>⏳ Carregando...</EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState>
              <Shield size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <div style={{ fontFamily: 'Playfair Display', fontSize: 18, marginBottom: 6 }}>Nenhum registro de auditoria</div>
              <div style={{ fontSize: 13 }}>As alterações feitas no sistema aparecerão aqui.</div>
            </EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <Thead>
                  <tr>
                    <th>Data / Hora</th>
                    <th>Tabela</th>
                    <th>Ação</th>
                    <th>Registro</th>
                    <th>Usuário</th>
                  </tr>
                </Thead>
                <Tbody>
                  {filtered.map(e => (
                    <tr key={e.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {new Date(e.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td>{tabelaLabel[e.tabela] || e.tabela}</td>
                      <td><AcaoBadge $acao={e.acao}>{e.acao}</AcaoBadge></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 10, opacity: 0.6 }}>
                        {e.registro_id ? e.registro_id.slice(0, 8) + '…' : '—'}
                      </td>
                      <td style={{ opacity: 0.7 }}>{e.usuario_email || '—'}</td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
