import { useState, useMemo } from 'react'
import styled from 'styled-components'
import { TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval,
  eachMonthOfInterval, startOfYear, endOfYear, subYears, addYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ReactApexChart from 'react-apexcharts'
import { useDataStore } from '../../stores/dataStore'
import { useTheme } from '../../styles/ThemeProvider'

// ─── Styled ─────────────────────────────────────────────────────────────────
const PageHeader = styled.div`margin-bottom: 20px;`
const PageTitle  = styled.h1`
  font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400;
  letter-spacing: -0.5px; color: ${({ theme }) => theme.text};
  em { font-style: italic; color: ${({ theme }) => theme.green}; }
`
const PageSub = styled.p`font-size: 13px; color: ${({ theme }) => theme.textDim}; margin-top: 3px;`

const Toolbar = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap;`
const YearBtn = styled.button`
  width: 32px; height: 32px; border-radius: 9px; border: 1.5px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.surface}; cursor: pointer; display: flex;
  align-items: center; justify-content: center; color: ${({ theme }) => theme.textMid};
  font-size: 16px; font-weight: 500; transition: all 0.2s;
  &:hover { background: ${({ theme }) => theme.surface2}; }
`
const YearLabel = styled.div`
  font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 400;
  color: ${({ theme }) => theme.text}; min-width: 60px; text-align: center;
`

const StatsRow = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`
const StatCard = styled.div<{ $accent: string }>`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px; padding: 16px; box-shadow: ${({ theme }) => theme.shadow};
  border-left: 3px solid ${({ $accent }) => $accent};
`
const StatLabel = styled.div`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};`
const StatValue = styled.div<{ $color?: string }>`
  font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400;
  color: ${({ theme, $color }) => $color || theme.text}; margin-top: 4px;
`
const StatSub = styled.div`font-size: 11px; color: ${({ theme }) => theme.textDim}; margin-top: 2px;`

const ChartCard = styled.div`
  background: ${({ theme }) => theme.surface}; border: 1px solid ${({ theme }) => theme.border};
  border-radius: 14px; padding: 20px; box-shadow: ${({ theme }) => theme.shadow}; margin-bottom: 16px;
`
const ChartTitle = styled.div`font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 400; color: ${({ theme }) => theme.text}; margin-bottom: 16px;`

const TableCard = styled(ChartCard)``
const Table = styled.div`overflow-x: auto;`
const TableEl = styled.table`width: 100%; border-collapse: collapse;`
const Th = styled.th`
  padding: 9px 14px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.7px; color: ${({ theme }) => theme.textDim};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`
const ThRight = styled(Th)`text-align: right;`
const Tr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.surface2}; }
`
const Td = styled.td`padding: 11px 14px; font-size: 13px; color: ${({ theme }) => theme.text};`
const TdRight = styled(Td)`text-align: right;`
const TdNum = styled(TdRight)<{ $neg?: boolean }>`
  font-weight: 500; color: ${({ $neg }) => $neg ? '#dc2626' : '#16a34a'};
`
const TdSaldo = styled(TdRight)<{ $neg?: boolean }>`
  font-weight: 600; color: ${({ $neg }) => $neg ? '#dc2626' : '#1a7a4a'};
`
const TodayBadge = styled.span`
  background: ${({ theme }) => theme.greenLight}; color: ${({ theme }) => theme.green};
  padding: 1px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; margin-left: 6px;
