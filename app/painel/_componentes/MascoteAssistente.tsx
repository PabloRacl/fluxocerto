"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, CheckCircle2, TrendingUp, Trophy, Zap } from "lucide-react";
import { MascoteNeural } from "./MascoteNeural";
import { neuralVoice } from "@/biblioteca/NeuralVoiceService";
import { mascotEvents, MascotEventPayload } from "@/biblioteca/MascotEvents";
import useSWR from "swr";
import { api } from "@/biblioteca/http-client";

const fetcher = async (url: string) => {
  return typeof window !== "undefined" ? api.get<any>(url) : null;
};

interface Tip {
  id: string;
  text: string;
  type: "STRATEGY" | "BRAIN" | "REWARD";
}

const TIPS: Tip[] = [
  { id: "dica_brain_1", text: "Sabia que diversificar suas categorias ajuda o meu núcleo a processar melhor seus gastos?", type: "BRAIN" },
  { id: "dica_brain_2", text: "A paciência é um algoritmo poderoso para investimentos de longo prazo.", type: "BRAIN" },
  { id: "dica_brain_3", text: "Pequenos gastos formam grandes rios de desperdício. Bloqueie as saídas desnecessárias!", type: "BRAIN" },
  { id: "dica_brain_4", text: "O cartão de crédito é uma ferramenta, não uma extensão do seu salário. Use com precisão neural.", type: "BRAIN" },
  { id: "dica_strat_1", text: "Um fluxo de caixa positivo é o alimento favorito de uma mente tranquila.", type: "STRATEGY" },
  { id: "dica_strat_2", text: "O segredo da riqueza neural não é quanto você ganha, mas quanto você mantém.", type: "STRATEGY" },
  { id: "dica_strat_3", text: "Uma reserva de emergência é o escudo térmico contra as tempestades da vida.", type: "STRATEGY" },
  { id: "dica_strat_4", text: "Dinheiro parado é algoritimo sendo corroído pela inflação. Considere investir o excesso.", type: "STRATEGY" },
  { id: "dica_reward_1", text: "Detectei um novo hábito de economia! Continue assim, humano.", type: "REWARD" },
  { id: "dica_reward_2", text: "Comemore as pequenas vitórias, mas não gaste todo o prêmio em uma única festa!", type: "REWARD" },
  { id: "dica_fixos", text: "Seus custos fixos são o peso base do seu sistema. Tente mantê-los leves!", type: "STRATEGY" },
  { id: "dica_variaveis", text: "Gastos variáveis são como ruído no sistema. Minimize o desnecessário.", type: "BRAIN" },
  { id: "dica_poupanca", text: "Tente economizar pelo menos 10% do seu fluxo. Meu núcleo agradece a estabilidade.", type: "REWARD" },
  { id: "dica_dividas", text: "Dívidas com juros altos são a água que ferve o sapo sem ele notar. Elimine-as primeiro!", type: "STRATEGY" },
  { id: "dica_hardware", text: "O melhor investimento é no seu próprio aprendizado. Leia sobre finanças, vale ouro.", type: "BRAIN" },
  { id: "dica_plano", text: "Um plano sem execução é só papel. Coloque suas metas em prática!", type: "STRATEGY" },
  { id: "dica_disciplina", text: "Consistência vence a intensidade em qualquer plano financeiro de longo prazo.", type: "BRAIN" },
  { id: "dica_firmware", text: "Olhar seus relatórios mensalmente é como alinhar o curso antes da viagem.", type: "STRATEGY" },
  { id: "dica_metas", text: "Uma meta sem data é apenas um sonho jogado no vento. Defina prazos!", type: "STRATEGY" },
  { id: "dica_benchmark", text: "Não compare seu início com o meio de outros. Seu único adversário é você mesmo anteontem.", type: "BRAIN" },
  { id: "dica_vazamentos", text: "Assinaturas esquecidas são vazamentos silenciosos no seu dinheiro. Cancele o que não usa.", type: "STRATEGY" },
  { id: "dica_impulso", text: "Espere 24 horas antes de compras impulsivas. O Mestre Dino garante: o bolso agradece.", type: "REWARD" },
  { id: "dica_noite", text: "Fim do dia. Analise seus movimentos hoje e descanse. Amanhã tem mais!", type: "STRATEGY" },
  { id: "dica_alfa_elite", text: "Desempenho excepcional! Você tá mandando muito bem na organização.", type: "REWARD" },
  { id: "dica_zero_gasto", text: "Percebi uma baixa movimentação... que tal experimentar um 'dia de gasto zero' hoje?", type: "BRAIN" },
  { id: "dica_diversifica", text: "Não guarde todos os ovos na mesma cesta. Diversificar é o segredo do sapo esperto!", type: "STRATEGY" },
  { id: "dica_juros", text: "Os juros compostos são mágicos. Deixe o tempo trabalhar a favor do seu dinheiro.", type: "BRAIN" },
  { id: "dica_liberdade", text: "Riqueza de verdade é a liberdade de escolher como você gasta o seu tempo.", type: "REWARD" },
  { id: "dica_overclock", text: "Sua renda aumentou? Ótimo! Mas não aumente os gastos junto. Invista a diferença.", type: "STRATEGY" },
  { id: "dica_paz", text: "Paz financeira não é ser trilionário, é dormir tranquilo sabendo que as contas fecham.", type: "BRAIN" },
  { id: "dica_sapinho", text: "Olá! Eu sou o Mestre Dino 🐸, e tô aqui pra lembrar: pequeno ajuste hoje, grande diferença lá na frente.", type: "REWARD" },
  { id: "dica_parceria", text: "Tô no seu canto. Toda vez que registrar um gasto, toda meta que alcançar — o Mestre Dino tá aqui torcendo!", type: "REWARD" },
  { id: "dica_cinco_anos", text: "Onde você quer tá financeiramente daqui 5 anos? O passo de hoje leva pra esse lugar — ou não.", type: "STRATEGY" }
];

