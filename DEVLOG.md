# DEVLOG — TEUcontador

Arquivo de log de todas as alterações feitas pelo Claude.
**Atualizado a cada mudança.** Use este arquivo para contextualizar novas conversas.

---

## Sessão — 2026-03-29 (feat: Instagram na landing)

### Adição do Instagram no footer da landing

**Arquivos alterados:**
- `app/src/features/landing/LandingPage.tsx` — link Instagram adicionado na coluna "Empresa" do footer

**Link:** https://www.instagram.com/tecontador/

---

## Sessão — 2026-03-29 (fix: atualização número WhatsApp)

### Atualização do número de suporte WhatsApp

**Número novo:** (11) 91312-7582 → `https://wa.me/5511913127582`

**Arquivos alterados (React — fonte real do Vercel):**
- `app/src/components/ChatbotWidget.tsx` — link e número exibido no card de suporte
- `app/src/features/landing/LandingPage.tsx` — botão "Falar com especialista" (hero) e link WhatsApp no footer

**Observação:** alterações feitas inicialmente nos HTMLs estáticos da raiz (`landing.html`, `dashboard.html`, `js/dashboard.js`) foram inválidas pois o Vercel serve apenas o build React em `app/dist`. Nunca editar apenas os HTMLs da raiz.

---

## Sessão — 2026-03-29 (feat: módulo Contas a Pagar / Receber)

### Novo módulo completo de gestão financeira

**Arquivos criados:**
- `app/src/features/contas/ContasPage.tsx` — página principal

**Arquivos alterados:**
- `app/src/types/index.ts` — interface `ContaPagarReceber`
- `app/src/stores/dataStore.ts` — fetch, state, realtime e setter para `contasPagarReceber`
- `app/src/App.tsx` — rota `/app/contas`
- `app/src/components/layout/AppLayout.tsx` — item no menu Gestão + título na topbar

**SQL criado no Supabase:**
- Tabela `contas_pagar_receber` com campos: tipo, descricao, valor, data_vencimento, status, data_pagamento, categoria, observacoes, cliente_id
- RLS configurado (acesso por escritorio_id)
- Índices em escritorio_id e data_vencimento

**Funcionalidades:**
- 4 cards de stats: A Pagar, A Receber, Saldo Previsto, Em Atraso
- Filtros por tipo (Todos / A Pagar / A Receber) e por status
- Tabela com badge de tipo, descrição, cliente/fornecedor, valor, vencimento e status
- Ações: marcar pago, marcar atrasado, editar, excluir
- Modal de criação/edição completo com categorias separadas por tipo
- Export para Excel
- Realtime via Supabase (atualização automática)

---

## Sessão — 2026-03-27b (fix: botão salvar travado em 'Salvando...')

### Fix: segundo fetch após INSERT travava o botão

**Arquivo alterado:**
- `app/src/features/tempo/ControleTempo.tsx`

**Problema:**
Após o INSERT, o código fazia um SELECT separado para recarregar todos os registros.
Esse segundo request ficava travado indefinidamente, mantendo `saving=true` para sempre.

**O que mudou:**
- Unificou INSERT + SELECT em um único request usando `.insert({...}).select('*, clientes(razao_social)').single()`
- Novo registro é adicionado diretamente no início da lista local (`[novo, ...registrosTempo]`)
- Elimina o roundtrip extra em `handleSave` e `handleTimer`

---

## Sessão — 2026-03-27 (fix: salvamento do timer no ControleTempo)

### Fix: timer não salvava ao parar

**Arquivo alterado:**
- `app/src/features/tempo/ControleTempo.tsx`

**Problema:**
O `handleTimer` não tinha try-catch — qualquer exceção do Supabase era silenciada sem feedback ao usuário. Também não havia guard contra duplo-clique.

**O que mudou:**
- Adicionado try-catch ao caminho de stop (igual ao padrão de `handleSave`)
- Valores de `timerStart`, `timerDesc`, `timerCliente` capturados em variáveis locais antes do `await` para evitar stale closures
- Adicionado estado `timerSaving` para bloquear duplo-clique e exibir "Salvando..."
- Em caso de erro: toast com mensagem real do Supabase + timer reativado para nova tentativa
- Fetch pós-insert agora verifica erro separadamente e não apaga dados se falhar

---

## Sessão — 2026-03-25 (trial 3 dias + plano único no cadastro)

### Feat: trial reduzido e seleção de planos removida

**Arquivos alterados:**
- `app/src/features/auth/LoginPage.tsx`
- `app/src/features/landing/LandingPage.tsx`
- `app/src/features/subscription/PaywallModal.tsx`
- `app/src/features/onboarding/WelcomeModal.tsx`

**O que mudou:**
- Todo o site: "14 dias grátis" → "3 dias grátis"
- Cadastro step 2: grade de 3 planos removida, exibe apenas "Plano Pro — R$ 197/mês"
- Cadastro step 3: resumo mostra plano fixo "📦 Plano Pro — R$ 197/mês (3 dias grátis)"
- Backend: `plano: 'pro'` hardcoded no signUp e insert do escritório

---

## Sessão — 2026-03-25 (seção pessoa na landing)

### Feat: seção com foto de profissional na landing page

**Arquivos alterados:**
- `app/src/features/landing/LandingPage.tsx`

**O que mudou:**
- Nova seção `PersonSection` entre TrustBadges e PainSection
- Foto de profissional via Unsplash CDN
- Badge flutuante "−68% de retrabalho"
- Selo "Aprovado pelo CFC"
- Quote de testemunho com borda azul
- 3 stats: retrabalho, clientes, tempo no SPED
- Layout responsivo (grid 2 colunas → 1 coluna em mobile)

---

## Sessão — 2026-03-25 (fix RLS Supabase + dataStore resiliente)

### Fix: erro "more than one row" nas queries Supabase

**Arquivos alterados:**
- `app/src/stores/dataStore.ts`
- `app/src/stores/authStore.ts`
- `supabase/fix_rls_guias_checklist.sql` (novo)

**O que mudou:**
- `fetchGuias` e `fetchChecklistDocumentos`: removido join `clientes(razao_social)` que causava HTTP 500
- `Promise.all` → `Promise.allSettled`: falha em um fetch não derruba os demais
- Error logging adicionado em todos os fetch functions e authStore
- SQL criado para corrigir RLS policies com LIMIT 1 e deletar escritórios duplicados

---

## Sessão — 2026-03-25 (redesign LoginPage — tema azul)

### Feat: LoginPage atualizada para tema azul

**Arquivos alterados:**
- `app/src/features/auth/LoginPage.tsx`

**O que mudou:**
- Painel esquerdo: gradiente verde `#1a7a4a` → azul `#007bff → #0050c8 → #001f6b`
- Fundo direito: `#f8f6f1` (bege) → `#f0f4ff` (azul claro)
- Tipografia: `Playfair Display` → `Inter` em todos os títulos
- Logo: removido `filter: brightness(0) invert(1)` (era branco demais)
- Botão submit: verde → azul `#007bff`
- Inputs focus: verde → azul `#007bff`
- PlanCard selecionado: verde → azul
- StepDot/StepLine: verde → azul
- Inline styles: todas as cores `#1a7a4a`, `#22a062` → `#007bff`

---

## Sessão — 2026-03-25 (fix responsividade mobile ClientePortalPage)

### Fix: responsividade mobile do portal do cliente

**Arquivos alterados:**
- `app/src/features/cliente-portal/ClientePortalPage.tsx`

**O que mudou:**
- `TopBar`: altura ajustada para 72px (desktop) / 60px (mobile) para acomodar logo
- Logo no TopBar: reduzida de `height: 120` para `height: 52` para caber na barra
- `ClienteName`: truncamento com `text-overflow: ellipsis`, oculta em telas < 480px
- `TopBarRight`: adicionado `flex-shrink: 0` para não comprimir os botões
- `TabRow`: adicionado `flex-wrap: wrap` + scroll horizontal em mobile
- `GreetingTitle`: `font-size` reduzido para 22px em mobile (< 480px)
- `GuiaPortalItem` e `DocPortalItem`: `flex-wrap: wrap` em mobile para itens não cortarem

---

## Sessão — 2026-03-25 (redesign landing page — estilo emitte)

### Feat: landing page redesenhada — azul primário + verde acento

**Arquivos alterados:**
- `app/src/features/landing/LandingPage.tsx` — redesign completo
- `app/index.html` — removida fonte Playfair Display, carrega Inter 300–900

**O que mudou:**
- **Paleta**: verde escuro `#1a7a4a` → azul primário `#1a56db` + verde acento `#22c55e`
- **Tipografia**: removida Playfair Display serif; Inter 800/900 em todos os headings (estilo SaaS moderno)
- **Hero**: gradiente navy/azul `#080f1e → #0c1a3a → #0f2060` com glow azul
- **Marquee**: gradiente azul `#1a56db → #1240b3`
- **Seções claras**: fundo `#f8fafc` ao invés de bege `#f8f6f1`; bordas `#e2e8f0`
- **Botões primários**: azul com sombra `rgba(26,86,219,.45)` ao invés de verde
- **Feature cards**: tags azuis (`#eff6ff / #dbeafe`) ao invés de bege
- **BigFeatureCard**: gradiente navy/azul com glow azul
- **StatsSection**: navy/azul ao invés de verde escuro
- **Pricing featured**: navy/azul com sombra azul
- **CTA section**: navy/azul ao invés de verde escuro
- **Footer**: `#060c1a` navy profundo ao invés de `#080f09`
- **FAQ ativo**: fundo `#eff6ff` ao invés de `#fafaf7`
- **Testimonials**: ícone VERIFICADO em azul ao invés de verde

**Estilo inspirado em:** emitte.com.br (SaaS B2B brasileiro)

---

## Sessão — 2026-03-19 (workflow de aprovação de lançamentos)

### Feat: workflow de aprovação de lançamentos contábeis

**Arquivos alterados:**
- `app/src/hooks/usePermission.ts` — adicionado `canApprove: role === 'admin'`
- `app/src/features/accounting/AccountingPage.tsx` — status visível, filtro, botões aprovar/rejeitar

**Como funciona:**
- Novos lançamentos são criados com `status: 'pendente'` (contador/assistente não pode alterar)
- Admin vê botões ✓ (verde) e ✗ (vermelho) em cada linha pendente
- Aprovação → `status = 'aprovado'`, rejeição → `status = 'cancelado'`
- Coluna "Status" exibe badge colorido: amarelo (pendente), verde (aprovado), vermelho (cancelado)
- Filtro por status na barra de filtros (Todos / Pendente / Aprovado / Cancelado)
- Atualização otimista no frontend sem reload completo

**Regras de permissão:**
- `admin` (dono do escritório): pode aprovar e rejeitar
- `contador`: cria e edita, mas não aprova
- `assistente`: somente leitura

---

## Sessão — 2026-03-19 (Fase 4 — enterprise features)

### Feat: centro de custo, audit trail, webhooks, BI export

**Arquivos criados:**
- `supabase/add_remaining_features.sql` — tabelas `centros_custo`, `audit_log`, `webhooks` com RLS
- `app/src/lib/audit.ts` — `logAudit()` helper (silent on failure)
- `app/src/lib/webhooks.ts` — `fireWebhooks()` helper com `X-Webhook-Secret` header
- `app/src/features/audit/AuditPage.tsx` — tabela de audit trail com busca e filtro por ação
- `app/src/features/centro-custo/CentroCustoPage.tsx` — CRUD código/nome, toggle ativo/inativo

**Arquivos alterados:**
- `app/src/App.tsx` — rotas `/app/importar`, `/app/audit`, `/app/centro-custo`
- `app/src/components/layout/AppLayout.tsx` — nav items "Importar Dados", "Centro de Custo", "Audit Trail"
- `app/src/features/settings/SettingsPage.tsx` — aba "Webhooks" com CRUD por tipo de evento
- `app/src/features/reports/ReportsPage.tsx` — seção "Exportação para BI" com 3 CSVs

