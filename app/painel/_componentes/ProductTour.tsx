"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/componentes/ui/button";
import { X, Play, Compass, ChevronRight, CheckCircle } from "lucide-react";

type TourStep = {
  elementSelector: string;
  title: string;
  content: string;
};

const BASIC_STEPS: TourStep[] = [
  { elementSelector: "body", title: "Bem-vindo ao FluxoCerto!", content: "Este é o seu painel de controle financeiro. Vamos fazer um tour super rápido pra você dominar a plataforma." },
  { elementSelector: "[data-tour='resumo']", title: "Visão Macro", content: "Aqui no topo você confere o saldo do momento e a saúde geral do caixa. Tudo muda aqui conforme você lança suas contas." },
  { elementSelector: "[data-tour='mascote']", title: "Seu Parceiro Especial", content: "O Mestre Dino (eu!) fico sempre na área de cima estudando seus gastos para jogar dicas de mestre e te salvar de dívidas chatas." },
  { elementSelector: "[data-tour='menu-contas']", title: "Onde Manda a Grana", content: "Lá no menu lateral (Contas/Transações) você centraliza suas contas bancárias e registra suas movimentações pra atualizar os gráficos!" },
];

const DETAILED_STEPS: TourStep[] = [
  ...BASIC_STEPS,
  { elementSelector: "[data-tour='chart-evolucao']", title: "Balanço do Mês", content: "Sabe a clássica ansiedade de 'Será que gastei mais do que ganhei?' Esse gráfico responde isso na hora, cruzando o que entrou com o que saiu." },
  { elementSelector: "[data-tour='chart-categorias']", title: "Para onde o dinheiro voou?", content: "A famosa pizza das categorias. Passe o mouse para descobrir exatamente em que tipo de conta você anda gastando mais." },
  { elementSelector: "[data-tour='chart-projecao']", title: "Sapo Futurista", content: "Se você mantiver os hábitos de hoje, como fica sua conta daqui 90 dias? Aqui a gente prevê o futuro pra não ter surpresas." },
  { elementSelector: "[data-tour='insights']", title: "Diagnóstico e Saúde", content: "O Mestre Dino dá uma nota para a sua disciplina! Fique de olho também nos Alertas de contas que vencem hoje." },
  { elementSelector: "[data-tour='menu-compras']", title: "Preguiça de Digitar?", content: "Use o módulo de Compras do menu para escanear QR Codes ou Notas Fiscais e a gente preenche e categoriza as comprinhas do supermercado automaticamente." },
  { elementSelector: "[data-tour='menu-metas']", title: "Quais seus planos?", content: "Uma viagem? Trocar de moto? Criando uma meta, a gente te avisa de quanto você tem guardado e o quanto falta atingir." },
  { elementSelector: "[data-tour='menu-relatorios']", title: "Relatórios Ninja", content: "Precisou puxar um resumo do ano inteiro só de despesas do carro? Em Relatórios você cruza filtros avançados e extrai direto em Excel/PDF." },
];

interface ProductTourProps {
  initialStatus: string;
}

export function ProductTour({ initialStatus }: ProductTourProps) {
  const [status, setStatus] = useState(initialStatus);
  const [tourType, setTourType] = useState<"BASIC" | "DETAILED" | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourStarted, setTourStarted] = useState(false);

  useEffect(() => {
    console.log("ProductTour [DEBUG]: Status inicial:", initialStatus);
    if (initialStatus !== "LOADING") {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

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
    saveStatus("COMPLETED");
  };

  const steps = tourType === "BASIC" ? BASIC_STEPS : DETAILED_STEPS;
  const currentDetails = steps[currentStep];

  // LOG de renderização
  console.log("ProductTour [RENDER]: status =", status, "tourStarted =", tourStarted);

  return (
    <AnimatePresence>
      {/* 1. Modal de Escolha Inicial */}
      {!tourStarted && status === "PENDING" && (
        <motion.div
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
            <div className="absolute top-0 right-0 p-4">
              <button onClick={skipTour} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 text-3xl">
                🐸
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Fala, Mestre!</h2>
              <p className="text-slate-400">Aqui é o Dino. Escolha como quer que eu te apresente a casa.</p>
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

      {/* 2. Tour Em Execução (Bottom Right Card) */}
      {tourStarted && (
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.9 }}
           className="fixed bottom-6 right-6 z-[9999] w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5"
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
