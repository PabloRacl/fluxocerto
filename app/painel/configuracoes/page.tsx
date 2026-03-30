"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/app/painel/_componentes/PageHeader";
import { Settings, Save, RefreshCw, ShieldCheck, ChevronRight } from "lucide-react";

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
        sessionDuration: String(u.sessionDuration),
        autoLogoutMinutes: String(u.autoLogoutMinutes),
        darkMode: u.darkMode,
        currency: u.currency,
        timezone: u.timezone,
      });
    } catch {
      console.error("Erro");
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
      console.error("Erro");
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

            {/* Sessão */}
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
