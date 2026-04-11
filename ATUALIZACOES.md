# 📜 Histórico de Atualizações (Changelog)

> Este documento centraliza o registro das atualizações de arquitetura, lógicas de negócios e mudanças estruturais do projeto FluxoCerto.
> **Objetivo:** Economizar tokens durante as sessões de desenvolvimento, permitindo que a IA consulte rapidamente a estrutura atual sem analisar os arquivos, e facilitando a busca por humanos.

## 🚀 Versão em Desenvolvimento (Atual)

### 🗓️ Abril 2026 - Sprint "Neural HUD & Estabilização"

#### 🎨 Interface e Experiência do Usuário (UI/UX)
- **Neural HUD**: Modernização visual de todo o dashboard. Substituição do tema tradicional por efeitos "Cyber/Neural" com *Glow Orbs*, bordas radiais e componentes flutuantes.
- **Remoção de Roxos e Cores Quentes**: Paleta estabilizada utilizando Esmeralda (Principal), Teal, Azul-petróleo (Slate/Cyan). Proibição total de tons como rosa/roxo nas views financeiras para passar segurança institucional.
- **Painel de Negócios Inteligente**: Refatorado para formato BI. Inclusão de modais ativos para **Registro de Vendas de Estoque**, cálculos de lucros em tempo real (`VendaService`) com precisão monetária em centavos e descontos diretos na tabela `Estoque`.
- **Animações (Framer Motion)**: Utilização agressiva mas elegante em Cards, `NeuralLoading`, efeitos de scanner em gráficos e popups do Mascote e Conquistas.
- **Limpeza de Comentários**: Remoção de comentários técnicos gerados artificialmente no código (blocos imensos com `===`) por comentários orgânicos em português, padrão humano.
- **Tradução Arquitetural Profunda**: Refatoração em massa das pastas e componentes críticos. Todos os arquivos de componentes UI em inglês (ex: `SummaryCards`, `DashboardHeader`) foram convertidos e renomeados localmente para PT-BR (ex: `CartoesResumo`, `CabecalhoPainel`). Rotas protegidas e de convenção de framework do Next.js mantiveram sintaxe de origem.

#### 🔧 Backend, APIs e Estabilidade
- **Autenticação (NextAuth.js)**: Implementação e correção total do Login Híbrido: Credenciais nativas (E-mail/Senha) + Provedores Sociais (Google, Facebook, LinkedIn) convivendo na mesma tabela de referências através do `PrismaAdapter`.
- **Sincronização de Banco de Dados**: Resolvimento severo do Erro 500 no carregamento do painel corrigindo instâncias "zumbis" do Node que travavam o motor de consulta Prisma. Correção em tempo de *runtime* do client via `npx prisma generate`.
- **Resolvimento de Rotas Next.js 15+**: Remoção de pastas corrompidas com espaços falsos em brackets (ex: `/api/estoque/ [id]`) que causavam falhas silenciosas de colisão de rota entre Client API e Server Action e faziam o TS linting quebrar o `build` (TS2344).

#### 🗄️ Esquema do Banco de Dados (Prisma)
- Referência sólida da conectividade para Vendas. O model `Venda` diminui automaticamente o estoque.
- Tratamento de `isDeleted` e `isArchived` forçado de *hard delete* para *soft delete* resguardando histórico contábil.
- Gerenciamento de notificações por `TipoLembrete` adaptados ao sistema neural.

#### ⚠️ Débitos Técnicos Acumulados / A Fazer Em Breve
- Refatorar middleware atualização `proxy` ao invés da sintaxe `middleware` depreciada (exigência do Next.js 16+).
- Refatorar a captura manual de metadata da página em rotas estáticas `http://localhost:3000` para referências dinâmicas no domínio real.
- Configurar webhook real do Pluggy para ingestão de transações concorrentes na API Sync.

---

*Regras de Atualização para a IA: Após realizar qualquer pacote de atualizações de lógica pesada, modais importantes ou fluxos contábeis, documentar brevemente neste arquivo nesta topologia temporal.*
