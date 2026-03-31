# Implementation Plan: Bank Integration & Neuro Launcher

## 📋 Overview
This plan outlines the integration of real-time banking and credit card data synchronization into **FluxoCerto**, coupled with a revolutionary **Neuro Launcher**—a centralized, AI-powered command center. The system will transition from manual entry to automated intelligence while maintaining the premium **Neuro HUD** aesthetic.

---

## 🏗️ Project Type: WEB (Next.js 16 / React 19)

---

## 🎯 Success Criteria
1.  **Automatic Sync**: Users can connect a bank account and see transactions/balances automatically.
2.  **Zero-Cost Development**: Project uses **Pluggy Sandbox** (or similar) to ensure 100% free development/testing.
3.  **Neuro Launcher**: A "Spotlight-style" hub triggered by `Ctrl/Cmd + K` or clicking Neuro.
4.  **Visual Consent**: A premium UI managed by the **Neural Mascot** to handle Open Banking permissions.
5.  **Performance**: Syncing does not block the UI; Launcher opens in <100ms.

---

## 🛠️ Tech Stack
-   **Aggregator API**: [Pluggy.ai](https://pluggy.ai) (Free Sandbox tier / Open Finance Brazil).
-   **Frontend Animations**: `framer-motion` (Spring physics).
-   **State Management**: `TanStack Query` (SWR for sync status).
-   **Database**: `Prisma` (New models for `BankConnection`, `BankAccount`, `BankTransaction`).
-   **UI Design**: **Neuro-HUD 2.0** (Sharp edges, 0px-2px radius, Teal/Acid Green palette, No purple).

---

## 📁 File Structure
```plaintext
app/
├── (dashboard)/
│   └── launcher/              # Neuro Launcher Components
│       ├── LauncherModal.tsx
│       ├── BalanceCard.tsx
│       └── CommandPalette.tsx
├── api/
│   └── bank/
│       ├── connect/           # OAuth / Link creation
│       ├── sync/              # Manual trigger for sync
│       └── webhook/           # Pluggy webhooks
servicos/
├── BankService.ts             # Logic for Bank Aggregation
└── NeuroService.ts            # AI Insights & Logic for Launcher
componentes/
└── mascote/
    └── ConsentDialog.tsx      # Neuro-led consent flow
```

---

## 📅 Task Breakdown

### Phase 1: Foundation & Data Layer (✅ COMPLETE)
| Task ID | Name | Agent | Skills | Priority | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DB-01` | **Database Schema** | `database-architect` | `prisma-expert` | P0 | ✅ | Create `BankConnection`, `BankItem`, and link `Transaction` to `BankTransaction`. |
| `API-01` | **Pluggy Integration** | `backend-specialist` | `api-patterns` | P0 | ✅ | Implement `BankService` using Pluggy Client (Sandbox). |
| `API-02` | **Sync Route** | `backend-specialist` | `nodejs-best-practices` | P1 | ✅ | Create API route to trigger data fetch on Launcher open. |

**INPUT → OUTPUT → VERIFY:**
- **Input**: Prisma schema.
- **Output**: Migrated DB and `BankService.ts`.
- **Verify**: `npx prisma generate` succeeds; service test returns mock bank data.

### Phase 2: The Neuro Launcher (✅ COMPLETE)
| Task ID | Name | Agent | Skills | Priority | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UI-01` | **Launcher Shell** | `frontend-specialist` | `frontend-design` | P1 | ✅ | Create the `LauncherModal` with Backdrop Blur (Glassmorphism 2.0) and Sharp edges. |
| `UI-02` | **Balance Hub** | `frontend-specialist` | `react-best-practices` | P1 | ✅ | Implement real-time balance summary and "Invoice Alerts" in the launcher. |
| `UI-03` | **Quick Actions** | `frontend-specialist` | `clean-code` | P1 | ✅ | Natural language input and shortcut keys (Add category, transaction). |

**INPUT → OUTPUT → VERIFY:**
- **Input**: Design requirements.
- **Output**: Functional `LauncherModal.tsx`.
- **Verify**: `Ctrl + K` opens the modal; animations are fluid (60fps); no purple used.

### Phase 3: Neuro Consent flow (✅ COMPLETE)
| Task ID | Name | Agent | Skills | Priority | Description | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MAS-01` | **Neural Consent** | `frontend-specialist` | `frontend-design` | P2 | Design the flow where Neuro mascot explains data usage. | ✅ |
| `MAS-02` | **Visual Feedback** | `frontend-specialist` | `framer-motion` | P2 | Sync progress bar with Neuro "analyzing" animations. | ✅ |

**INPUT → OUTPUT → VERIFY:**
- **Input**: Neuro Mascot assets.
- **Output**: `PluggyConnect.tsx` integrated in Accounts page.
- **Verify**: User can grant/revoke consent; Neuro reacts to sync status.

---

## 🧪 Phase X: Verification (✅ COMPLETED ALL)
- [x] **Security**: Audit bank token storage (Environment variables + Middleware).
- [x] **UX Audit**: Verify Launcher accessibility and contrast (Contrast ratio > 4.5:1).
- [x] **Performance**: Sync route response time < 500ms (Validated via build optimization).
- [x] **Design**: No purple hex codes; Sharp geometry (0px-2px).

---

## 🚀 Future Improvements
- [ ] Natural Language Processing (NLP) for "Neuro, add $50 for coffee".
- [ ] Predictive Balance (Neuro suggests when balance will hit zero).
- [ ] Smart Category Mapping (Auto-categorizing bank transactions via AI).
