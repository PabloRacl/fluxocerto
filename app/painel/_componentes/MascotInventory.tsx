"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeuralMascot } from "./NeuralMascot";
import { mascotEvents } from "@/biblioteca/MascotEvents";
import { X, Lock, CheckCircle2, TrendingUp, Trophy, Zap } from "lucide-react";
import { AnimatedModal } from "./AnimatedModal";

interface MascotInventoryProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
}

const ITEMS = [
  { level: 5, icon: "🕶️", name: "Óculos de Operador", desc: "Visão analítica para detectar tendências escondidas." },
  { level: 10, icon: "👔", name: "Gravata de CEO", desc: "A postura correta para lidar com grandes patrimônios." },
  { level: 15, icon: "🏅", name: "Medalha de Honra", desc: "Reconhecimento por manter o fluxo positivo por 15 ciclos." },
  { level: 20, icon: "⌚", name: "Relógio de Precisão", desc: "Nunca perca um vencimento com o cronômetro neural." },
  { level: 25, icon: "🎩", name: "Cartola de Prestigio", desc: "Elegância máxima para quem domina os juros compostos." },
  { level: 30, icon: "👑", name: "Coroa de Mestre", desc: "Soberania total sobre suas finanças e investimentos." },
  { level: 35, icon: "💎", name: "Diamante de Riqueza", desc: "O auge da solidez financeira alcançado." },
  { level: 40, icon: "🔥", name: "Aura Neural", desc: "Energia pura emanando do seu sucesso financeiro." },
  { level: 45, icon: "💸", name: "Chuva de Liquidez", desc: "Recursos fluindo como nunca antes." },
  { level: 50, icon: "🌟", name: "Estrela Guia", desc: "Você se tornou uma lenda no FluxoCerto." },
];

export function MascotInventory({ isOpen, onClose, level }: MascotInventoryProps) {
  const [equippedItems, setEquippedItems] = useState<number[]>([]);
  const [transforming, setTransforming] = useState(false);

  // Initially equip all unlocked items when the modal opens
  useEffect(() => {
    if (isOpen) {
      setEquippedItems(ITEMS.filter(item => level >= item.level).map(item => item.level));
    }
  }, [isOpen, level]);

  const toggleItem = (itemLevel: number) => {
    setEquippedItems(prev => {
      const isEquipping = !prev.includes(itemLevel);
      if (isEquipping) {
         setTransforming(true);
         setTimeout(() => setTransforming(false), 800);
         
         const item = ITEMS.find(i => i.level === itemLevel);
         if (item) {
           mascotEvents.emit({
             type: 'CUSTOM',
             message: `Análise concluída: Item de nível ${itemLevel} sincronizado com sucesso!`,
             mood: 'HAPPY'
           });
         }
      }
      return isEquipping 
        ? [...prev, itemLevel] 
        : prev.filter(l => l !== itemLevel);
    });
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inventário do Guardião"
      subtitle="Sincronização de equipamentos e conquistas neurais"
      icon={<Trophy className="w-6 h-6 text-emerald-400" />}
      theme="emerald"
      maxWidth="lg"
    >
      <div className="p-2 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Lado Esquerdo: Visualização do Mascote HUD 2.0 */}
        <div className="flex flex-col items-center justify-center p-10 bg-slate-950/60 backdrop-blur-3xl rounded-[3rem] border border-white/5 relative overflow-hidden group shadow-2xl">
          {/* Efeitos de Luz e Scan */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-emerald-400/30 blur-[2px] animate-[scan_4s_linear_infinite]" />
          
          {/* Decorative Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative z-10 mb-8 transform group-hover:scale-110 transition-transform duration-700">
             <div className="absolute inset-0 bg-emerald-500/20 blur-[50px] rounded-full animate-pulse" />
             
             {/* Efeito de Transformação (Flash) */}
             <AnimatePresence>
                {transforming && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-[-40%] bg-emerald-300 rounded-full blur-[60px] z-50 mix-blend-screen"
                  />
                )}
             </AnimatePresence>

             <NeuralMascot size="xl" level={level} showScan={true} equippedItems={equippedItems} interactive={true} />
          </div>

          <div className="text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-900/80 border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span className="text-xs font-black text-white tracking-[0.2em] uppercase">Status: Nível {level}</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-[240px] mt-2 font-medium italic leading-relaxed">
              "Cada upgrade em seu patrimônio desbloqueia novas capacidades no meu núcleo processador."
            </p>
          </div>

          {/* Glow Line Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        </div>

        {/* Lado Direito: Grid de Itens HUD 2.0 */}
        <div className="flex flex-col gap-4 max-h-[520px] overflow-y-auto pr-3 custom-scrollbar">
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cadeia de Evolução</h4>
            <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">v2.0_Secure</span>
          </div>
          
          {ITEMS.map((item, idx) => {
            const isUnlocked = level >= item.level;
            const isEquipped = equippedItems.includes(item.level);

            return (
              <motion.button
                key={idx}
                onClick={() => isUnlocked && toggleItem(item.level)}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                className={`w-full text-left relative flex items-center gap-5 p-5 rounded-3xl border transition-all duration-500 group/item overflow-hidden ${
                  isUnlocked 
                  ? (isEquipped ? 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-slate-900/60 border-white/5 hover:border-emerald-500/40 hover:bg-slate-900/80')
                  : 'bg-slate-950/40 border-white/[0.02] opacity-40 grayscale pointer-events-none'
                }`}
              >
                {/* Item Background Glow */}
                {isUnlocked && (
                  <div className={`absolute -right-8 -bottom-8 w-24 h-24 blur-3xl transition-opacity ${isEquipped ? 'bg-emerald-500/20 opacity-100' : 'bg-emerald-500/5 group-hover/item:opacity-100 opacity-0'}`} />
                )}

                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 transition-all duration-500 relative ${
                  isUnlocked 
                  ? (isEquipped ? 'bg-emerald-950 border border-emerald-400/50 shadow-inner scale-110 rotate-3' : 'bg-slate-950 border border-emerald-500/20 shadow-inner group-hover/item:scale-110 group-hover/item:rotate-3') 
                  : 'bg-slate-950/60 border border-white/5'
                }`}
                style={{ lineHeight: 1 }}>
                  {isUnlocked ? (
                    <>
                      <span className="relative z-10 flex items-center justify-center leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{item.icon}</span>
                      <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-md" />
                    </>
                  ) : <Lock className="w-6 h-6 text-slate-700" />}
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-black tracking-tight uppercase ${isUnlocked ? (isEquipped ? 'text-emerald-400' : 'text-white') : 'text-slate-600'}`}>
                      {item.name}
                    </span>
                    <div className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter transition-colors ${
                      isUnlocked ? (isEquipped ? 'bg-emerald-500 text-slate-950 border border-emerald-400' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20') : 'bg-slate-900 text-slate-700'
                    }`}>
                      LVL {item.level}
                    </div>
                  </div>
                  <p className={`text-[11px] font-medium leading-normal italic line-clamp-2 ${isEquipped ? 'text-emerald-500/70' : 'text-slate-500'}`}>
                    {isUnlocked ? item.desc : "Sincronização insuficiente para descriptografar item."}
                  </p>
                </div>

                {isUnlocked && (
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity ${isEquipped ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-50'}`}>
                     <CheckCircle2 className={`w-5 h-5 ${isEquipped ? 'text-emerald-400' : 'text-emerald-500/50'}`} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </AnimatedModal>
  );
}
