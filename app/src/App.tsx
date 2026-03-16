import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import { useAuthStore } from './stores/authStore'
import { LandingPage } from './features/landing/LandingPage'
import { LoginPage } from './features/auth/LoginPage'
import { ClienteLoginPage } from './features/cliente-portal/ClienteLoginPage'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'

const DashboardPage      = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientsPage        = lazy(() => import('./features/clients/ClientsPage').then(m => ({ default: m.ClientsPage })))
const AccountingPage     = lazy(() => import('./features/accounting/AccountingPage').then(m => ({ default: m.AccountingPage })))
const ChartOfAccountsPage= lazy(() => import('./features/chart-of-accounts/ChartOfAccountsPage').then(m => ({ default: m.ChartOfAccountsPage })))
const ReportsPage        = lazy(() => import('./features/reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const PayrollPage        = lazy(() => import('./features/payroll/PayrollPage').then(m => ({ default: m.PayrollPage })))
const ObligationsPage    = lazy(() => import('./features/obligations/ObligationsPage').then(m => ({ default: m.ObligationsPage })))
const ReconciliationPage = lazy(() => import('./features/reconciliation/ReconciliationPage').then(m => ({ default: m.ReconciliationPage })))
const SettingsPage       = lazy(() => import('./features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ClientePortalPage  = lazy(() => import('./features/cliente-portal/ClientePortalPage').then(m => ({ default: m.ClientePortalPage })))

// ── Novas páginas ────────────────────────────────────────────────────────────
const AgendaFiscalPage   = lazy(() => import('./features/agenda/AgendaFiscalPage').then(m => ({ default: m.AgendaFiscalPage })))
const HonorariosPage     = lazy(() => import('./features/honorarios/HonorariosPage').then(m => ({ default: m.HonorariosPage })))
const AtendimentosPage   = lazy(() => import('./features/atendimentos/AtendimentosPage').then(m => ({ default: m.AtendimentosPage })))
const FluxoCaixaPage     = lazy(() => import('./features/fluxo/FluxoCaixaPage').then(m => ({ default: m.FluxoCaixaPage })))
const ControleTempo      = lazy(() => import('./features/tempo/ControleTempo').then(m => ({ default: m.ControleTempo })))
const NfsePage           = lazy(() => import('./features/nfse/NfsePage').then(m => ({ default: m.NfsePage })))

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <div style={{ width: 28, height: 28, border: '2px solid #e2ddd6', borderTop: '2px solid #1a7a4a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

function App() {
  const { initialize, isInitialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f7f5f0'
      }}>
        <div style={{ width: 32, height: 32, border: '2px solid #e2ddd6', borderTop: '2px solid #1a7a4a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard"    element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="clientes"     element={<Suspense fallback={<PageLoader />}><ClientsPage /></Suspense>} />
        <Route path="lancamentos"  element={<Suspense fallback={<PageLoader />}><AccountingPage /></Suspense>} />
        <Route path="plano"        element={<Suspense fallback={<PageLoader />}><ChartOfAccountsPage /></Suspense>} />
        <Route path="relatorios"   element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
        <Route path="folha"        element={<Suspense fallback={<PageLoader />}><PayrollPage /></Suspense>} />
        <Route path="obrigacoes"   element={<Suspense fallback={<PageLoader />}><ObligationsPage /></Suspense>} />
        <Route path="conciliacao"  element={<Suspense fallback={<PageLoader />}><ReconciliationPage /></Suspense>} />
        <Route path="config"       element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
        {/* Novas rotas */}
        <Route path="agenda"       element={<Suspense fallback={<PageLoader />}><AgendaFiscalPage /></Suspense>} />
        <Route path="honorarios"   element={<Suspense fallback={<PageLoader />}><HonorariosPage /></Suspense>} />
        <Route path="atendimentos" element={<Suspense fallback={<PageLoader />}><AtendimentosPage /></Suspense>} />
        <Route path="fluxo"        element={<Suspense fallback={<PageLoader />}><FluxoCaixaPage /></Suspense>} />
        <Route path="tempo"        element={<Suspense fallback={<PageLoader />}><ControleTempo /></Suspense>} />
        <Route path="nfse"         element={<Suspense fallback={<PageLoader />}><NfsePage /></Suspense>} />
      </Route>
      <Route path="/portal" element={<ClienteLoginPage />} />
      <Route path="/portal/dashboard" element={<Suspense fallback={<PageLoader />}><ClientePortalPage /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
