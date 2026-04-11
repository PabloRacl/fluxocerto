# Fase 2: Otimização de Performance e Arquitetura Resiliente

Nesta fase enfrentaremos os gargalos técnicos mais sensíveis apontados na análise comercial: a latência provocada pelo processamento de Notas Fiscais (OCR síncrono) e os problemas de hidratação e consulta ("Server Components + Cache").

## Etapa 1: OCR Assíncrono (Desacoplando Worker)

O pacote `tesseract.js` acoplado na API principal do Next.js pode travar a thread principal ou gerar *timeouts* da plataforma na nuvem (Vercel) para imagens pesadas (limite de >10s de execução).

### Ação Prática (Abordagem "Background Job")
- Para o MVP Escalável: Em vez de bloquear a resposta (HTTP `POST`), alteraremos a API `/api/estoque/import` (ou onde o OCR estiver configurado) para receber o arquivo em *storage* (ou buffer) temporário e retornar HTTP `202 Accepted` imediatamente com um "Job ID".
- O processamento da imagem do OCR rodará em uma função separada que irá atualizar o Job no banco.
- Interface avisará: "Sua nota foi enviada para processamento. Você será notificado quando acabar."

## Etapa 2: Cache Inteligente e Server Components

O carregamento das dashboards pesadas ("Neuro HUD") deve ocorrer do lado do servidor sempre que possível.

### Ação Prática
- Migração/Garantia de que os gráficos do painel principal e contadores busquem dados primários do banco com Next.js `unstable_cache` ou diretivas explícitas de fetch.
- Adicionar tags de revalidação, e.g., `revalidateTag("dashboard-metrics")` sempre que o usuário criar uma conta nova, adicionar despesa, ou tiver uma importação do Open Finance/OCR finalizada, recarregando assim a tela super rápido sem consultar excessivamente o banco.

---

### Próximos Passos
Após sua confirmação, vamos abrir a API que gerencia a entrada da Nota Fiscal e injetar esse processo assíncrono.