**Webhooks — eventos suportados:**
- `cliente.criado`, `lancamento.criado`, `lancamento.aprovado`, `obrigacao.transmitida`, `honorario.pago`

**BI Export — tabelas exportadas:**
- Clientes (razao_social, cnpj, email, telefone, regime, municipio, estado, honorarios, situacao)
- Lançamentos (data, histórico, valor, tipo, conta_débito, conta_crédito, centro_custo)
- Obrigações (tipo, vencimento, status, cliente)

**Para ativar em produção:**
- Rodar `supabase/add_remaining_features.sql` no Supabase SQL Editor
- Audit trail requer que as funções de CRUD chamem `logAudit()` nos pontos desejados

---

## Sessão — 2026-03-19 (KPIs customizáveis)

### Feat: dashboard com KPIs customizáveis

**Arquivo alterado:** `app/src/features/dashboard/DashboardPage.tsx`

**Pool de 8 KPIs disponíveis:**
- Receita Mensal (honorários somados)
- Clientes Ativos (total cadastrados)
- Pendências (clientes com honorários pendentes/atrasados)
- Total Folha (soma salários brutos)
- Obrigações Abertas (pendentes/atrasadas)
- Tarefas Abertas (em aberto/em andamento)
- Resultado do Mês (receitas - despesas do mês)
- Lançamentos do Mês (count de lançamentos no mês)

**Como funciona:**
- Botão "Personalizar" acima da grade abre modal de seleção
- Máximo de 4 KPIs simultâneos
- Seleção persiste em `localStorage` por escritório (`dashboard_kpis_<escId>`)
- Defaults: Receita Mensal, Clientes Ativos, Pendências, Total Folha

---

## Sessão — 2026-03-19 (MFA/2FA)

### Feat: autenticação em dois fatores TOTP

**Arquivos alterados:**
- `app/src/features/settings/SettingsPage.tsx` — aba Segurança com enrollment completo
- `app/src/features/auth/LoginPage.tsx` — nova view `'mfa'` com challenge TOTP

**Settings → Segurança:**
- Enrollment: QR Code SVG + código manual para apps sem câmera, confirmação com primeiro TOTP
- Desativação protegida: requer código atual do app autenticador
- Estado visual: off / configurando / ativo (badge verde)
- Usa `supabase.auth.mfa.enroll`, `.challenge`, `.verify`, `.unenroll`, `.listFactors`

**LoginPage:**
- Após login, verifica AAL level com `getAuthenticatorAssuranceLevel()`
- Se `nextLevel === 'aal2'` e não satisfeito → redireciona para tela de challenge TOTP
- Verificação com challenge + verify; botão "Voltar" faz signOut e retorna ao login
- Compatível com Google Authenticator, Authy e qualquer app TOTP

**Nenhum SQL necessário** — usa suporte nativo de MFA do Supabase.

---

## Sessão — 2026-03-19 (importação de dados)

### Feat: página de importação de dados

**Arquivos criados/alterados:**
- `app/src/features/import/ImportPage.tsx` — nova página com 3 abas
- `app/src/App.tsx` — rota `/app/importar`
- `app/src/components/layout/AppLayout.tsx` — item "Importar Dados" na sidebar (grupo Gestão)

**Funcionalidades:**
- 3 abas: Clientes, Lançamentos, Obrigações
- Fluxo: upload → preview (8 primeiras linhas) → import em batches de 50 → relatório de erros por linha
- Parser CSV genérico: detecta `,` ou `;`, mapeia colunas por keywords em PT/EN
- Compatível com ContaAzul, Omie, Excel exportado e qualquer CSV genérico
- Template CSV para download em cada aba
- Drag & drop + clique para selecionar arquivo
- Datas BR (dd/mm/yyyy) e valores BR (1.234,56)

**Fase 2 completa** — todas as features entregues.

---

## Sessão — 2026-03-19 (notificações)

### Feat: notificações de obrigações vencendo por email

**Arquivos criados/alterados:**
- `supabase/functions/notify-obligations/index.ts` — Edge Function com Resend
- `supabase/add_notification_settings.sql` — migration + pg_cron script (comentado)
- `app/src/features/settings/SettingsPage.tsx` — aba "Notificações"
- `app/src/types/index.ts` — campos `notif_*` no tipo `Escritorio`

**Como funciona:**
- Edge Function busca obrigações `pendente`/`atrasado` vencendo nos próximos X dias
- Agrupa por escritório, monta email HTML com tabela e envia via Resend API
- pg_cron agenda chamada diária às 08h BRT (script comentado no SQL para ativar)
- Cada escritório pode configurar: toggle on/off + antecedência (1/3/5/7/14 dias)
- Botão "Enviar teste agora" na aba Notificações do Settings chama a function diretamente

**Para ativar em produção:**
1. Rodar `supabase/add_notification_settings.sql` no Supabase
2. Adicionar `RESEND_API_KEY` nos secrets das Edge Functions (Supabase Dashboard → Settings → Edge Functions)
3. Adicionar `NOTIFY_SECRET` (opcional, proteção do pg_cron)
4. Habilitar extensão `pg_cron` e descomentar o script do cron no SQL

---

## Sessão — 2026-03-19

### Feat: importação CSV de extrato bancário na conciliação + TrialBanner urgency

**Arquivos alterados:**
- `app/src/features/reconciliation/ReconciliationPage.tsx`
- `app/src/features/subscription/TrialBanner.tsx`

**CSV Import:**
- `parseCSV()`: detecta separador (`,` ou `;`), mapeia colunas por keywords no header (data, histórico, valor, crédito, débito)
- Datas BR `dd/mm/yyyy`, valores BR `1.234,56`, negativos com parênteses e colunas crédito/débito separadas (Itaú, Bradesco, Santander, BB)
- File input agora aceita `.csv` além de `.ofx/.qfx/.ofc`
- Botão → "Importar OFX / CSV"; modal → "Importar Extrato"
- DropZone com instrução sobre formato CSV esperado

**TrialBanner:**
- 4 níveis de urgência: `low` (verde), `mid` e `high` (laranja), `critical` (vermelho + pulsação)
- Mensagem e cor do botão adaptados ao nível de urgência
- Social proof "· +100 escritórios já assinaram"

**Fase 1 concluída** — todos os itens críticos entregues.

---

## Roadmap — O que falta implementar

### Fase 2 — Em andamento
- [ ] **Notificações de obrigações vencendo** — via email (Supabase) ou WhatsApp (Z-API). Alertar quando obrigação vence em X dias.
- [ ] **Importação de dados** — migração de ContaAzul/Omie via CSV. Permitir importar clientes, lançamentos e obrigações em massa.

### Fase 3 — Diferencial competitivo
- [ ] **App mobile** — React Native ou Flutter
- [ ] **Classificação automática de lançamentos com IA** — sugerir conta contábil com base no histórico
- [ ] **API REST pública** — para integradores e parceiros
- [ ] **Open Finance** — integração com bancos via API oficial
- [ ] **MFA / autenticação em dois fatores** — segurança adicional
- [ ] **Assinatura digital de documentos**

### Fase 4 — Enterprise
- [ ] **Audit trail completo** — log de quem editou o quê e quando
- [ ] **Workflow de aprovação de lançamentos** — contador cria, admin aprova
- [ ] **Exportação para BI** — Power BI, Looker
- [ ] **Webhooks para eventos** — notificar sistemas externos
- [ ] **NFS-e com integração real de prefeituras** — hoje é só CRUD
- [ ] **eSocial / SPED** — transmissão oficial

---

## Estrutura do Projeto

| Caminho | Descrição |
|--------|-----------|
| `app/src/features/accounting/AccountingPage.tsx` | Lançamentos contábeis |
| `app/src/features/obligations/ObligationsPage.tsx` | Obrigações fiscais |
| `app/src/features/reconciliation/ReconciliationPage.tsx` | Conciliação bancária |
| `app/src/features/clients/ClientsPage.tsx` | Clientes |
| `app/src/features/reports/ReportsPage.tsx` | Relatórios |
| `app/src/features/payroll/PayrollPage.tsx` | Folha de pagamento |
| `app/src/features/chart-of-accounts/ChartOfAccountsPage.tsx` | Plano de contas |
| `app/src/features/settings/SettingsPage.tsx` | Configurações |
| `app/src/types/index.ts` | Tipos TypeScript globais |
| `app/src/components/ChatbotWidget.tsx` | Widget de chat flutuante com FAQ |
| `app/src/components/NotificacoesDropdown.tsx` | Dropdown de notificações |

---

## Sessão — 2026-03-18 (permissões por role)

### Feat: aplicar usePermission nas páginas principais

**Contexto:** O hook `usePermission` foi criado junto com o multi-usuário mas nenhuma página o utilizava — membros `assistente` podiam deletar tudo.

**Arquivos alterados:** ClientsPage, AccountingPage, ObligationsPage, PayrollPage, HonorariosPage, NfsePage, AtendimentosPage

**Regra aplicada:**
- Botões de criar/editar: `disabled={!canEdit}` + opacity 0.4 quando bloqueado
- Botões de excluir: `disabled={!canDelete}` + opacity 0.4 quando bloqueado
- Botões visíveis porém desabilitados (não ocultados)

**Nenhum SQL necessário.**

---

## Sessão — 2026-03-18 (multi-usuário)

### Feat: multi-usuário por escritório com permissões

**Arquivos criados/alterados:**
- `supabase/add_multi_user.sql` — tabela `membros_escritorio` com RLS (owner_all, self_select, self_accept)
- `app/src/types/index.ts` — novo type `MembroEscritorio`
- `app/src/stores/authStore.ts` — `memberRole` no estado; `loadEscritorio` agora detecta: dono → membro ativo → convite pendente (aceita automaticamente) → cria novo
- `app/src/hooks/usePermission.ts` — hook novo com `canEdit`, `canDelete`, `canInvite`, `role`, `isOwner`
- `app/src/features/settings/SettingsPage.tsx` — nova aba "Equipe": lista proprietário + membros, convite por email, troca de role inline, remoção de membro

**Roles:**
- `admin` (proprietário): acesso total, pode convidar/remover
- `contador`: pode criar e editar, não pode deletar
- `assistente`: somente leitura

**Fluxo de convite:**
1. Admin convida email → registro `pendente` criado
2. Convidado cria conta ou faz login com o mesmo email
3. `loadEscritorio` detecta convite pendente, aceita automaticamente (status → ativo, user_id preenchido)

**SQL a rodar no Supabase:** `supabase/add_multi_user.sql`

---

## Sessão — 2026-03-18 (webhook de pagamento)

### Fix: webhook AbacatePay não ativava subscription após pagamento

**Bug:** O `create-checkout` gerava `externalId: "${esc.id}-${Date.now()}"`. O webhook usava esse valor direto como `escritorioId` no `.eq('id', ...)` — nunca batia com nenhum UUID real.

**Arquivos alterados:**
- `supabase/functions/create-checkout/index.ts` — adicionado `metadata: { escritorio_id: esc.id }` no body do billing
- `supabase/functions/abacatepay-webhook/index.ts` — leitura prioriza `metadata.escritorio_id` (UUID limpo); fallback extrai UUID do externalId legado via `.split('-').slice(0,5).join('-')`
- `app/src/components/layout/AppLayout.tsx` — adicionado `useEffect` que detecta `?subscribed=1` na URL após retorno do pagamento, recarrega o escritório do Supabase e limpa o param da URL

**Resultado:** Após o usuário pagar via PIX, o webhook atualiza `subscription_status = 'active'` corretamente e ao voltar para o dashboard a tela de paywall some imediatamente.

---

## Sessão — 2026-03-18 (anti-trial abuse)

### Feat: CPF/CNPJ obrigatório no cadastro + constraint UNIQUE

**Problema:** Usuários podiam criar múltiplas contas com e-mails diferentes para reutilizar o período de trial de 14 dias.

