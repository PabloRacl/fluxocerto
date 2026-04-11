"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/componentes/ui/button";
import { X, Play, Compass, ChevronRight, CheckCircle, Zap } from "lucide-react";

type TourStep = {
  elementSelector: string;
  title: string;
  content: string;
};

const BASIC_STEPS: TourStep[] = [
  { elementSelector: "body", title: "HUD Ativado", content: "O Dino tá na área! Este é o seu novo QG Financeiro. Prepare-se para dominar seu dinheiro com a visão de um estrategista!" },
  { elementSelector: "[data-tour='resumo']", title: "HUD de Saldo Real-Time", content: "Aqui o fluxo nunca para! Acompanhe seu patrimônio total e saúde do caixa em tempo real. Se os números subirem, o Dino pula de alegria!" },
  { elementSelector: "[data-tour='mascote']", title: "Protocolo Dino-Mentor", content: "Eu fico de olho em cada centavo. Se eu notar uma anomalia nos seus gastos ou uma oportunidade de poupar, eu te aviso na hora!" },
  { elementSelector: "[data-tour='header-perfil']", title: "Configurações de Acesso", content: "Acessando seu nome, você vai direto para as suas configurações de conta, perfis e preferências. Sua identidade financeira fica sob sigilo máximo." },
];

const DETAILED_STEPS: TourStep[] = [
  ...BASIC_STEPS,
  { elementSelector: "[data-tour='chart-evolucao']", title: "Matriz de Evolução", content: "Sabe aquela dúvida se gastou mais do que devia? Esse gráfico cruza tudo e mostra se você está em ascensão ou precisando corrigir a nave." },
  { elementSelector: "[data-tour='chart-categorias']", title: "Raio-X de Gastos", content: "Passe o cursor por aqui e descubra qual categoria está 'vampirizando' seu saldo neste exato momento." },
  { elementSelector: "[data-tour='chart-projecao']", title: "Previsão Futurista", content: "Com base no seu hábito atual, como estará sua conta daqui a 90 dias? Eu prevejo o futuro para você evitar o caos." },
  { elementSelector: "[data-tour='insights']", title: "Diagnóstico Neural", content: "Aqui é o coração da IA. Eu solto relatórios diretos, alertas de faturas e dicas de como otimizar seus lucros com base nos seus dados!" },
  { elementSelector: "[data-tour='menu-transacoes']", title: "Entradas e Saídas", content: "A central de lançamentos. Todas as suas despesas e receitas em um painel único e rápido." },
  { elementSelector: "[data-tour='menu-categorias']", title: "Organização Extrema", content: "Crie categorias de despesa livres aqui. Quanto melhor categorizado, mais poderoso fica o seu HUD de análise." },
  { elementSelector: "[data-tour='menu-dividas']", title: "Exterminador de Dívidas", content: "Cansado de juros? Monte seus parcelamentos e financiamentos aqui, nós faremos a projeção de amortização pra você quitar tudo!" },
  { elementSelector: "[data-tour='menu-compras']", title: "Radar de Compras", content: "Supermercado, feiras e lista. Gerencie seus carrinhos, compare preços ou até escaneie QR Codes de nota fiscal!" },
  { elementSelector: "[data-tour='menu-metas']", title: "Sonhos Tangíveis", content: "Não basta guardar. Crie Metas (ex: 'Carro Novo', 'Reserva'). Eu coloco uma barra de carregamento letal focada no sucesso." },
  { elementSelector: "[data-tour='menu-orcamentos']", title: "Teto de Aço", content: "Defina os limites do quanto você pode queimar no mês para não estourar o cartão. O sistema bloqueia os exageros!" },
  { elementSelector: "[data-tour='menu-assinaturas']", title: "Auditor de Assinaturas", content: "Você tem Spotify, Netflix, Gympass e até esqueceu o que paga no dia 15? Este espaço caça as cobranças recorrentes ocultas." },
  { elementSelector: "[data-tour='menu-patrimonio']", title: "Potência Líquida", content: "O sumário real da sua riqueza. Tudo o que você TEM menos o que DEVE. Este número é o que realmente separa os profissionais dos amadores." },
  { elementSelector: "[data-tour='menu-calculadora']", title: "Armas Matemáticas", content: "Acesse nossas calculadoras Enterprise: simule Juros Compostos, Amortizações Fixas, PRICE ou SAC livremente." },
  { elementSelector: "[data-tour='menu-relatorios']", title: "Relatórios de Elite", content: "Enfim, nossa joia da coroa. Gere balanços absurdos exportáveis em Excel ou PDF perfeitos para fechar o caixa ou mandar pro seu contador." },
];

