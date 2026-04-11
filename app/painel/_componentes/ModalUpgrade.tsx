"use client";

import { useState, useEffect } from "react";
import { ModalAnimado } from "./ModalAnimado";
import { Lock, Star, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ModalUpgrade() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-upgrade-modal", handleOpen);
    return () => window.removeEventListener("open-upgrade-modal", handleOpen);
  }, []);

  return (
    <ModalAnimado
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Recurso Premium"
      subtitle="Exclusivo para contas PRO e ENTERPRISE"
      icon={<Lock className="w-6 h-6 text-white" />}
      theme="amber"
    >
      <div className="p-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30 shadow-inner">
            <Star className="w-8 h-8 text-amber-500 drop-shadow-md" />
          </div>
          <p className="text-lg text-slate-300 font-medium pt-2">
            A funcionalidade que você tentou acessar faz parte do pacote PRO.
          </p>
          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/50 shadow-inner mt-4">
            <ul className="text-left space-y-3 text-slate-300 text-sm">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">Criação Ilimitada de Contas</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">Sincronização Bancária (Open Finance)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">Exportações Detalhadas (PDF/CSV)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={() => {
              setIsOpen(false);
              // router.push("/configuracoes/plano"); // Ajuste o link se necessário
            }}
            className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center transform hover:scale-[1.02]"
          >
            Conhecer Plano PRO
          </button>
        </div>
      </div>
    </ModalAnimado>
  );
}