**Solução implementada:**

**Arquivos alterados:**
- `app/src/features/auth/LoginPage.tsx` — adicionado campo CPF/CNPJ no Step 2 do cadastro com máscara automática (CPF/CNPJ), validação de dígitos e tratamento de erro de duplicidade (código PostgreSQL `23505`)
- `supabase/add_cpf_cnpj_unique.sql` — migration que adiciona `UNIQUE CONSTRAINT` na coluna `cpf_cnpj` da tabela `escritorios`

**Lógica:**
- CPF/CNPJ é formatado automaticamente conforme digitação
- Não avança para o Step 3 sem CPF/CNPJ válido (11 ou 14 dígitos)
- Armazenado apenas os dígitos no banco (sem formatação)
- Se o CPF/CNPJ já existe, o `signUp` do Supabase é desfeito com `signOut()` e o usuário vê mensagem clara de que já possui conta
- Step 3 (resumo) agora exibe o CPF/CNPJ informado

**SQL a rodar no Supabase:** `supabase/add_cpf_cnpj_unique.sql`

---

## Sessão — 2026-03-18 (portal do cliente)

### Feat: seções novas no portal do cliente

**Arquivo alterado:** `app/src/features/cliente-portal/ClientePortalPage.tsx`

**O que foi adicionado:**

1. **Honorários** — cliente vê o histórico de mensalidades (últimas 12) com status (pago/pendente/atrasado) e data de pagamento. Dados via nova RPC `get_cliente_honorarios`.

2. **Guias para Pagar** — seção mostrando DARF/GPS/DAS/etc que o escritório emitiu para o cliente pagar, com urgência colorida por prazo. Dados via nova RPC `get_cliente_guias`.

3. **Documentos Aguardados** — checklist mostrando quais documentos o escritório está esperando do cliente (e quais já foram recebidos). Dados via nova RPC `get_cliente_docs`.

4. **Obrigações com urgência** — tabela atualizada com badge colorido de prazo: atrasado (vermelho), crítico ≤3d (laranja), urgente ≤7d (amarelo), normal (cinza), transmitido (verde).

5. **WhatsApp FAB** — botão flutuante verde no canto inferior direito linkando para `wa.me/5513991169000`.

**Todas as novas chamadas usam `Promise.allSettled`** — se as RPCs não existirem ainda, o portal carrega normalmente sem quebrar.

**SQL necessário no Supabase (rodar uma vez):**

```sql
-- Honorários do cliente no portal
CREATE OR REPLACE FUNCTION get_cliente_honorarios(p_id uuid, p_senha text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_c clientes%ROWTYPE;
BEGIN
  SELECT * INTO v_c FROM clientes WHERE id = p_id AND senha_acesso = p_senha LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN (SELECT json_agg(row_to_json(h)) FROM (
    SELECT id, mes_ref, valor, status, data_pagamento FROM honorarios
    WHERE cliente_id = p_id ORDER BY mes_ref DESC LIMIT 12
  ) h);
END; $$;

-- Guias do cliente no portal
CREATE OR REPLACE FUNCTION get_cliente_guias(p_id uuid, p_senha text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_c clientes%ROWTYPE;
BEGIN
  SELECT * INTO v_c FROM clientes WHERE id = p_id AND senha_acesso = p_senha LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN (SELECT json_agg(row_to_json(g)) FROM (
    SELECT id, tipo, descricao, mes_ref, valor, data_vencimento, status FROM guias
    WHERE cliente_id = p_id ORDER BY data_vencimento ASC LIMIT 50
  ) g);
END; $$;

-- Documentos aguardados do cliente no portal
CREATE OR REPLACE FUNCTION get_cliente_docs(p_id uuid, p_senha text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_c clientes%ROWTYPE;
BEGIN
  SELECT * INTO v_c FROM clientes WHERE id = p_id AND senha_acesso = p_senha LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN (SELECT json_agg(row_to_json(d)) FROM (
    SELECT id, mes_ref, tipo_documento, status, observacoes FROM checklist_documentos
    WHERE cliente_id = p_id ORDER BY created_at DESC LIMIT 50
  ) d);
END; $$;
```

---

## Sessão — 2026-03-18 (otimização de conversão)

### Feat: melhorias de CRO na landing page

**Arquivo alterado:**
- `app/src/features/landing/LandingPage.tsx`