interface ProductTourProps {
  initialStatus: string;
}

export function TourProduto({ initialStatus }: ProductTourProps) {
  const [status, setStatus] = useState(initialStatus);
  const [tourType, setTourType] = useState<"BASIC" | "DETAILED" | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourStarted, setTourStarted] = useState(false);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const steps = tourType === "BASIC" ? BASIC_STEPS : DETAILED_STEPS;
  const currentDetails = steps[currentStep];

  useEffect(() => {
    console.log("TourProduto [DEBUG]: Status inicial:", initialStatus);
    if (initialStatus !== "LOADING") {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  // Efeito 1: Apenas rolar a página suavemente quando o passo muda
  useEffect(() => {
    if (tourStarted && currentDetails?.elementSelector && currentDetails.elementSelector !== "body") {
      const element = document.querySelector(currentDetails.elementSelector);
      if (element) {
         // Executa a rolagem
         element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentStep, tourStarted, currentDetails]);

  // Efeito 2: Rastrear passivamente a caixa para o spotlight brilhar sem disparar loop de scroll
  useEffect(() => {
    if (tourStarted && currentDetails?.elementSelector) {
      const updateRect = () => {
        if (currentDetails.elementSelector === "body") {
          setTargetRect(null); // Sem spotlight para o passo inicial global
          return;
        }

        const element = document.querySelector(currentDetails.elementSelector);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        } else {
          setTargetRect(null);
        }
      };

      // Pequeno timeout depois que muda o passo para permitir o scrollIntoView chegar no ponto
      const timer = setTimeout(updateRect, 450);

      window.addEventListener("resize", updateRect, { passive: true });
      window.addEventListener("scroll", updateRect, { passive: true });
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateRect);
        window.removeEventListener("scroll", updateRect);
      };
    }
  }, [currentStep, tourStarted, currentDetails]);

  const saveStatus = async (newStatus: string) => {
    setStatus(newStatus);
    await fetch("/api/usuario/tour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
  };

  const skipTour = () => saveStatus("SKIPPED");
  
  const startTour = (type: "BASIC" | "DETAILED") => {
    setTourType(type);
    setTourStarted(true);
    setCurrentStep(0);
  };

  const endTour = () => {
    setTourStarted(false);
    setTargetRect(null);
    saveStatus("COMPLETED");
  };

  console.log("TourProduto [RENDER]: status =", status, "tourStarted =", tourStarted, "targetRect =", !!targetRect);

  return (
    <AnimatePresence mode="popLayout">
      {!tourStarted && status === "PENDING" && (
        <motion.div
          key="modal-inicial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
            
            <div className="absolute top-0 right-0 p-4 z-10">
              <button onClick={skipTour} className="text-slate-500 hover:text-white transition-colors bg-slate-900/50 p-1 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center mb-8 relative">
              <motion.div 
                animate={{ translateY: ["-8px", "8px", "-8px"] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-32 h-32 mx-auto mb-6"
              >
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full border-dashed animate-[spin_8s_linear_infinite]" />
                <Image 
                  src="/mascote/sapo_feliz_dark.png" 
                  alt="Dino HUD" 
                  fill 
                  priority
                  className="object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] filter brightness-110 saturate-150" 
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 mb-3 tracking-tight">
                  Inicializando Sistema...
                </h2>
                <p className="text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">
                  Aqui é o <span className="text-emerald-400 font-bold">Dino</span>. Eu serei seu mentor financeiro. Escolha o protocolo de navegação para mapearmos a interface.
                </p>
              </motion.div>
            </div>

            <div className="grid gap-4">
              <button 
                onClick={() => startTour("BASIC")}
                className="flex items-center text-left p-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-emerald-500/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mr-4 group-hover:bg-emerald-500/10">
                  <Play className="w-5 h-5 text-slate-300 group-hover:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">Tour Essencial</h3>
                  <p className="text-xs text-slate-400">Rápido e direto ao ponto (1 min)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400" />
              </button>

              <button 
                onClick={() => startTour("DETAILED")}
                className="flex items-center text-left p-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mr-4 group-hover:bg-blue-500/10">
                  <Compass className="w-5 h-5 text-slate-300 group-hover:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">Guia Completo</h3>
                  <p className="text-xs text-slate-400">Aprenda todos os detalhes e truques (3 min)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
              </button>
            </div>
            
            <button onClick={skipTour} className="w-full mt-6 text-sm text-slate-500 hover:text-white pb-1">
              Pular tour, já conheço o sistema
            </button>
          </motion.div>
        </motion.div>
      )}

      {tourStarted && (
        <motion.div
          key="spotlight-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] pointer-events-none"
        >
          <svg className="w-full h-full">
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {targetRect && (
                  <motion.rect
                    initial={false}
                    animate={{
                      x: targetRect.left - 5,
                      y: targetRect.top - 5,
                      width: targetRect.width + 10,
                      height: targetRect.height + 10,
                    }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    rx="16"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(2, 6, 23, 0.90)"
              mask="url(#spotlight-mask)"
              className="pointer-events-auto transition-colors duration-1000"
            />
            {targetRect && (
              <motion.rect
                initial={false}
                animate={{
                  x: targetRect.left - 5,
                  y: targetRect.top - 5,
                  width: targetRect.width + 10,
                  height: targetRect.height + 10,
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                rx="16"
                fill="transparent"
                stroke="rgba(16, 185, 129, 0.8)"
                strokeWidth="2"
                className="pointer-events-none"
              />
            )}
          </svg>
        </motion.div>
      )}

      {tourStarted && (
        <motion.div
           key="tour-floating-card"
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ 
             opacity: 1, 
             scale: 1,
             y: targetRect ? 0 : 0 
           }}
           exit={{ opacity: 0, scale: 0.9 }}
           className={`fixed z-[9999] w-80 bg-slate-900 border border-slate-700 shadow-2xl p-5 ${
             targetRect 
               ? "rounded-2xl" 
               : "bottom-6 right-6 rounded-2xl"
           }`}
           style={targetRect ? {
             top: targetRect.top + targetRect.height + 20 > window.innerHeight - 200
               ? targetRect.top - 200
               : targetRect.top + targetRect.height + 20,
             left: Math.max(20, Math.min(window.innerWidth - 340, targetRect.left + (targetRect.width / 2) - 160))
           } : {}}
        >
           <div className="flex justify-between items-start mb-3">
             <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
               Passo {currentStep + 1} de {steps.length}
             </div>
             <button onClick={endTour} className="text-slate-500 hover:text-white">
               <X className="w-4 h-4" />
             </button>
           </div>
           
           <h3 className="text-lg font-bold text-white mb-2">{currentDetails?.title}</h3>
           <p className="text-sm text-slate-400 mb-5 leading-relaxed">{currentDetails?.content}</p>

           <div className="flex justify-between items-center gap-2">
             <button 
                onClick={endTour}
                className="text-xs text-slate-500 hover:text-slate-300"
             >
                Encerrar Tour
             </button>
             
             {currentStep < steps.length - 1 ? (
               <Button onClick={() => setCurrentStep(prev => prev + 1)} className="bg-emerald-600 hover:bg-emerald-500 text-xs px-4">
                 Próximo Passo
               </Button>
             ) : (
               <Button onClick={endTour} className="bg-emerald-600 hover:bg-emerald-500 text-xs px-4">
                 <CheckCircle className="w-4 h-4 mr-2" />
                 Concluir
               </Button>
             )}
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}