`

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ─── Component ─────────────────────────────────────────────────────────────────
export function FluxoCaixaPage() {
  const { lancamentos, honorarios } = useDataStore()
  const { isDark } = useTheme()
  const [year, setYear] = useState(new Date().getFullYear())

  const months = useMemo(() =>
    eachMonthOfInterval({ start: startOfYear(new Date(year, 0)), end: endOfYear(new Date(year, 0)) }),
    [year]
  )

  const monthData = useMemo(() => {
    return months.map(monthDate => {
      const start = startOfMonth(monthDate)
      const end   = endOfMonth(monthDate)
      const label = format(monthDate, 'MMM', { locale: ptBR })
      const mesRef = format(monthDate, 'yyyy-MM')

      // Lançamentos reais do mês
      const lancsDoMes = lancamentos.filter((l: any) => {
        try { return isWithinInterval(parseISO(l.data_lanc), { start, end }) }
        catch { return false }
      })
      const entrada = lancsDoMes.filter((l: any) => l.tipo === 'credito').reduce((s: number, l: any) => s + (l.valor || 0), 0)
      const saida   = lancsDoMes.filter((l: any) => l.tipo === 'debito').reduce((s: number, l: any) => s + (l.valor || 0), 0)

      // Honorários esperados do mês (projeção de receita)
      const honDoMes = honorarios.filter((h: any) => h.mes_ref === mesRef)
      const honTotal = honDoMes.reduce((s: number, h: any) => s + (h.valor || 0), 0)
      const honPago  = honDoMes.filter((h: any) => h.status === 'pago').reduce((s: number, h: any) => s + (h.valor || 0), 0)

      const resultado   = entrada - saida
      const hoje = new Date()
      const isCurrentMonth = hoje >= start && hoje <= end
      const isFuture = start > hoje

      return { label, mesRef, entrada, saida, resultado, honTotal, honPago, isCurrentMonth, isFuture }
    })
  }, [months, lancamentos, honorarios])

  // Saldo acumulado
  const withSaldo = useMemo(() => {
    let acc = 0
    return monthData.map(m => {
      acc += m.resultado
      return { ...m, saldoAcc: acc }
    })
  }, [monthData])

  const totals = useMemo(() => {
    const entrada   = withSaldo.reduce((s, m) => s + m.entrada, 0)
    const saida     = withSaldo.reduce((s, m) => s + m.saida, 0)
    const resultado = entrada - saida
    const saldoFinal = withSaldo[withSaldo.length - 1]?.saldoAcc || 0
    return { entrada, saida, resultado, saldoFinal }
  }, [withSaldo])

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: isDark ? 'dark' : 'light' },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '55%' } },
    colors: ['#16a34a', '#dc2626', '#2563eb'],
    xaxis: { categories: withSaldo.map(m => m.label), labels: { style: { fontSize: '11px' } } },
    yaxis: { labels: { formatter: (v: number) => `R$${(v/1000).toFixed(0)}k` } },
    tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (v: number) => fmt(v) } },
    legend: { position: 'top' },
    grid: { borderColor: isDark ? '#2a2a2a' : '#f0ede8' },
    dataLabels: { enabled: false },
  }), [isDark, withSaldo])

  const chartSeries = [
    { name: 'Entradas', data: withSaldo.map(m => m.entrada) },
    { name: 'Saídas',   data: withSaldo.map(m => m.saida) },
  ]

  const lineOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#1a7a4a'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
    xaxis: { categories: withSaldo.map(m => m.label), labels: { style: { fontSize: '11px' } } },
    yaxis: { labels: { formatter: (v: number) => `R$${(v/1000).toFixed(0)}k` } },
    tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (v: number) => fmt(v) } },
    grid: { borderColor: isDark ? '#2a2a2a' : '#f0ede8' },
    dataLabels: { enabled: false },
  }), [isDark, withSaldo])

  const lineSeries = [{ name: 'Saldo Acumulado', data: withSaldo.map(m => m.saldoAcc) }]

  return (
    <>
      <PageHeader>
        <PageTitle>Fluxo de <em>Caixa</em></PageTitle>
        <PageSub>Análise de entradas, saídas e saldo acumulado do escritório</PageSub>
      </PageHeader>

      <Toolbar>
        <YearBtn onClick={() => setYear(y => y - 1)}>‹</YearBtn>
        <YearLabel>{year}</YearLabel>
        <YearBtn onClick={() => setYear(y => y + 1)}>›</YearBtn>
      </Toolbar>

      <StatsRow>
        <StatCard $accent="#16a34a">
          <StatLabel>Total Entradas</StatLabel>
          <StatValue $color="#16a34a">{fmt(totals.entrada)}</StatValue>
          <StatSub>Créditos no ano</StatSub>
        </StatCard>
        <StatCard $accent="#dc2626">
          <StatLabel>Total Saídas</StatLabel>
          <StatValue $color="#dc2626">{fmt(totals.saida)}</StatValue>
          <StatSub>Débitos no ano</StatSub>
        </StatCard>
        <StatCard $accent={totals.resultado >= 0 ? '#1a7a4a' : '#dc2626'}>
          <StatLabel>Resultado</StatLabel>
          <StatValue $color={totals.resultado >= 0 ? '#1a7a4a' : '#dc2626'}>{fmt(totals.resultado)}</StatValue>
          <StatSub>Entradas − Saídas</StatSub>
        </StatCard>
        <StatCard $accent="#2563eb">
          <StatLabel>Saldo Final Acumulado</StatLabel>
          <StatValue $color="#2563eb">{fmt(totals.saldoFinal)}</StatValue>
          <StatSub>Posição em dez/{year}</StatSub>
        </StatCard>
      </StatsRow>

      <ChartCard>
        <ChartTitle>Entradas × Saídas por Mês</ChartTitle>
        <ReactApexChart key={`bar-${isDark}`} options={chartOptions} series={chartSeries} type="bar" height={240} />
      </ChartCard>

      <ChartCard>
        <ChartTitle>Saldo Acumulado</ChartTitle>
        <ReactApexChart key={`line-${isDark}`} options={lineOptions} series={lineSeries} type="area" height={200} />
      </ChartCard>

      <TableCard>
        <ChartTitle>Detalhamento Mensal</ChartTitle>
        <Table>
          <TableEl>
            <thead>
              <tr>
                <Th>Mês</Th>
                <ThRight>Entradas</ThRight>
                <ThRight>Saídas</ThRight>
                <ThRight>Resultado</ThRight>
                <ThRight>Saldo Acumulado</ThRight>
              </tr>
            </thead>
            <tbody>
              {withSaldo.map(m => (
                <Tr key={m.mesRef}>
                  <Td>
                    {m.label.charAt(0).toUpperCase() + m.label.slice(1)} {year}
                    {m.isCurrentMonth && <TodayBadge>Atual</TodayBadge>}
                  </Td>
                  <TdNum>{fmt(m.entrada)}</TdNum>
                  <TdNum $neg>{fmt(m.saida)}</TdNum>
                  <TdNum $neg={m.resultado < 0}>{fmt(m.resultado)}</TdNum>
                  <TdSaldo $neg={m.saldoAcc < 0}>{fmt(m.saldoAcc)}</TdSaldo>
                </Tr>
              ))}
            </tbody>
          </TableEl>
        </Table>
      </TableCard>
    </>
  )
}