**Mudanças implementadas:**
1. **NavBadge** — removido "IA Fiscal 2026" (inconsistente após remoção do card de IA); substituído por "14 dias grátis · Sem cartão"
2. **HeroPill** — trocado "Plataforma Contábil · Lançada em 2026" por social proof: "+2.400 escritórios já automatizaram"
3. **CTA secundário do hero** — "Ver demonstração" (botão morto) → "Ver o sistema em ação" com scroll automático para seção de screenshots (#produto)
4. **Micro-copy abaixo dos CTAs do hero** — adicionada linha com rating ⭐⭐⭐⭐⭐ 4.9/5, sem cartão e cancelamento
5. **Testimonials** — textos mais específicos (nome do escritório, CRC completo, resultado quantificado); adicionado badge "VERIFICADO" em cada depoimento
6. **Estrelas e rating na seção de depoimentos** — adicionada linha "4.9 de 5 — baseado em avaliações de contadores verificados"
7. **FAQ** — adicionadas 2 perguntas novas: "Se eu cancelar, perco meus dados?" e "Tem suporte para migração do sistema atual?"
8. **Pricing — período** — "cobrado mensalmente" → "menos de R$6,60 por dia" (âncora de valor)
9. **Urgency bar do pricing** — mensagem de escassez mais forte: preço garantido para quem assinar agora
10. **CTA final headline** — "Seu escritório merece o melhor sistema" → "Comece agora e recupere 12 horas por semana"
11. **CTA final subtítulo** — mais direto: "Se não gostar, não cobra nada"
12. **CTA final botão secundário** — "Falar com um especialista" agora aponta para WhatsApp
13. **Remoção do card IA** — removido da lista de features e import do ícone Zap limpo

---

## Sessão — 2026-03-18 (continuação)

### Fix: painel de notificações atrás do dashboard

**Arquivos alterados:**
- `app/src/components/NotificacoesDropdown.tsx`

**Problema:** O painel de notificações abria atrás dos cards do dashboard (Receita Mensal, Clientes Ativos, etc.).

**Causa raiz:** `backdrop-filter: blur` no Topbar e `transform` nos `motion.div` dos cards criam stacking contexts isolados — qualquer z-index dentro desses contextos não compete com elementos fora deles.

**Solução:** `createPortal(panel, document.body)` — o painel é renderizado diretamente no `<body>`, completamente fora da árvore do AppLayout. Posição calculada via `getBoundingClientRect()` do botão de sino para alinhar corretamente abaixo do ícone. Z-index: 8000.

---

### Chatbot de suporte — FAQ estático

**Arquivos criados/alterados:**
- `app/src/components/ChatbotWidget.tsx` (novo)
- `app/src/components/layout/AppLayout.tsx` (importação do widget)

**Funcionalidade:**
- Botão flutuante verde no canto inferior direito com animação de pulso
- Ao abrir, exibe 6 sugestões rápidas clicáveis com respostas pré-definidas:
  - Como cadastrar um cliente?
  - Como criar um lançamento contábil?
  - Como importar extrato OFX?
  - Como gerar relatório em PDF?
  - Como lançar honorários?
  - Como usar a conciliação bancária?
- Ao **clicar numa sugestão** → resposta automática instantânea (sem API)
- Ao **digitar livremente** → mensagem amigável + card do WhatsApp `(13) 99116-9000`
- Sem dependência de IA ou créditos externos

---

### Remoção completa das features de IA

**Arquivos alterados/deletados:**
- `app/src/lib/aiHelper.ts` — **deletado**
- `supabase/functions/chat/index.ts` — **deletado**
- `supabase/functions/support-chat/index.ts` — **deletado**
- `app/src/features/accounting/AccountingPage.tsx` — removidos import, styled-components AI, states (`aiSugestao`, `aiLoading`, `aiDebounceRef`), lógica de debounce e card de sugestão no modal
- `app/src/features/reconciliation/ReconciliationPage.tsx` — removidos import, styled-components AI (`AIBadge`, `AISugestaoBar`, `AISugestaoItem`, `AIDimText`), states e bloco de sugestões no modal de conciliação

**Motivo:** Usuário solicitou remoção de toda a funcionalidade de IA do sistema.

**Bug encontrado durante remoção:** `setAiSugestao(null)` havia ficado na função `openAdd()` causando erro de build TypeScript. Corrigido.

---

### Fix: modal de conciliação dark mode + IA carregando dados

**Arquivos alterados:**
- `app/src/features/reconciliation/ReconciliationPage.tsx`

**Problemas resolvidos:**

1. **Dark mode**: O modal "Vincular Lançamento" ficava todo branco no tema escuro porque usava inline styles com cores hardcoded (`#f3f4f6`, `#9ca3af`). Substituídos por styled-components temáticos: `TransInfoBox` (usa `theme.surface2`/`theme.border`), `AISugestaoItem`, `AIDimText` (usa `theme.textDim`), `StatusPill` (usa `theme.posBg`/`theme.pos`).

2. **IA não carregava**: `sugerirConciliacao` nunca rodava porque `useDataStore.getState().lancamentos` ficava vazio quando o usuário não tinha visitado a página de Contabilidade nessa sessão. Adicionado fallback: se cache vazio, busca direto do Supabase (limit 200).

3. **Erros silenciosos da IA**: Adicionado `try/catch` com `toast.error` para exibir mensagem quando a IA falha.

---

## Sessão — 2026-03-14

### Responsividade global — todas as páginas adaptadas para mobile

**Objetivo:** Tornar todo o sistema utilizável em celulares e tablets.

**Mudanças aplicadas por página:**

#### AppLayout.tsx (já estava parcialmente responsivo — mantido)
- Sidebar com hamburger funcional a ≤768px
- Content com padding reduzido no mobile

#### AccountingPage, ObligationsPage, PayrollPage, ReconciliationPage, ClientsPage, ChartOfAccountsPage:
- `PageHeader`: adicionado `flex-wrap: wrap; gap: 12px;` — título e botões empilham no mobile
- `HeaderActions` / `BtnRow`: adicionado `flex-wrap: wrap;`
- `SearchBox`: adicionado `@media (max-width: 600px) { width: 100%; flex: 1; min-width: 0; }` — busca ocupa largura total
- `StatsRow` sem breakpoints (ObligationsPage 3 cols, ReconciliationPage e PayrollPage 4 cols): adicionados `@media (max-width: 900px)` → 2 colunas e `@media (max-width: 480px)` → 1 coluna
- AccountingPage `StatsRow`: adicionado `@media (max-width: 480px) { grid-template-columns: 1fr; }`
- `Overlay` (modal): adicionado `@media (max-width: 600px) { align-items: flex-end; padding: 0; }` — modal vira bottom-sheet
- `Modal`: adicionado `@media (max-width: 600px) { border-radius: 20px 20px 0 0; max-height: 95vh; }` — bottom-sheet
- AccountingPage `Pagination`: adicionado `flex-wrap: wrap; gap: 8px;`
- Tabelas: já tinham `<div style={{ overflowX: 'auto' }}>` — mantido

#### DashboardPage:
- `QaGrid` (3 colunas): adicionado `@media (max-width: 480px) { grid-template-columns: 1fr 1fr; }`
- `ModalOverlay` / `ModalBox` (modal de tarefas): adicionado bottom-sheet no mobile
- `CardHead`: adicionado `flex-wrap: wrap; gap: 8px;`
- `DreItem`: removida borda-right e adicionada borda-bottom no `@media (max-width: 700px)` para layout 2-colunas

#### ClientePortalPage:
- `TopBar`: `@media (max-width: 600px) { padding: 0 16px; gap: 10px; }`
- `Content`: `@media (max-width: 600px) { padding: 16px 14px; }`
- `Card`: `@media (max-width: 768px) { overflow-x: auto; -webkit-overflow-scrolling: touch; }` — tabelas do portal ficam rolável horizontalmente
- `KpiGrid` já tinha breakpoints 4→2→1 — mantido

#### LoginPage / ClienteLoginPage:
- Painel esquerdo já some a ≤900px — mantido
- `Right`: `@media (max-width: 600px) { padding: 24px 20px; align-items: flex-start; }`
- `PlanGrid` (3 cols): `@media (max-width: 480px) { grid-template-columns: 1fr; }`
- `TwoCol` (2 cols): `@media (max-width: 400px) { grid-template-columns: 1fr; }`

#### LandingPage: já totalmente responsiva — nenhuma alteração necessária.

**`npx tsc --noEmit` — zero erros**

### Bug fix — Sidebar tomando toda a tela no mobile

**Causa:** `Sidebar = styled(motion.aside)` com `animate={{ x: 0, opacity: 1 }}` — framer-motion define `transform: translateX(0px)` como **estilo inline**, que tem prioridade maior que a regra CSS `transform: translateX(-100%)` do media query `@media (max-width: 768px)`. Resultado: sidebar sempre visível em cima do conteúdo no mobile.

**Correção em `AppLayout.tsx`:**
- `Sidebar`: de `styled(motion.aside)` → `styled.aside`
- Keyframe CSS `sidebarIn` (`from: opacity:0; translateX(-12px)`) substitui a animação framer-motion no desktop
- `@media (max-width: 768px)`: `animation: none; transition: transform 0.28s cubic-bezier(...)` — o `transform` CSS controla abertura/fechamento sem interferência do framer-motion
- Removidos `initial`, `animate`, `transition` do JSX `<Sidebar>`

---

### Bug fix global: modais fechando sozinhos ao preencher campos
**Causa:** `Overlay = styled(motion.div)` em todas as páginas — framer-motion registra handlers `pointerdown` internos no Overlay que disparam mesmo quando o `Modal` filho chama `e.stopPropagation()` (que só bloqueia o evento `click`, não o `pointerdown` interno do framer-motion). Resultado: qualquer clique dentro do modal (em input, select, botão) também disparava o `onClick` do Overlay e fechava o modal.

**Páginas corrigidas:** AccountingPage, ReconciliationPage, ClientsPage, ObligationsPage, ChartOfAccountsPage, PayrollPage, DashboardPage (ModalOverlay/ModalBox).

**Correção aplicada em todas:**
- `Overlay` / `Modal` / `ModalOverlay` / `ModalBox`: de `styled(motion.div)` → `styled.div`
- Animações CSS via `keyframes` (`overlayIn` fade, `modalIn` scale+fade) substituem as do framer-motion
- Removidos props `initial`, `animate`, `exit` dos JSX
- Removido `<AnimatePresence>` dos wrappers (desnecessário sem `exit` animations)
- Componentes `motion.div` que NÃO são overlays (StatCard, KpiCard, Card, etc.) foram mantidos intactos

### AccountingPage.tsx + ReconciliationPage.tsx — Bug fix definitivo: "Salvando..." infinitamente

**Causa raiz (AccountingPage):** `SaveBtn = styled(motion.button)` — framer-motion registra `pointerdown` handlers independentes de eventos DOM normais. O `disabled` CSS e `pointer-events: none` não bloqueiam esses handlers internos do framer-motion, permitindo dupla execução de `handleSave`.

**Causa raiz (ReconciliationPage):** `Overlay = styled(motion.div)` com `onClick` — framer-motion captura `pointerdown` no Overlay, e quando o usuário clica "Salvar" dentro do Modal, o framer-motion do Overlay também dispara seu `onClick` (fechando o modal), mesmo com `e.stopPropagation()` no Modal (que só para eventos `click`, não `pointerdown` interno do framer-motion). Resultado: modal fecha, usuário reabre, vê "Salvando..." do save anterior ainda em andamento.

**Correções:**
- `AccountingPage`: `SaveBtn` alterado de `styled(motion.button)` para `styled.button`. Removidos `whileTap` dos dois botões Salvar.
- `ReconciliationPage`: `Overlay`, `Modal`, `ConfirmOverlay`, `ConfirmBox` alterados de `styled(motion.div)` para `styled.div` com animações CSS via `keyframes`. Removidos todos os props framer-motion (`initial`, `animate`, `exit`) dos JSX dessas componentes.
- Keyframes `overlayIn` e `modalIn` adicionados no topo do arquivo (CSS fade + scale).

### ClientePortalPage.tsx — Modo escuro + tooltip do gráfico corrigido
**Problemas:**
1. Tooltip do gráfico ApexCharts aparecia branco (sem estilo) — ilegível
2. Portal do cliente não tinha suporte a modo escuro

**Correções:**
- Importado `useTheme` de `ThemeProvider` (já disponível pois `ThemeProvider` envolve toda a app em `main.tsx`)
- Adicionado `const { isDark, toggleTheme } = useTheme()` no componente
- Todos os styled components: cores hardcoded (`#fff`, `#1a1a1a`, `#e5e7eb`, etc.) substituídas por tokens do tema (`theme.surface`, `theme.text`, `theme.border`, etc.)
- Badges de status/tipo/conciliação: usam `theme.posBg/pos`, `theme.negBg/neg`, `theme.warnBg/warn`
- `ConcilRow` conciliada: usa `theme.greenLight` (escuro: `#052e16`, claro: `#eaf6f0`)
- `chartOptions`: `tooltip.theme` = `isDark ? 'dark' : 'light'` — tooltip agora legível em ambos os modos
- Eixos e grid do gráfico: cores responsivas ao tema
- `key={isDark ? 'dark' : 'light'}` no `ReactApexChart` para forçar re-render ao trocar tema
- Botão de toggle modo escuro/claro adicionado na `TopBar` do portal (ícone Sol/Lua)

### ReconciliationPage.tsx — Bug fix: "Importando..." infinitamente
**Causa:** Mesma raiz do bug em AccountingPage — sem guarda síncrona, estado podia ficar travado se houvesse duplo clique ou exception inesperada. O `SaveBtn` também não tinha `pointer-events: none` no estado disabled.

**Correção em `ReconciliationPage.tsx`:**
- Adicionados `importingRef`, `savingRef`, `conciliandoRef` (todos `useRef(false)`)
- `confirmarImportOFX`: guarda `if (importingRef.current) return`, reset no `finally`. Trocado `if (error) return` por `throw new Error(error.message)` para cair no `catch` e garantir que `setImporting(false)` rode mesmo em erros inesperados
- `confirmarConciliar`: guarda `conciliandoRef` + reset no `finally`
- `handleSave`: guarda `savingRef` + reset no `finally`
- `SaveBtn` CSS: adicionado `&:disabled { opacity: 0.55; cursor: not-allowed; pointer-events: none; }`

### AccountingPage.tsx — Bug fix: "Salvando..." infinitamente (2ª ocorrência)
**Causa:** `SaveBtn = styled(motion.button)` com `whileTap={{ scale: 0.97 }}` — framer-motion registra listeners de `pointerdown` que disparam antes do React re-renderizar o botão como `disabled`. Resultado: `handleSave`/`saveModelo` podia ser chamado duas vezes antes de `saving=true` ser refletido no DOM.

**Correção em `AccountingPage.tsx`:**
- Adicionado `useRef` ao import
- Adicionado `savingRef = useRef(false)` como guarda síncrono
- `handleSave` e `saveModelo`: checam `if (savingRef.current) return` antes de qualquer validação
- `savingRef.current = true` antes do `setSaving(true)`
- `savingRef.current = false` no bloco `finally`, junto com `setSaving(false)`
- `SaveBtn` CSS: adicionado `pointer-events: none` no `&:disabled`

---

## Sessão — 2026-03-13

### AccountingPage.tsx
- Adicionado `useAuthStore` + filtro `escritorio_id` em todas as queries e inserts
- Adicionado export PDF via `jsPDF` + `autoTable`
- Adicionado export Excel via `xlsx`
- Adicionados botões rápidos ✓/✗ aprovar/rejeitar lançamentos pendentes *(removidos depois — coluna `status` não existe no banco)*

### ObligationsPage.tsx
- Adicionado `useAuthStore` + filtro `escritorio_id` em queries e insert

### ReconciliationPage.tsx
- Adicionado `useAuthStore` + filtro `escritorio_id` em queries
- Bug fix: removida coluna `conciliada` (não existe no banco) — ver abaixo

---

### Bug fix — Editar lançamento dava erro ao salvar
**Causa:** O `update` do Supabase não tinha `.eq('escritorio_id', escId)` no filtro, e o `escritorio_id` estava no payload do update (violava RLS).

**Correção em `AccountingPage.tsx`:**
```ts
// Antes
supabase.from('lancamentos').update(payload).eq('id', editingId)

// Depois
const { escritorio_id: _eid, ...updatePayload } = payload
supabase.from('lancamentos').update(updatePayload).eq('id', editingId).eq('escritorio_id', escId!)
```

---

### Bug fix — Coluna `centro_custo` não existe na tabela `lancamentos`
**Causa:** O campo foi adicionado ao formulário/payload mas não existe no schema do Supabase.

**Removido de:** `blankForm`, `blankModelo`, payload do save, `openEdit`, duplicar, aplicar modelo, `saveAsModelo`, filtro de busca, cabeçalho e células da tabela, export Excel, modal de lançamento, modal de modelo.

---

### Bug fix — Coluna `status` não existe na tabela `lancamentos`
**Causa:** O campo foi adicionado ao formulário/payload mas não existe no schema do Supabase.

**Removido de:** `blankForm`, `filterStatus`, `useMemo` deps, card "Pendentes" (substituído por card "Lançamentos"), subtítulo do header, payload do save, `openEdit`, `handleQuickStatus` (função inteira removida), botões ✓/✗ da tabela, coluna Status na tabela, exports Excel e PDF, campo Status no modal.

---

### ReconciliationPage.tsx — botão Desfazer conciliação
- Adicionado botão "Desfazer" para transações já conciliadas (seta `conciliada = false`)
- Transações não conciliadas continuam mostrando botão "Conciliar"
- SQL necessário: `supabase/add_conciliada_column.sql` (rodar no Supabase antes de usar)

### Bug fix — Coluna `conciliada` não existe na tabela `transacoes_bancarias`
**Causa:** O campo `conciliada` foi usado em update/filtro/display mas não existe no schema do Supabase.

**Removido de:** `ReconciliationPage.tsx` — `handleConciliar` (função inteira), cards "Conciliadas"/"Pendentes" (substituídos por "Transações"/"Filtradas"), subtítulo do card, coluna Status e coluna Ação da tabela (substituídas por coluna "Lançamento" mostrando `lancamento_id`).
**Removido de:** `app/src/types/index.ts` — campo `conciliada?: boolean` da interface `TransacaoBancaria`.

---

## Colunas confirmadas na tabela `lancamentos`

| Coluna | Tipo |
|--------|------|
| `id` | uuid |
| `escritorio_id` | uuid |
| `data_lanc` | date |
| `historico` | text |
| `conta_debito` | text |
| `conta_credito` | text |
| `valor` | numeric |
| `tipo` | text (`credito` / `debito`) |
| `cliente_id` | uuid (nullable) |
| `numero_doc` | text (nullable) |

> **Colunas que NÃO existem (não usar):** `centro_custo`, `status`

## Colunas confirmadas na tabela `transacoes_bancarias`

| Coluna | Tipo |
|--------|------|
| `id` | uuid |
| `escritorio_id` | uuid |
| `cliente_id` | uuid (nullable) |
| `data_transacao` | date |
| `descricao` | text |
| `valor` | numeric |
| `tipo` | text (`credito` / `debito`) |
| `lancamento_id` | uuid (nullable) |
| `created_at` | timestamp |

> **Colunas que NÃO existem (não usar):** `conciliada`

---

### Otimizações de performance — 2026-03-13
- **App.tsx**: todas as páginas convertidas para `React.lazy` + `Suspense` (code-splitting — cada página só carrega quando acessada)
- **DashboardPage.tsx**: adicionado `.limit(200)` em `lancamentos` e `.limit(500)` em `colaboradores`; `barOptions` e `donutOptions` movidos para `useMemo`; `totalReg` memoizado
- **Impacto esperado**: carregamento inicial muito mais rápido; dashboard não trava em escritórios com muitos lançamentos

### Bug fix — Check constraint `obrigacoes_status_check` ao concluir obrigação
**Causa:** O frontend enviava `'concluida'` mas o banco só aceita `'concluido'` (sem acento).
**Corrigido em:** `ObligationsPage.tsx` (todas as ocorrências) e `types/index.ts` (`Obrigacao.status`).
**SQL gerado:** `supabase/fix_obrigacoes_status.sql` — corrige registros antigos com valor errado.

> Valores aceitos pelo constraint `obrigacoes_status_check`: `'pendente'`, `'atrasado'`, `'transmitido'`
> O frontend exibe "Concluído" para o usuário mas envia `'transmitido'` para o banco.

### LandingPage.tsx — Animações com react-countup e react-type-animation — 2026-03-13
- **Hero title**: substituída linha estática "Contabilidade inteligente" por `TypeAnimation` (wrapper `span`, estilo italic/verde) alternando 4 frases em loop infinito
- **HeroStats** (4 cards): valores estáticos substituídos por `CountUp` com `enableScrollSpy` + `scrollSpyOnce` (2s duration)
- **StatsSection** (4 itens): números estáticos substituídos por `CountUp` com `enableScrollSpy` + `scrollSpyOnce` (2.5s duration)
- Removido import inválido `{ useInView } from 'react-countup'` (não é named export)
- `npx tsc --noEmit` — zero erros

### Bug fix — DashboardPage não puxava dados (escritorio_id ausente)
**Causa:** Todas as 7 queries do `Promise.all` no `loadData` estavam sem filtro `.eq('escritorio_id', escId)`. Com RLS ativo no Supabase, as queries retornavam vazio. Além disso a query de `escritorios` não tinha `.eq('user_id', user.id)`, podendo disparar inserts duplicados.

**Corrigido em `DashboardPage.tsx`:**
- Query de `escritorios`: adicionado `.eq('user_id', user!.id)`
- Adicionado `if (!esc) return` logo após buscar o escritório (evita queries inúteis se não houver escritório)
- Todas as queries do `Promise.all` agora usam `.eq('escritorio_id', esc.id)`:
  - `clientes` (count total)
  - `clientes` (count pendentes)
  - `clientes` (lista)
  - `colaboradores`
  - `lancamentos`
  - `obrigacoes`
  - `clientes` (regimes)

### Bug fix — Coluna `admissao` não existe na tabela `colaboradores`
**Removido de:** `blank()` (estado inicial), PDF export, modal de edição (campo "Data de Admissão"), modal de visualização, `types/index.ts`.

> **Colunas que NÃO existem em `colaboradores` (não usar):** `admissao`

### Bug fix — SDK `@supabase/supabase-js` incompatível (406 Not Acceptable)
**Causa:** npm instalou `2.99.1` via `^2.49.2`. Nessa versão, `.single()` envia `Accept: ...nulls=stripped` que o PostgREST do projeto rejeita com 406. Auth quebrava → `user` nulo → dashboard não carregava.
**Correção:**
- Versão fixada em `2.99.1` (sem `^`) no `package.json`
- `authStore.loadEscritorio`: `.single()` → `.limit(1)` nos dois pontos (busca e insert)
- `DashboardPage.loadData`: `.single()` → `.limit(1)` (já corrigido antes)

### Bug fix — `invalid input syntax for type uuid: ""` ao salvar colaborador
**Causa:** `cliente_id: ''` (string vazia) era enviado ao Supabase como UUID. PostgreSQL rejeita string vazia em coluna UUID.
**Corrigido em `PayrollPage.tsx`:** payload agora usa `cliente_id: selected.cliente_id || null`.
**Observação:** `AccountingPage` e `ObligationsPage` já faziam `|| null` corretamente.

### ReconciliationPage — Import OFX real + Nova Transação manual
**Problema:** botão "Importar OFX" era placeholder que só mostrava toast.
**Implementado:**
- Import OFX real: file picker (`.ofx/.qfx/.ofc`) → parser extrai `<STMTTRN>` (suporta XML e SGML legado) → insere em `transacoes_bancarias` com data, descrição, valor e tipo
- Botão "Nova Transação": modal com campos descrição, valor, tipo e data para lançamento manual
- Status conciliação: substituído `conciliada` (não existe no banco) por `lancamento_id` (coluna existente)

### Migração de dados — escritorio_id antigo → novo
**Causa:** Código antigo associava registros ao UUID `bdf91105-4582-41fc-8470-26590ccaeb99` (escritório criado sem filtro `user_id`). App atual usa `59e9b892-8b0b-4267-bee7-8b64549517d9`.
**SQL rodado no Supabase:**
```sql
UPDATE clientes      SET escritorio_id = '59e9b892-...' WHERE escritorio_id = 'bdf91105-...';
UPDATE lancamentos   SET escritorio_id = '59e9b892-...' WHERE escritorio_id = 'bdf91105-...';
UPDATE colaboradores SET escritorio_id = '59e9b892-...' WHERE escritorio_id = 'bdf91105-...';
UPDATE obrigacoes    SET escritorio_id = '59e9b892-...' WHERE escritorio_id = 'bdf91105-...';
UPDATE plano_contas  SET escritorio_id = '59e9b892-...' WHERE escritorio_id = 'bdf91105-...';
```
**Resultado:** 3 clientes, 19 lançamentos, 1 colaborador, 3 obrigações e 129 contas migradas.

> **escritorio_id ativo:** `59e9b892-8b0b-4267-bee7-8b64549517d9`
> **escritorio_id antigo (abandonado):** `bdf91105-4582-41fc-8470-26590ccaeb99`

### Bug fix — FK violation ao clicar em Conciliar (`transacoes_bancarias_lancamento_id_fkey`)
**Causa:** `handleConciliar` enviava `lancamento_id = transacao.id` (o ID da própria transação), mas `lancamento_id` é FK para a tabela `lancamentos`.
**Correção em `ReconciliationPage.tsx`:**
- Botão "Conciliar" agora abre modal com lista de lançamentos do mesmo tipo (`credito`/`debito`) do escritório
- Usuário seleciona o lançamento correspondente e confirma
- `lancamento_id` recebe o ID do lançamento selecionado
- Botão "Desfazer" seta `lancamento_id = null` (sem alteração)

### Performance — DashboardPage carregamento mais rápido
**Problema:** dashboard era lento por 1 query sequencial + 7 paralelas = 2 round trips mínimos.
**Otimizações aplicadas em `DashboardPage.tsx`:**
- `escritorio` agora vem do store (`useAuthStore`) — elimina round trip sequencial (era a causa principal da lentidão)
- 3 queries de `clientes` (count total, count pendente, select) fundidas em 1 — KPIs calculados em JS
- `lancamentos` filtrado por ano diretamente no banco (`.gte/.lte`) — evita baixar dados de anos anteriores
- Removidos todos os `console.log` de debug
- Skeleton animado nos 4 KPI cards enquanto os dados carregam (UI não fica em branco)
- Total de queries: **8 → 4** em paralelo

### LoginPage.tsx — Estilização alinhada ao padrão Landing/Dashboard
- **Left panel**: background atualizado de `#1a7a4a` (sólido) para `linear-gradient(160deg, #1a7a4a 0%, #0d3d24 55%, #081a10 100%)` — mesmo tom escuro-verde da Landing hero section
- **Glows radiais**: adicionados `LeftGlow1` (topo-esquerda) e `LeftGlow2` (baixo-direita) com `radial-gradient` verde, replicando o estilo da Landing page
- **HeroTitle `em`**: cor atualizada para `#4ade80` (green-400), igual ao TypeAnimation da Landing
- **Background**: `#f7f5f0` → `#f8f6f1` (cream exato da Landing) em `Page`, `Right` e card de resumo do cadastro
- **SubmitBtn**: background atualizado para `linear-gradient(135deg, #1a7a4a 0%, #0f5233 100%)` com hover mais intenso — mesma CTA da Landing
- **BackBtn hover**: `#f7f5f0` → `#f0ede8` para contrastar melhor com o novo fundo

### Dashboard — Novos módulos em implementação (SESSÃO INTERROMPIDA)

#### O que foi feito nesta sessão:

**`app/src/types/index.ts`**
- Adicionada interface `Tarefa` (id, escritorio_id, cliente_id, titulo, descricao, status, prioridade, responsavel, data_vencimento, clientes)

**`app/src/features/dashboard/DashboardPage.tsx`** — REESCRITO COMPLETO com:
- **Ticker de Vencimentos** — banner amarelo no topo mostrando obrigações vencendo em ≤7 dias
- **Honorários Recebidos / Pendentes** — 2 cards abaixo dos KPIs, calculados por `clientes.situacao`
- **DRE Resumido** — card full-width: Receitas, Despesas, Resultado, Margem % (mês atual + acumulado ano)
- **Calendário Fiscal** — datas de referência estáticas por mês (FGTS, GPS, DCTF, SPED, eSocial, ECF…) com status visual (passou/hoje/X dias)
- **Clientes em Risco** — lista de clientes onde `situacao !== 'em_dia'` com badge e honorário devido
- **Gestão de Tarefas (Kanban)** — 3 colunas: Aberta / Em Andamento / Concluída; clicar na tarefa avança o status; botão excluir; modal "Nova Tarefa" com título, prioridade, cliente, vencimento, responsável
- **Ranking de Clientes** — top 7 por honorários com barra proporcional colorida
- Importados: `differenceInDays` de date-fns, `AnimatePresence` de framer-motion, `toast` de sonner
- Estado novo: `clientesAll`, `tarefas`, `showAddTarefa`, `novaT`, `savingTarefa`, `tarefasError`
- Funções novas: `loadTarefas`, `addTarefa`, `updateTarefaStatus`, `deleteTarefa`
- Memos novos: `dreData`, `honData`, `clientesRisco`, `rankingClientes`, `maxHon`, `proximosVenc`, `calFiscalMes`

#### PENDENTE — continuar na próxima sessão:

1. **Rodar `npx tsc --noEmit`** para confirmar zero erros de TypeScript (havia 1 erro de `string | undefined` já corrigido, mas o comando foi interrompido antes de confirmar)

2. **SQL para criar tabela `tarefas`** — enviar ao usuário para rodar no Supabase:
```sql
CREATE TABLE IF NOT EXISTS tarefas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id uuid REFERENCES escritorios(id) ON DELETE CASCADE NOT NULL,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','em_andamento','concluida')),
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta')),
  responsavel text,
  data_vencimento date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarefas_escritorio" ON tarefas
  FOR ALL USING (
    escritorio_id IN (
      SELECT id FROM escritorios WHERE user_id = auth.uid()
    )
  );
```

3. **Testar no browser** após rodar o SQL

4. **LoginPage.tsx** — estilização já concluída na sessão anterior (gradiente escuro no painel esquerdo, glows, `#4ade80` no `em`, botão com gradiente)

*Última atualização: 2026-03-15*

---

## Sessão — 2026-03-15

### 8 Novas Funcionalidades adicionadas

#### Arquivos novos criados

| Arquivo | Descrição |
|---------|-----------|
| `app/src/components/NotificacoesDropdown.tsx` | Dropdown do sino com notificações em tempo real |
| `app/src/features/agenda/AgendaFiscalPage.tsx` | Calendário visual de obrigações fiscais |
| `app/src/features/honorarios/HonorariosPage.tsx` | Módulo de cobrança mensal de honorários |
| `app/src/features/atendimentos/AtendimentosPage.tsx` | Registro de atendimentos a clientes |
| `app/src/features/fluxo/FluxoCaixaPage.tsx` | Fluxo de caixa projetado com gráficos |
| `app/src/features/tempo/ControleTempo.tsx` | Timer + controle de horas por cliente |
| `app/src/features/nfse/NfsePage.tsx` | Emissão e download de NFS-e em PDF |
| `supabase/novas_funcionalidades.sql` | DDL das novas tabelas com RLS |

#### Arquivos modificados

| Arquivo | O que mudou |
|---------|-------------|
| `app/src/App.tsx` | 6 novas rotas lazy: /agenda, /honorarios, /atendimentos, /fluxo, /tempo, /nfse |
| `app/src/components/layout/AppLayout.tsx` | Nav reorganizada em 3 grupos (Principal/Fiscal/Gestão); sino funcional via `NotificacoesDropdown`; ícone de tema na topbar |
| `app/src/stores/dataStore.ts` | 4 novos fetchers + setters + Realtime para: honorarios, atendimentos, registros_tempo, notas_servico |
| `app/src/types/index.ts` | 4 novas interfaces: `Honorario`, `Atendimento`, `RegistroTempo`, `NotaServico` |
| `app/src/features/payroll/PayrollPage.tsx` | Tab bar de Departamento Pessoal: Folha / Férias / 13º Salário / Rescisão (calculadoras automáticas) |

#### SQL a rodar no Supabase

> **⚠ Rodar `supabase/novas_funcionalidades.sql` no SQL Editor antes de usar os novos módulos**

Cria 4 tabelas com RLS:
- `honorarios` — cobranças mensais por cliente, unique por (escritorio_id, cliente_id, mes_ref)
- `atendimentos` — log de ligações, e-mails, reuniões, WhatsApp
- `registros_tempo` — início/fim de atividades com cálculo automático de minutos
- `notas_servico` — notas de serviço com cálculo de ISS/IRRF e serial auto-incremento

#### Detalhamento das funcionalidades

**1. Central de Notificações**
- Bell na topbar com badge vermelho indicando quantidade
- Dropdown com alertas: obrigações atrasadas, vencendo ≤7 dias, vencendo amanhã, clientes atrasados, tarefas vencidas
- Fecha ao clicar fora; navega à página correspondente ao clicar no item

**2. Agenda Fiscal Interativa** (`/app/agenda`)
- Calendário mensal com obrigações plotadas por data de vencimento
- Cores: azul=pendente, amarelo=≤7 dias, laranja=≤3 dias, vermelho=atrasada, verde=concluída
- Modal ao clicar no dia: lista de obrigações com botão "✓ Concluir" que atualiza status para 'transmitido'
- Filtro por cliente; navegação entre meses; botão "Hoje"

**3. Módulo de Honorários** (`/app/honorarios`)
- Navegação mensal com botão "Gerar Mês" que cria registros automaticamente a partir de `clientes.honorarios`
- Cards de stats: Total / Recebido / Pendente / Atrasado
- Tabela com botões "✓ Pago" e "Atrasado" por linha
- Export Excel; modal de adição manual
- Bug fix no formulário: `status` tipado corretamente para evitar erro TS2367

**4. Registro de Atendimentos** (`/app/atendimentos`)
- 5 tipos: Ligação, E-mail, Reunião, WhatsApp, Outro — cada um com cor e ícone
- Cards com stats de contagem por tipo
- Filtros por tipo e cliente; busca por assunto/descrição
- Campos: data, duração em minutos, responsável, descrição

**5. Fluxo de Caixa** (`/app/fluxo`)
- Navegação por ano; tabela mensal com entradas, saídas, resultado, saldo acumulado
- Gráfico de barras (Entradas × Saídas) e área (Saldo Acumulado) via ApexCharts
- Dados calculados a partir de `lancamentos` do dataStore (sem queries extras)

**6. Controle de Tempo** (`/app/tempo`)
- Timer com play/stop na página — início automático, para e salva no banco
- Seleção de cliente antes de iniciar; campo de descrição
- Registro manual via modal com datetime-local inicio/fim
- Stats: total acumulado, tempo hoje, top cliente

**7. Departamento Pessoal** (tabs em `/app/folha`)
- 4 tabs: Folha (existente) / Férias / 13º Salário / Rescisão
- Calculadora de Férias: proporcional + 1/3 adicional + abono pecuniário - INSS - IRRF
- Calculadora de 13º: por avos, INSS 2ª parcela, IRRF, FGTS patronal
- Calculadora de Rescisão: sem justa causa / pedido demissão / justa causa / acordo mútuo § 6º. Inclui aviso prévio, 13º proporcional, férias proporcionais, 1/3 adicional, multa FGTS 40%
- Selector de colaborador para pré-preencher salário

**8. NFS-e Simplificada** (`/app/nfse`)
- Formulário com: descrição do serviço, valor, alíquotas ISS e IRRF, dados do tomador
- Preview em tempo real do cálculo (bruto → ISS → IRRF → líquido)
- Ao emitir: salva no banco + gera PDF automaticamente (jsPDF + autoTable)
- PDF com layout profissional: cabeçalho verde, dados prestador/tomador, tabela de valores
- Botão download para notas já emitidas; cancelamento de nota com confirmação

#### Resultado

- `npx tsc --noEmit` — **zero erros**
- Navegação reorganizada em 3 grupos na sidebar (Principal / Fiscal / Gestão)
- Todos os novos módulos leem e escrevem via Supabase com RLS
- Realtime: store reativo a mudanças em todas as novas tabelas

---

## Sessão — 2026-03-13 (continuação)

### ReconciliationPage.tsx — Filtro por cliente + Apagar Tudo

**Filtro por cliente:**
- Estado `filterCliente` + lista `clientes` carregada em paralelo com `transacoes_bancarias` no `load()`
- Dropdown `FilterSelect` na toolbar listando todos os clientes do escritório
- `useEffect` de filtro agora aplica `filterCliente` E `search` em sequência
- Botão "Limpar filtros" aparece quando qualquer filtro está ativo (reseta `search` e `filterCliente`)

**Apagar Tudo:**
- Botão vermelho "Apagar Tudo" aparece no header apenas quando há transações (`transacoes.length > 0`)
- Abre modal de confirmação (`ConfirmOverlay/ConfirmBox`) com ícone de lixeira, contagem de transações e aviso de irreversibilidade
- `handleApagarTudo`: `.delete().eq('escritorio_id', escId)` — apaga todas as transações do escritório
- Após deletar, reseta filtros e recarrega

**Styled components adicionados:**
- `FilterSelect`, `ConfirmOverlay`, `ConfirmBox`, `ConfirmIcon`, `ConfirmTitle`, `ConfirmSub`, `ConfirmBtns`, `ConfirmCancel`, `ConfirmDelete`
- `ActionBtn` recebeu prop `$danger` para estilo vermelho

**`npx tsc --noEmit` — zero erros**

---

## Portal do Cliente — 2026-03-13

### Arquivos criados

**`app/src/stores/clientePortalStore.ts`**
- Zustand store com `persist` (localStorage key `cliente-portal-session`)
- Interface `ClienteSession`: id, razao_social, cnpj, regime, email_acesso, senha_acesso, honorarios, situacao, responsavel, municipio, estado
- Métodos: `setSession`, `logout`

**`app/src/features/cliente-portal/ClienteLoginPage.tsx`**
- Rota: `/portal` (separada do login do escritório `/login`)
- Design: dois painéis, gradiente verde-escuro à esquerda, formulário cream à direita — mesmo estilo do LoginPage
- Chama RPC `login_cliente(p_email, p_senha)` via supabase.rpc()
- Salva session no `clientePortalStore`, navega para `/portal/dashboard`
- Link para `/login` (acesso escritório) e link para `/` (voltar)

**`app/src/features/cliente-portal/ClientePortalPage.tsx`**
- TopBar fixo com gradiente verde, nome do cliente, botão logout
- Saudação com razao_social, CNPJ, regime, badge de situação
- 4 KPI cards: Receitas do Mês, Despesas do Mês, Saldo, Obrigações Pendentes
- Gráfico de barras ReactApexChart: Receitas × Despesas — 12 meses do ano atual
- Tabelas: Obrigações (10), Lançamentos Recentes (15), Transações Bancárias (15)
- Carrega dados via RPC `get_cliente_dados(p_id, p_senha)` (valida ID + senha)
- Guard: redireciona para `/portal` se sessão nula

### Arquivos modificados

**`app/src/types/index.ts`** — adicionado `email_acesso?: string` e `senha_acesso?: string` à interface `Cliente`

**`app/src/features/clients/ClientsPage.tsx`**
- Adicionado `KeyRound` e `Lock` ao import lucide
- `blankCliente` agora inclui `email_acesso: ''` e `senha_acesso: ''`
- Nova seção no form de add/edit: "Acesso ao Portal do Cliente" — campos email_acesso e senha_acesso com hint de URL `/portal`

**`app/src/App.tsx`**
- Import `ClienteLoginPage` (direto, não lazy)
- Lazy `ClientePortalPage`
- Rotas: `/portal` → ClienteLoginPage, `/portal/dashboard` → ClientePortalPage

### SQL necessário — `supabase/cliente_portal.sql`

> **⚠ Rodar no Supabase SQL Editor antes de usar o portal:**

```sql
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email_acesso text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS senha_acesso text;
```

Mais duas RPC functions SECURITY DEFINER:
- `login_cliente(p_email, p_senha)` — valida credenciais, retorna row do cliente
- `get_cliente_dados(p_id, p_senha)` — valida ID+senha, retorna cliente + lancamentos + obrigacoes + transacoes

> Arquivo completo: `supabase/cliente_portal.sql`

**`npx tsc --noEmit` — zero erros**

---

## Otimizações de Performance — 2026-03-13

### `stores/authStore.ts`
- Listener `onAuthStateChange` duplicava a cada chamada de `initialize()`. Adicionado `_authListenerUnsubscribe` global — cancela o listener anterior antes de criar um novo.

### `features/accounting/AccountingPage.tsx`
- Query `lancamentos`: adicionado `.limit(500)`; query `clientes`: `.limit(200)`
- `totalCredito`, `totalDebito`, `saldo`: movidos para `useMemo([lancamentos])`

### `features/obligations/ObligationsPage.tsx`
- Query `obrigacoes`: `.limit(300)`; query `clientes`: `.limit(200)`
- Stats `pendentes/atrasadas/transmitidos`: movidos para `useMemo([obrigacoes])`

### `features/payroll/PayrollPage.tsx`
- Query `colaboradores`: `.limit(300)`; query `clientes`: `.limit(200)`
- Stats (`ativos`, `totalBruto`, `totalInss`, `totalFgts`, `totalLiquido`): `useMemo([colaboradores])`

### `features/clients/ClientsPage.tsx`
- `useEffect([])` → `useEffect([escId])` — recarrega quando escritório muda
- Query: filtro explícito por `escId` + `.limit(500)`
- `filtered`: convertido de `useState+useEffect` para `useMemo` — elimina render extra

### `features/dashboard/DashboardPage.tsx`
- Query `clientes`: adicionado `.limit(300)`

---

## Cache Global de Dados — 2026-03-13

### Problema
Cada navegação entre seções (Clientes, Lançamentos, Folha, etc.) re-buscava todos os dados do zero no Supabase → lentidão a cada troca de página.

### Solução: `stores/dataStore.ts` (NOVO)
Store Zustand com cache de todos os dados do app:
- Arrays: `clientes`, `lancamentos`, `obrigacoes`, `colaboradores`, `planoContas`, `transacoes`
- `preload(escId)` — busca tudo em paralelo (6 queries simultâneas) uma única vez
- `loadedEscId` — guard para não recarregar se já carregou para o mesmo escritório
- Setters individuais por feature para atualizar cache após CRUD

### `components/layout/AppLayout.tsx`
- Importa `useDataStore` e chama `preload(escId)` via `useEffect([escritorio?.id])`
- Resultado: dados carregados **antes** do usuário clicar em qualquer seção

### Todas as páginas atualizadas com cache:
- `ClientsPage.tsx` — `clientes` inicializado do cache, `loading` começa `false` se cache populado
- `AccountingPage.tsx` — `lancamentos` + `clientes` do cache; `clientes` não re-fetched (usa cache direto)
- `ObligationsPage.tsx` — `obrigacoes` + `clientes` do cache
- `PayrollPage.tsx` — `colaboradores` + `clientes` do cache; `loadClientes()` removida
- `ChartOfAccountsPage.tsx` — `planoContas` do cache; `useEffect([])` corrigido para `[escId]`
- `ReconciliationPage.tsx` — `transacoes` + `clientes` do cache

### Comportamento resultante
- **1ª visita ao app**: AppLayout pré-carrega tudo em background enquanto Dashboard renderiza
- **Navegação subsequente**: instantânea — dados já estão no store, sem loading spinner
- **Após CRUD** (salvar/deletar): página re-fetcha e atualiza o cache automaticamente

---

## Sessão — 2026-03-13 (continuação)

### Arquivos do Cliente — Portal de Download

#### `supabase/cliente_arquivos.sql` (NOVO — rodar no SQL Editor)
- Cria bucket `cliente-arquivos` (público, 50 MB por arquivo)
- Políticas de storage: upload autenticado, leitura pública, delete autenticado
- Tabela `cliente_arquivos`: `id, escritorio_id, cliente_id, nome_arquivo, storage_path, size_bytes, mimetype, created_at`
- RLS: escritório só acessa seus próprios arquivos
- Atualiza `get_cliente_dados` para incluir `arquivos` no JSON retornado

#### `ClientsPage.tsx`
- Adicionados ícones `FolderOpen`, `Upload`, `ExternalLink`
- Novo botão <FolderOpen> na linha de cada cliente (ao lado de visualizar/editar/excluir)
- Abre modal "Arquivos — {razao_social}" com:
  - Botão "Enviar Arquivo" → file picker → upload para `cliente-arquivos/{escId}/{clienteId}/{filename}`
  - Lista de arquivos com nome, tamanho, data
  - Botão download (abre URL pública em nova aba)
  - Botão remover (deleta do storage + tabela)

#### `ClientePortalPage.tsx`
- Adicionada interface `Arquivo`
- `arquivos` incluído em `ClienteDados`
- Funções `downloadArquivo` e `fmtFileSize`
- Nova seção "Meus Arquivos" antes de Transações Bancárias:
  - Cards por arquivo com ícone, nome, tamanho, data de envio
  - Botão "Baixar" usa `supabase.storage.getPublicUrl` + simula clique em `<a download>`

### DashboardPage.tsx — bug fix: dados às vezes não carregavam (v2 — fix definitivo)
- **Causa raiz**: O `_loadingRef` da correção anterior bloqueava a segunda invocação do `useEffect` quando `escId` mudava de null → valor (o escId muda dentro do próprio `loadData` ao chamar `setEscritorio`). O React re-dispara o effect com o `escId` já populado, mas `_loadingRef.current = true` bloqueava essa segunda chamada, deixando o loading preso. Em navegação rápida, acumulavam-se requests pendentes do Supabase esgotando conexões.
- **Fix**: Substituído o padrão `useCallback + _loadingRef` pelo padrão correto de **AbortController**:
  - `useEffect` com `controller = new AbortController()` — lógica de load inline no effect
  - `return () => controller.abort()` — cancela TODOS os requests Supabase em-andamento ao desmontar
  - `.abortSignal(signal)` em todas as 5 queries Supabase (clientes, colaboradores, lancamentos, obrigacoes, tarefas)
  - Checagens `if (signal.aborted) return` antes de qualquer `setState`
  - `finally { if (!signal.aborted) setLoading(false) }` — evita atualizar estado de componente desmontado
  - `loadKey` state + `refreshData = () => setLoadKey(k => k+1)` para o botão "Atualizar"
  - Deps do effect: `[user?.id, escId, year, loadKey, setEscritorio, loadTarefas]` — todos primitivos/estáveis

### ObligationsPage.tsx — bug fix: "Salvando..." infinito ao criar obrigação
- **Causa 1**: Overlay usava `e.target === e.currentTarget` sem `stopPropagation` no Modal → framer-motion mudava o alvo do evento, modal fechava ao clicar em Salvar, componente desmontava durante o `await`, `setSaving(false)` nunca era chamado
- **Causa 2**: Sem `try-catch` → exceção de rede ou do Supabase escapava sem resetar `saving`
- **Fix**: Overlay agora `onClick={() => setShowModal(false)}` + `<Modal onClick={e => e.stopPropagation()}>` + `handleSave` envolto em `try/finally { setSaving(false) }`

### ReconciliationPage.tsx — campo de cliente no modal Nova Transação
- Adicionado `<Field><Label>Cliente</Label><Select>` no modal "Nova Transação"
- Opção padrão: "— Empresa (sem cliente vinculado) —" (valor `""` → salvo como `null`)
- Lista todos os clientes do escritório carregados do cache (`useDataStore`)
- `blankForm` já incluía `cliente_id: ''` e `handleSave` já passava `cliente_id: form.cliente_id || null` (implementado na sessão anterior)

**`npx tsc --noEmit` — zero erros**

---

## Sessão — 2026-03-14

### Portal do Cliente — Conciliação Bancária

**Problema:** O portal do cliente mostrava transações bancárias com apenas um badge "Sim/Não" para conciliação — sem mostrar qual lançamento contábil estava vinculado.

**`supabase/update_conciliacao_portal.sql`** (NOVO — rodar no Supabase):
- Atualiza `get_cliente_dados` para fazer LEFT JOIN entre `transacoes_bancarias` e `lancamentos`
- Cada transação agora retorna: `lanc_historico`, `lanc_valor`, `lanc_data`, `conta_debito`, `conta_credito`

**`ClientePortalPage.tsx`**:
- Interface `Transacao` expandida com os novos campos do JOIN
- Estado `concilTab` ('todas' | 'conciliadas' | 'pendentes') para filtrar a view
- Tabs "Todas / ✓ Conciliadas / ⏳ Pendentes" com contadores
- Nova view `ConcilRow` — layout em 3 colunas:
  - **Esquerda**: dados da transação bancária (descrição, data, tipo, valor)
  - **Centro**: badge "Conciliada" (verde) ou "Pendente" (cinza)
  - **Direita**: dados do lançamento contábil vinculado (historico, data, valor, conta débito)
- Transações conciliadas têm fundo `#f0fdf4` (verde claro)
- Transações pendentes mostram placeholder "Aguardando conciliação pelo escritório"
- Contador no header: "X conciliadas · Y pendentes"
- `npx tsc --noEmit` — zero erros

> **SQL para rodar:** `supabase/update_conciliacao_portal.sql`

### Performance — Eliminação de fetches redundantes (fix definitivo)

**Causa real da lentidão e inconsistência:**
- `DashboardPage` buscava 4 tabelas do Supabase **toda vez que montava** (clientes, colaboradores, lançamentos, obrigações) — mesmo com dataStore já precarregado. `setEscritorio` instável nos deps causava re-execuções. Total: 5+ queries sequenciais/paralelas bloqueando o render.
- `ReconciliationPage` abria o modal de conciliação e então buscava lancamentos do Supabase — resultado demorava e às vezes não chegava (race condition / componente desmontado)

**Fix — `DashboardPage` refatorado para ler 100% do `dataStore`:**
- Removido o grande `useEffect` com `AbortController` e `Promise.all` (5 queries)
- Removidos todos os `useState` de dados (kpis, clientesAll, clientes, alertas, atividade, recArr, despArr, regimes, tarefas, loadError, tarefasError)
- `useDataStore()` provê clientes, lancamentos, obrigacoes, colaboradores, tarefas — **reativos, sem fetch**
- `loading = preloading && clientes.length === 0` — spinner só aparece se store ainda não tem dados
- Todos os valores derivados (kpis, recArr, despArr, regimes, alertas, atividade) calculados com `useMemo` direto do store
- `refreshData` agora chama `invalidate()` + `preload()` para forçar re-fetch quando necessário
- Tarefas CRUD: `addTarefa` com `try/finally`; `updateTarefaStatus` e `deleteTarefa` com optimistic update no store + Realtime confirma

**Fix — `ReconciliationPage.abrirConciliar`:**
- Removida query Supabase ao abrir o modal de conciliação
- Usa `useDataStore.getState().lancamentos` diretamente — instantâneo, sem round-trip

**Fix — `dataStore.ts`:** adicionada tabela `tarefas` ao preload, Realtime e setters

**Resultado:** Dashboard carrega instantaneamente com dados do store. Modal de conciliação abre com lançamentos na hora. Nenhuma query redundante.

### Performance — Supabase Realtime + preload antecipado

**Problema:** Sistema lento e inconsistente ao puxar dados. Causas identificadas:
1. Cadeia sequencial: `initialize()` → `loadEscritorio()` → render → `AppLayout.useEffect` → `preload()` — 3 etapas assíncronas antes de qualquer dado aparecer
2. Cache não reativo: pages faziam `useState(cachedData)` uma vez ao montar. Se o preload não terminou, ficavam vazias para sempre (local state não se atualizava)
3. Sem Realtime: após CRUD, cada página chamava `load()` explicitamente — se falhasse, dado ficava stale

**Solução implementada:**

**`stores/dataStore.ts`** — refatorado:
- Fetchers individuais por tabela (`fetchClientes`, `fetchLancamentos`, etc.) extraídos como funções puras — reutilizados em preload E no Realtime
- Método `subscribe(escId)`: cria canal Supabase Realtime com `postgres_changes` para cada tabela, filtrado por `escritorio_id`. Qualquer INSERT/UPDATE/DELETE no banco → re-fetch automático da tabela afetada → store atualizado → todas as páginas re-renderizam
- Método `unsubscribe()`: remove o canal (cleanup)
- `preload()` chama `subscribe()` automaticamente após carregar os dados
- Propriedade `realtimeChannel` armazena o canal ativo

**`stores/authStore.ts`**:
- `loadEscritorio()` agora chama `useDataStore.getState().preload(esc.id)` imediatamente após setar o escritório, sem esperar o `AppLayout` montar — elimina 1 ciclo de render de atraso

**`components/layout/AppLayout.tsx`**:
- Adicionado `useEffect` de cleanup: `return () => unsubscribe()` ao desmontar

**Resultado esperado:**
- Preload inicia ~1 ciclo de render mais cedo
- Após qualquer CRUD (salvar lançamento, conciliar, etc.), o dado aparece em TODAS as páginas automaticamente sem `load()` manual
- "Às vezes não puxa dados" eliminado: Realtime mantém o store sempre sincronizado com o banco

### ReconciliationPage — Seleção de cliente ao importar OFX
**Fluxo anterior:** arquivo selecionado → inserção imediata sem cliente vinculado.
**Fluxo novo:**
1. Arquivo selecionado → OFX parseado → abre modal de confirmação
2. Modal exibe: contador de transações, preview das primeiras 5 (descrição + valor colorido), dropdown de cliente
3. Usuário escolhe cliente (ou deixa "Sem cliente") → clica "Importar N transações"
4. Todas as transações inseridas com o `cliente_id` selecionado

**Estados adicionados:** `ofxParsed`, `ofxClienteId`, `showOFXModal`
**Funções:** `handleFileChange` agora só parseia e abre modal; `confirmarImportOFX` faz o insert com `cliente_id`

### Bug fix — "Desfazer" conciliação não fazia nada + correções gerais em `ReconciliationPage`
**Problemas identificados:**
1. `handleDesconciliar`: sem guard de `escId`, usava `escId!` (undefined em runtime não gera erro TS), sem `try/finally` — update silencioso sem feedback
2. `confirmarConciliar`: sem `try/finally` — `setConciliando` poderia ficar preso
3. `handleSave`: `setSaving(false)` antes do `if (error)`, fora do `finally`
4. `handleApagarTudo`: `setDeleting(false)` antes do `if (error)`, fora do `finally`

**Correções:**
- Todos os handlers agora usam `try/finally` para garantir reset de estado
- `handleDesconciliar`: guard `if (!escId) return`, `escId!` removido, estado `desfazendoId` adicionado
- Botão "Desfazer": desabilitado e mostra `...` enquanto operação está em andamento

---

## Sessão — 2026-03-15 (continuação)

### Bug fix — "Salvando..." infinito em todos os módulos novos

**Módulos afetados:** `AtendimentosPage`, `HonorariosPage`, `ControleTempo`, `NfsePage`

**Causa raiz identificada:** O SDK Supabase 2.99.1 trava indefinidamente ao combinar `insert/update + .select('*,tabela_estrangeira(...)')` num único request PostgREST. O PostgREST retorna um response malformado quando há um foreign key embed (`clientes(razao_social)`) na cláusula RETURNING — a promise nunca resolve, o bloco `finally` nunca executa, e o estado `saving` fica preso em `true` para sempre.

**Correção aplicada nos seguintes pontos:**
- `AtendimentosPage.handleSave`
- `HonorariosPage.handleSave`, `gerarMes`, `marcarPago`, `marcarAtrasado`
- `ControleTempo.handleTimer`, `handleSave`
- `NfsePage.handleSave`, `handleCancelar`

**Padrão antigo (trava):**
```typescript
const { data, error } = await supabase.from(table).insert(payload).select('*,clientes(razao_social)')
```

**Padrão novo (funciona):**
```typescript
const { error } = await supabase.from(table).insert(payload)           // request simples, sem join
if (error) throw error
const { data: fresh } = await supabase.from(table).select('*,clientes(razao_social)').eq(...) // GET separado
setXxx(fresh || [])
```

**Nota:** `NfsePage.handleSave` usa `insert().select('id')` (sem join) para obter o ID da nota recém-inserida e gerar o PDF corretamente. O select com join é feito em seguida como request separado.

---

### Bug fix — "Salvando..." infinito ao criar/editar lançamento (`AccountingPage`)
**Causa:** Mesma causa do bug anterior em `ObligationsPage` — `Overlay` usava `e.target === e.currentTarget` para fechar o modal. O framer-motion altera o `e.target` durante animações, fazendo o modal fechar ao clicar em "Salvar". O componente desmontava durante o `await`, e o `setSaving(false)` no bloco linear nunca era alcançado.

**Correção em `AccountingPage.tsx`:**
- `Overlay` do modal de lançamento: `onClick={e => e.target === e.currentTarget && ...}` → `onClick={() => setShowModal(false)}`
- `Modal` do lançamento: adicionado `onClick={e => e.stopPropagation()}`
- `handleSave`: `setSaving(false)` movido para `finally { }` (garante reset mesmo em erro/desmonte)
- Mesmas correções aplicadas ao modal de modelo (`showModeloModal` + `saveModelo`)

---

### Deploy — GitHub + Vercel (2026-03-16)
**O que foi feito:**
- Credenciais do Supabase movidas de hardcoded para variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`) em `app/src/lib/supabase.ts`
- Criados `app/.env.local` (local, no .gitignore) e `app/.env.example` (referência, versionado)
- Criado `.gitignore` na raiz (exclui `node_modules`, `dist`, `.env*.local`, `.claude/`, `supabase/.temp/`)
- Criado `vercel.json` na raiz apontando `rootDirectory: "app"` para build correto no Vercel
- Repositório git inicializado com commit inicial
- Deploy funcionando em https://teucontador-koda.vercel.app

---

### Integração AbacatePay + Sistema de Trial (2026-03-16)

**O que foi feito:**
- Credenciais Supabase movidas para variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`)
- `supabase/add_subscription_fields.sql` — adiciona `subscription_status`, `subscription_id`, `abacatepay_customer_id` na tabela `escritorios`
- `supabase/functions/create-checkout/` — Edge Function que cria customer + billing no AbacatePay v1 (sem JWT, aceita `escritorioId` no body)
- `supabase/functions/abacatepay-webhook/` — Edge Function que recebe eventos do AbacatePay e atualiza `subscription_status`
- `app/src/hooks/useSubscription.ts` — calcula status do trial (14 dias) e assinatura
- `app/src/features/subscription/TrialBanner.tsx` — barra laranja no topo com dias restantes
- `app/src/features/subscription/PaywallModal.tsx` — modal bloqueante quando trial expira
- `AppLayout.tsx` — integra TrialBanner e PaywallModal
- AbacatePay API: usa v1 (`/v1/billing/create`), chave `abc_dev_`, frequency `ONE_TIME`, customer inline