export function MascoteAssistente({ 
  userLevel = 1,
  healthScore = 0,
  balance = 0
}: { 
  userLevel?: number;
  healthScore?: number;
  balance?: number;
}) {
  const { data: categoriasRes } = useSWR("/api/painel/expenses-by-category", fetcher);
  const { data: dividasRes } = useSWR("/api/dividas", fetcher);

  const [currentTip, setCurrentTip] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [show, setShow] = useState(false);
  const [currentMood, setCurrentMood] = useState<"HAPPY" | "WORRIED" | "THINKING">("HAPPY");

  // Subscribe to Realtime mascot Events
  useEffect(() => {
    const handleEvent = (payload: MascotEventPayload) => {
      // Se já estiver pensando, não interrompemos para evitar flashes
      setShow(true);
      setCurrentTip(payload.message);
      
      if (payload.mood) {
         setCurrentMood(payload.mood);
      } else if (payload.type === 'TRANSACTION_EXPENSIVE') {
         setCurrentMood("WORRIED");
      } else if (payload.type === 'GOAL_ACHIEVED') {
         setCurrentMood("HAPPY");
      } else {
         setCurrentMood("HAPPY");
      }

      setIsThinking(false);
      
      neuralVoice.speak(payload.message, payload.type.toLowerCase(), 
        () => setIsSpeaking(true), 
        () => setIsSpeaking(false)
      );

      // Auto-hide após 14 segundos
      setTimeout(() => setShow(false), 14000);
    };

    const unsubscribe = mascotEvents.subscribe(handleEvent);
    return () => { unsubscribe(); };
  }, []);

  // Sincroniza estado de mute com o serviço
  useEffect(() => {
    setMuted(neuralVoice.getMuted());
  }, []);

  // Lógica proativa baseada em dados reais e contexto temporal
  useEffect(() => {
    const generateInsight = () => {
      const hour = new Date().getHours();
      let selectedTip: Tip | null = null;
      
      setIsThinking(true);
      setShow(true);
      setCurrentMood("THINKING");

      setTimeout(() => {
        // --- 0. SMART ENGINE (Dynamically generated tips without AI Cost) ---
        // Pega a maior despesa (Top Categoria)
        let topCategoryName = "";
        let topCategoryValue = 0;
        if (categoriasRes?.data && categoriasRes.data.length > 0) {
           const sorted = [...categoriasRes.data].sort((a, b) => b.value - a.value);
           if (sorted[0].value > 0) {
              topCategoryName = sorted[0].name;
              topCategoryValue = sorted[0].value;
           }
        }

        // Procura dívidas perto do vencimento
        let hasUrgentDebt = false;
        if (dividasRes?.data && dividasRes.data.length > 0) {
           hasUrgentDebt = dividasRes.data.some((d: any) => d.status === "PENDENTE");
        }

        // Sorteia para não ser chato repetindo a IA local sempre
        const useSmartTip = Math.random() > 0.4;

        if (useSmartTip && hasUrgentDebt && healthScore > 0) {
            selectedTip = { id: "smart_debt", text: "🐸 O Mestre Dino botou o olho e viu: tem dívida pendente por aí! Melhor priorizar o pagamento pra não virar bola de neve.", type: "STRATEGY" };
        } else if (useSmartTip && topCategoryName !== "" && healthScore > 0) {
            selectedTip = { id: "smart_cat", text: `🐸 Analisei seus gastos e percebi: você tem gastado bastante com "${topCategoryName}". Vale a pena dar uma segurada?`, type: "BRAIN" };
        } else {
            // 1. PRIORIDADE: SITUAÇÕES CRÍTICAS E BOAS VINDAS
            if (balance === 0 && healthScore === 0) {
              selectedTip = { id: "status_novo", text: "Sua conta ainda não tem movimentações... Já adicionou sua primeira receita ou despesa? Comece por aí!", type: "REWARD" };
            } else if (balance < 0) {
              selectedTip = { id: "status_estresse", text: "Ei! Seu saldo está negativo. Não há motivo pra pânico, mas é hora de reduzir gastos.", type: "STRATEGY" };
            } else if (healthScore > 0 && healthScore < 30) {
              selectedTip = TIPS.find(t => t.id === "dica_zero_gasto") || null;
            } else if (healthScore >= 95) {
              selectedTip = TIPS.find(t => t.id === "dica_alfa_elite") || null;
            } 
            
            // 2. CONTEXTO TEMPORAL (Se não houver crise)
            if (!selectedTip) {
              if (hour >= 5 && hour < 10) {
                 selectedTip = TIPS.find(t => t.id === "dica_hardware") || null; // Dica de "acordar" sistemas
              } else if (hour >= 22 || hour < 5) {
                 selectedTip = TIPS.find(t => t.id === "dica_noite") || null;
              }
            }

            // 3. ALEATÓRIO (Fallback)
            if (!selectedTip) {
              selectedTip = TIPS[Math.floor(Math.random() * TIPS.length)];
            }
        }

        setCurrentTip(selectedTip.text);
        setIsThinking(false);
        // Ajusta o humor de acordo com a dica
        if (selectedTip.type === 'BRAIN' || selectedTip.type === 'STRATEGY') {
          setCurrentMood(balance < 0 ? "WORRIED" : "HAPPY");
        } else {
          setCurrentMood("HAPPY");
        }
        
        // Tenta falar o insight (ID agora aponta para um possível arquivo .mp3 no futuro)
        neuralVoice.speak(selectedTip.text, selectedTip.id, 
          () => setIsSpeaking(true), 
          () => setIsSpeaking(false)
        );
      }, 2000);

      // Desaparece após 12 segundos (mais tempo para ler dicas complexas)
      setTimeout(() => setShow(false), 14000);
    };

    // --- BOAS VINDAS (UMA VEZ POR LOGIN) ---
    const welcomeTimer = setTimeout(() => {
       neuralVoice.speak("Oi, seja bem-vindo de volta! Vamos ver como suas finanças estão hoje?", "welcome",
         () => {
            setCurrentTip("Oi! O Mestre Dino chegou 🐸");
            setShow(true);
            setIsSpeaking(true);
         },
         () => {
            setIsSpeaking(false);
            setTimeout(() => setShow(false), 4000);
         }
       );
    }, 3000);

    // Primeira análise proativa após 15 segundos
    const initialTimer = setTimeout(generateInsight, 15000);

    // Intervalo de novas análises
    const interval = setInterval(generateInsight, 300000); // 5 min

    return () => {
      clearTimeout(welcomeTimer);
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [healthScore, balance, categoriasRes?.data, dividasRes?.data]);

  return (
    <AnimatePresence>
      {show && currentTip && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          className="fixed bottom-[100px] right-4 md:bottom-24 md:right-8 z-[100] flex flex-col md:flex-row items-end md:items-end gap-2 md:gap-4 pointer-events-none"
        >
          {/* Bolha de Fala Holográfica */}
          <div className="pointer-events-auto relative bg-slate-950/60 backdrop-blur-3xl border border-white/10 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] md:rounded-br-none shadow-[0_30px_90px_rgba(0,0,0,0.6)] w-[260px] md:w-[300px] md:mb-8 group/bubble transition-all duration-500 hover:border-emerald-500/30">
            
            {/* Efeito de Vidro HUD e Scan Line interna */}
            <div className="absolute inset-0 bg-emerald-500/[0.03] blur-xl pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/20 blur-[1px] animate-[scan_3s_linear_infinite]" />
            
            <div className="relative z-20">
               <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Zap className="w-4 h-4 text-emerald-400" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">🐸 Mestre Dino diz</span>
                      <span className="text-[8px] font-bold text-emerald-500/40 uppercase tracking-widest leading-none">Conselho do sapo</span>
                   </div>
                   {isSpeaking && (
                     <div className="flex items-center gap-0.5 ml-auto">
                        <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-0.5 bg-emerald-400" />
                        <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-0.5 bg-emerald-400" />
                        <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-emerald-400" />
                     </div>
                   )}
                </div>
               
                <AnimatePresence mode="wait">
                  {isThinking ? (
                    <motion.div 
                      key="thinking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 py-2"
                    >
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Mestre Dino pensando... 🐸</div>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.p 
                      key="text"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[13px] font-bold text-white italic leading-relaxed tracking-tight"
                    >
                      &quot;{currentTip}&quot;
                    </motion.p>
                  )}
                </AnimatePresence>

               <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-emerald-400 font-black tracking-[0.2em] uppercase">Mestre Dino 🐸</span>
                    <span className="text-[7px] text-slate-600 font-black uppercase">O sapo conselheiro</span>
                  </div>
                  <button 
                    onClick={() => setShow(false)}
                    className="p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-all group/close"
                  >
                    <X className="w-3.5 h-3.5 group-hover/close:rotate-90 transition-transform" />
                  </button>
               </div>
            </div>

            {/* Rabo da Bolha Moderno */}
            <div className="hidden md:block absolute -bottom-2 right-12 w-8 h-4 overflow-hidden">
               <div className="w-4 h-4 bg-slate-950/60 border-r border-b border-white/10 transform rotate-45 -mt-2 mx-auto shadow-2xl" />
            </div>
            {/* Rabo Mobile */}
            <div className="md:hidden absolute -bottom-2 right-[50%] translate-x-1/2 w-8 h-4 overflow-hidden">
               <div className="w-4 h-4 bg-slate-950/60 border-b border-r border-white/10 transform rotate-45 -mt-2 mx-auto shadow-2xl" />
            </div>
          </div>

          {/* O Mascote 3D (Mentor) */}
          <div className="mb-2 md:mb-4 self-center md:self-auto transform scale-75 md:scale-100 origin-bottom">
             <MascoteNeural 
               size="lg" 
               mood={currentMood} 
               level={userLevel} 
               isSpeaking={isSpeaking} 
               interactive={true}
               onClick={() => {
                  mascotEvents.emit({
                    type: 'RANDOM_POKE',
                    message: TIPS[Math.floor(Math.random() * TIPS.length)].text,
                    mood: 'HAPPY'
                  });
               }}
             />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
