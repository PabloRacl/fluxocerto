# Fase 1: Estabilização de UX e Upsell

Este plano detalha a execução dos dois primeiros passos vitais propostos na análise de Governança e Produto: Gates do Freemium e Onboarding Guiado.

## Etapa 1: Gates Freemium vs PRO/ENTERPRISE

O intuito aqui é isolar certas features avançadas (Apenas PRO/Enterprise), criando assim uma taxa de conversão clara ("Paywall") e impedindo que a infraestrutura seja consumida por usuários gratuitos de baixo LTV.

### 1.1 Limitação no Backend (APIs)
- Modificar API routes que consomem recursos caros para checar a sessão do usuário (`session.user.plan`).
- **Recursos PRO/ENT:**
  - `POST /api/bank/sync` (Integração Open Finance)
  - `POST /api/relatorios/export` (Exportações Avançadas PDF/CSV)
  - `POST /api/estoque/import` (Processamento OCR de XML/NFe)

### 1.2 Limitação no Banco de Dados (Contagem)
- Para o tier "FREE", limitar o número de `Contas` a **3**.
- Se o usuário tem `plan === FREE` e já tem 3 contas, retornar `403 Forbidden` na criação da 4ª.

### 1.3 Bloqueio Visivel (UX)
- Criar ou atualizar os botões nessas telas (Bank Sync, CSV, Relatórios) com um badge "PRO". Ao clicar sendo FREE, abrir um Modal/Dialog ("Upgrade to PRO").

---

## Etapa 2: Onboarding Wizard (Time-To-Value < 3 min)

O onboarding guiado guiará os novos usuários após o login.

### 2.1 Identificação do Novo Usuário
- Criar a mecânica que detecta se o usuário acabou de entrar (Primeira sessão ou contagem de cadastros na conta zero).
- Podem ser checados quantos `Conta` ele possui. Contas = 0 indica Onboarding Pendente.

### 2.2 O Componente "Wizard"
- Construir um Flow UI em cima da Dashboard (`/painel`), usando um Overlay (Dialog não intrusivo):
  1. Passo 1: "Bem-vindo! Crie sua primeira Conta (Ex: Conta Corrente principal)".
  2. Passo 2: "Registre uma transação (Ex: Saldo Inicial)".
  3. Passo 3: "Defina sua primeira Meta Mensal / Orçamento".
- Após conclusão, liberar totalmente a plataforma (Aha moment!).