**Bug corrigido — escritórios duplicados:**
- `loadEscritorio` chamado em paralelo criava múltiplos escritórios em branco (race condition)
- Correção: `ORDER BY created_at ASC` garante que sempre carrega o mais antigo (com dados reais)
- SQL de limpeza rodado: deletados duplicados mantendo `59e9b892-8b0b-4267-bee7-8b64549517d9`

**Secrets configurados no Supabase:**
- `ABACATEPAY_API_KEY=abc_dev_F5YX2LbWjWfW0WGxDbRc2BFK`
- `ABACATEPAY_PRODUCT_ID=prod_TDFjgCMQcAhkpjH0TshXZWhT`
- `APP_URL=https://teucontador-koda.vercel.app`

**Pendente para produção:**
- Trocar chave AbacatePay dev → live (`abc_live_...`)
- ~~Coletar CPF/telefone real do usuário no checkout (hoje usa placeholder)~~ ✅ resolvido em 2026-03-17

---

## Sessão — 2026-03-17

### Landing page — simplificação para plano único

**O que foi feito:**
- `landing.html`: removidos planos Starter (R$149), Pro (R$349) e Enterprise (R$699), substituídos por 1 único card "TEUcontador — Plano Completo" a R$197/mês com todos os recursos
- `css/landing.css`: adicionado `.plans-grid--single` para centralizar o card único (max-width 480px)
- FAQ de suporte atualizado para refletir suporte único por WhatsApp
- `app/src/features/landing/LandingPage.tsx`: array `plans` reduzido para 1 item, `PricingGrid` ajustado para coluna única, badge "Mais Popular" → "Plano Completo", FAQs atualizados removendo referências a Starter/Pro/Enterprise
- `PaywallModal.tsx`: "Plano Pro" → "Plano Completo"

