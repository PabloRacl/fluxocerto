"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { Settings, Save, RefreshCw, ShieldCheck, ChevronRight, Trash2, Database, AlertCircle, LogOut, Skull } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ConfiguracoesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    sessionDuration: "7",
    autoLogoutMinutes: "30",
    darkMode: false,
    currency: "BRL",
    timezone: "America/Sao_Paulo",
  });

  const fetchConfig = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch("/api/configuracoes", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const u = data.usuario;
      setForm({
        name: u.name || "",
        email: u.email || "",
        sessionDuration: String(u.sessionDuration || 7),
        autoLogoutMinutes: String(u.autoLogoutMinutes || 30),
        darkMode: u.darkMode || false,
        currency: u.currency || "BRL",
        timezone: u.timezone || "America/Sao_Paulo",
      });
    } catch {
      console.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") fetchConfig();
  }, [status, fetchConfig]);

  if (status === "loading")
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );

  if (status === "unauthenticated") {
    router.push("/entrar");
    return null;
  }

  const handleDataReset = async (type: string, label: string) => {
    const confirmMessage = type === "full_account_delete" 
      ? `ATENÇÃO: Isso excluirá sua conta e TODOS os seus dados permanentemente. Reservado apenas para casos críticos. Digite "EXCLUIR" para confirmar:` 
      : `Deseja realmente limpar seus dados de ${label}? Esta ação é irreversível.`;
    
    if (type === "full_account_delete") {
      const input = prompt(confirmMessage);
      if (input !== "EXCLUIR") return;
    } else {
      if (!confirm(confirmMessage)) return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/usuario/reset-data", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        alert("Dados processados com sucesso!");
        if (type === "full_account_delete") {
          signOut({ callbackUrl: "/entrar" });
        } else {
          window.location.reload();
        }
      } else {
        alert("Erro ao processar limpeza.");
      }
    } catch {
      alert("Falha crítica no motor de limpeza.");
    } finally {
      setSaving(false);
    }
  };

  const salvar = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sessionDuration: parseInt(form.sessionDuration),
          autoLogoutMinutes: parseInt(form.autoLogoutMinutes),
          darkMode: form.darkMode,
          currency: form.currency,
          timezone: form.timezone,
        }),
      });
      if (res.ok) alert("Configurações salvas!");
    } catch {
      console.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Configurações"
        description="Personalize sua experiência"
        breadcrumbs={[{ label: "Configurações" }]}
      >
        <button
          onClick={fetchConfig}
          className="p-2 text-slate-400 hover:text-emerald-400 transition-colors hidden sm:block"
          title="Atualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </PageHeader>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Perfil */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Perfil</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Nome
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Email
                  </label>
                  <input
                    value={form.email}
                    disabled
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Gestão de Dados (Zona de Perigo) */}
            <div className="bg-slate-900/50 rounded-xl border border-red-500/10 p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <AlertCircle className="w-24 h-24 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-1 flex items-center gap-2">
                <Database className="w-5 h-5" /> Zona de Perigo Neural
              </h3>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-6">Controle e Purificação de Dados</p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDataReset("mappings", "Mapeamentos de Notas")}
                    className="flex items-center gap-3 p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl text-left transition-all"
                  >
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <RefreshCw className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Resetar Mapeamentos</p>
                      <p className="text-[10px] text-slate-500">Limpa a memória de IA das notas.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDataReset("transactions", "Transações")}
                    className="flex items-center gap-3 p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl text-left transition-all"
                  >
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Limpar Transações</p>
                      <p className="text-[10px] text-slate-500">Reseta o histórico financeiro.</p>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => handleDataReset("full_account_delete", "MINHA CONTA")}
                  className="w-full mt-4 flex items-center justify-center gap-3 p-4 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-red-500 font-black text-xs uppercase tracking-widest transition-all"
                >
                  <Skull className="w-4 h-4" /> EXCLUIR MINHA CONTA PERMANENTEMENTE
                </button>
              </div>
            </div>

            {/* Sessão e Segurança */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Sessão e Segurança
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Duração da sessão (dias)
                  </label>
                  <input
                    type="number"
                    value={form.sessionDuration}
                    onChange={(e) =>
                      setForm({ ...form, sessionDuration: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Auto logout (minutos)
                  </label>
                  <input
                    type="number"
                    value={form.autoLogoutMinutes}
                    onChange={(e) =>
                      setForm({ ...form, autoLogoutMinutes: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                 <button 
                  onClick={() => router.push("/painel/configuracoes/auditoria")}
                  className="w-full flex items-center justify-between p-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-xl transition-all group"
                 >
                    <div className="flex items-center gap-3">
                       <ShieldCheck className="w-5 h-5 text-emerald-500" />
                       <div className="text-left">
                          <p className="text-sm font-bold text-white">Auditoria Enterprise</p>
                          <p className="text-[10px] text-slate-500">Acesse o histórico detalhado de todas as suas alterações.</p>
                       </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                 </button>
              </div>
            </div>

            {/* Preferências */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Preferências
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Moeda
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) =>
                        setForm({ ...form, currency: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="BRL">Real (BRL)</option>
                      <option value="USD">Dólar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Fuso Horário
                    </label>
                    <select
                      value={form.timezone}
                      onChange={(e) =>
                        setForm({ ...form, timezone: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="America/Sao_Paulo">
                        São Paulo (GMT-3)
                      </option>
                      <option value="America/Manaus">Manaus (GMT-4)</option>
                      <option value="America/Belem">Belém (GMT-3)</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.darkMode}
                    onChange={(e) =>
                      setForm({ ...form, darkMode: e.target.checked })
                    }
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white">Modo escuro</span>
                </label>
              </div>
            </div>

            <button
              onClick={salvar}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5" />{" "}
              {saving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
