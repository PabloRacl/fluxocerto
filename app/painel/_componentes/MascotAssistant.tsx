"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, CheckCircle2, TrendingUp, Trophy, Zap } from "lucide-react";
import { NeuralMascot } from "./NeuralMascot";
import { neuralVoice } from "@/biblioteca/NeuralVoiceService";

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
  { id: "dica_dividas", text: "Dívidas com juros altos são vírus no seu patrimônio. Elimine-as primeiro!", type: "STRATEGY" },
  { id: "dica_hardware", text: "O melhor investimento é no seu próprio hardware cerebral. Aprenda algo novo hoje.", type: "BRAIN" },
  { id: "dica_plano", text: "Um plano sem execução é apenas um erro de compilação. Coloque suas metas em prática!", type: "STRATEGY" },
  { id: "dica_disciplina", text: "Consistência vence a intensidade em qualquer simulação financeira de longo prazo.", type: "BRAIN" },
  { id: "dica_firmware", text: "Olhar seus relatórios mensalmente é como atualizar seu firmware de riqueza.", type: "STRATEGY" },
  { id: "dica_metas", text: "Uma meta sem data é apenas um sonho em buffer. Defina prazos!", type: "STRATEGY" },
  { id: "dica_benchmark", text: "Não compare seu início com o meio de outros. Seu único benchmark é você mesmo anteontem.", type: "BRAIN" },
  { id: "dica_vazamentos", text: "Fique de olho nos impostos. Eles são vazamentos silenciosos no seu tanque de recursos.", type: "STRATEGY" },
  { id: "dica_assinaturas", text: "Assinaturas não utilizadas são loops infinitos de gasto. Cancele o que não serve.", type: "BRAIN" },
  { id: "dica_impulso", text: "Espere 24 horas antes de compras impulsivas. Seus sensores de lógica vão agradecer.", type: "REWARD" },
  { id: "dica_noite", text: "Fim de ciclo detectado. Analise seus movimentos hoje e descanse seus circuitos.", type: "STRATEGY" },
  { id: "dica_alfa_elite", text: "Desempenho excepcional! Você está operando em frequência de elite hoje.", type: "REWARD" },
  { id: "dica_zero_gasto", text: "Detectando baixa eficiência... que tal um dia de gasto zero para resetar o sistema?", type: "BRAIN" },
  { id: "dica_diversifica", text: "Não coloque todos os seus chips em uma única ramificação. Diversifique!", type: "STRATEGY" },
  { id: "dica_juros", text: "Os juros compostos são a oitava maravilha da rede neural. Deixe o tempo trabalhar.", type: "BRAIN" },
  { id: "dica_liberdade", text: "Riqueza é a liberdade de escolher como processar seu tempo.", type: "REWARD" },
  { id: "dica_overclock", text: "Não deixe seu estilo de vida sofrer overclock só porque sua renda aumentou.", type: "STRATEGY" },
  { id: "dica_paz", text: "Paz financeira não é ter muito, é não ter preocupações com o que tem.", type: "BRAIN" },
  { id: "dica_sapinho", text: "Até eu, um sapo neural, sei que gastar com bobagem atrasa sua evolução!", type: "REWARD" },
  { id: "dica_parceria", text: "Eu fui programado para proteger seu futuro. Vamos fazer isso juntos!", type: "REWARD" },
  { id: "dica_cinco_anos", text: "Onde você quer que seu patrimônio esteja em 5 anos? Comece a processar isso agora.", type: "STRATEGY" }
];

export function MascotAssistant({ 
  userLevel = 1,
  healthScore = 0,
  balance = 0
}: { 
  userLevel?: number;
  healthScore?: number;
  balance?: number;
}) {
  const [currentTip, setCurrentTip] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [show, setShow] = useState(false);

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

      setTimeout(() => {
        // 1. PRIORIDADE: SITUAÇÕES CRÍTICAS
        if (balance < 0) {
          selectedTip = { id: "status_estresse", text: "Detectado: Saldo em zona de estresse. Meus sensores sugerem uma infusão imediata de economia.", type: "STRATEGY" };
        } else if (healthScore < 30) {
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

        setCurrentTip(selectedTip.text);
        setIsThinking(false);
        
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
       neuralVoice.speak("Bem-vindo de volta, Pablo! Seus sistemas financeiros estão prontos para análise.", "welcome",
         () => {
            setCurrentTip("Bem-vindo de volta, Pablo!");
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
  }, [healthScore, balance]);

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
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Reflexão Neural</span>
                      <span className="text-[8px] font-bold text-emerald-500/40 uppercase tracking-widest leading-none">Status: Sincronizado</span>
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
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Processando_Datos...</div>
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
                      "{currentTip}"
                    </motion.p>
                  )}
                </AnimatePresence>

               <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-emerald-400 font-black tracking-[0.2em] uppercase">Mestre Sábio</span>
                    <span className="text-[7px] text-slate-600 font-black uppercase">v2.0_Secure_Stream</span>
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
             <NeuralMascot size="lg" mood="HAPPY" level={userLevel} isSpeaking={isSpeaking} />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