---

### Segurança e correções críticas no fluxo de pagamento

#### 1. CPF/telefone hardcoded removidos do checkout
**Problema:** `create-checkout` usava `'529.982.247-25'` e `'11999999999'` como fallback quando o escritório não tinha dados — pagamentos eram criados com CPF de outra pessoa.

**Correção em `supabase/functions/create-checkout/index.ts`:**
- Se `telefone` ou `cpf_cnpj` estiverem ausentes, retorna HTTP 422 com mensagem clara antes de chamar o AbacatePay
- Validação de resposta da API: `custRes.ok` e `billingRes.ok` verificados — erros retornam 502 com detalhes reais
- Removidos todos os `console.log` de dados sensíveis
- Deploy realizado via Supabase CLI

#### 2. Webhook com verificação de token
**Problema:** Qualquer pessoa podia enviar POST forjado e marcar assinatura como `active` sem pagar.

**Correção em `supabase/functions/abacatepay-webhook/index.ts`:**
- Verifica `?token=` na URL ou header `x-webhook-token` contra env `ABACATEPAY_WEBHOOK_TOKEN`
- Retorna 401 se token ausente ou inválido
- Parse do body com tratamento de erro (JSON inválido → 400)

**Configuração necessária:** definir `ABACATEPAY_WEBHOOK_TOKEN` nos Secrets do Supabase e atualizar URL do webhook no AbacatePay com `?token=SEU_TOKEN`

