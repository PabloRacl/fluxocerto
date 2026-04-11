"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { ModalAnimado } from "./ModalAnimado";
import { Rocket, Plus } from "lucide-react";

export function AssistenteBoasVindas() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Evita o wizard na própria tela de contas ou configurações para não atrapalhar o fluxo de criação
    if (!pathname || pathname.includes("/contas") || pathname.includes("/configuracoes") || !session?.user) return;

    const checkAccounts = async () => {
      try {
        const res = await fetch("/api/contas");
        if (res.ok) {
          const json = await res.json();
          // Se não houver contas, devemos exibir o Onboarding Guiado (Time-to-Value < 3 minutos)
          if (json.data && Array.isArray(json.data) && json.data.length === 0) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error("Erro ao checar Onboarding:", err);
      }
    };

    checkAccounts();
  }, [pathname, session]);

  return (
    <ModalAnimado
      isOpen={isOpen}
      onClose={() => {}} // Removemos a ação do overlay para forçar o clique no botão
      title="Bem-vindo ao FluxoCerto!"
      subtitle="Vamos configurar seu Guardião Financeiro."
      icon={<Rocket className="w-6 h-6 text-white" />}
      theme="emerald"
    >
      <div className="p-6 space-y-6">
        <div className="text-slate-300">
          <p className="mb-4 text-lg font-medium text-white">
            Notamos que esta é sua primeira vez aqui.
          </p>
          <p className="mb-6">
            O FluxoCerto precisa de pelo menos uma Conta (ou Carteira) para começar a rastrear o seu fluxo financeiro!
          </p>
          <div className="bg-slate-800/80 border border-slate-700/50 p-5 rounded-2xl flex items-start gap-4 shadow-inner">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1 border border-emerald-500/30">
              <span className="text-emerald-400 font-bold">1</span>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Crie sua Primeira Conta</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Pode ser sua conta corrente, saldo em dinheiro na gaveta, ou a sua carteira digital. Sem isso, as transações não terão uma origem de caixa.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/painel/contas");
            }}
            className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Configurar Minha Conta
          </button>
        </div>
      </div>
    </ModalAnimado>
  );
}