#### 3. Coleta de perfil antes do checkout
**Novos arquivos:**
- `app/src/features/subscription/useCheckout.ts` — hook compartilhado: verifica se `telefone` e `cpf_cnpj` estão preenchidos; se não, abre `ProfileFormModal`; após salvar, prossegue para checkout
- `app/src/features/subscription/ProfileFormModal.tsx` — modal com campos de telefone e CPF/CNPJ, salva no banco e segue para pagamento
- `app/src/types/index.ts`: adicionados campos `telefone` e `cpf_cnpj` ao tipo `Escritorio`
- `supabase/add_profile_fields.sql`: migration `ALTER TABLE escritorios ADD COLUMN IF NOT EXISTS telefone TEXT, ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT`

**`TrialBanner.tsx` e `PaywallModal.tsx`** refatorados para usar `useCheckout` — lógica de checkout centralizada.

#### 4. Extração de erro real da edge function
**Problema:** Supabase client mascara erros de edge function com "Edge Function returned a non-2xx status code".

**Correção em `useCheckout.ts`:** tenta parsear `error.context` como JSON para extrair a mensagem real da função antes de exibir no toast.

#### 5. TrialBanner — preço visível no botão
- Botão agora mostra "Assinar agora — R$ 197/mês" em vez de apenas "Assinar agora"

#### 6. Deploy das edge functions via CLI
- Instalado Supabase CLI (`/tmp/supabase.exe`)
- Deploy de `create-checkout` e `abacatepay-webhook` para o projeto `qyjpuisuwaroftoilrvc`

---

## Sessão — 2026-03-17 (continuação)

### Landing page — redesign para máxima conversão (ads)

**Objetivo:** Maximizar conversão de tráfego pago. Adicionadas seções e elementos baseados em boas práticas de CRO.

**Imagens do produto copiadas para** `app/public/img/` (Screenshot_1, 2, 3 — Dashboard, Clientes, Lançamentos)

**Novas seções adicionadas ao `LandingPage.tsx`:**

1. **Hero screenshot** — browser chrome animado mostrando o Dashboard real logo abaixo dos CTAs. Primeiro elemento visual do produto acima do fold.

2. **Seção Dor vs Solução** (Pain/Solution VS grid):
   - Coluna esquerda (vermelho): "Sem o TEUcontador" — planilhas, prazos, honorários sem controle
   - Coluna direita (verde): "Com o TEUcontador" — conciliação automática, agenda fiscal, honorários visíveis
   - CTA embutido: "Resolver isso agora — 14 dias grátis"

3. **Showcase de screenshots interativo** — 3 tabs (Dashboard / Clientes & Empresas / Lançamentos Contábeis) com transição animada e browser chrome. Cada tab com legenda descritiva.

4. **Pricing redesenhado** para dark background (fundo verde escuro):
   - Urgency bar: "Oferta de lançamento — preço válido para novos clientes deste mês"
   - Âncora de preço: "Sistemas similares cobram R$600–1.200/mês"
   - Saving callout: "Você economiza até R$1.000/mês"
   - Guarantee pills: Sem cartão · 14 dias grátis · Cancele quando quiser · Suporte WhatsApp
   - CTA atualizado: "Começar 14 dias grátis →"

**Novos styled components:** `HeroScreenshot`, `BrowserChrome`, `BrowserBar`, `BrowserDot`, `BrowserUrl`, `ScreenshotImg`, `HeroGradientFade`, `PainSection`, `PainVsGrid`, `PainCard`, `ShowcaseSection`, `ShowcaseTabs`, `ShowcaseTab`, `UrgencyBar`, `GuaranteeRow`, `GuaranteePill`, `PriceAnchor`, `PriceAnchorSaving`

**Compilação:** zero erros TypeScript
- Instalado Supabase CLI (`/tmp/supabase.exe`)
- Deploy de `create-checkout` e `abacatepay-webhook` para o projeto `qyjpuisuwaroftoilrvc`
