"use client";

import { useState, useEffect } from "react";
import { NeuroLauncher } from "./_componentes/NeuroLauncher";
import { AssistenteBoasVindas } from "./_componentes/AssistenteBoasVindas";
import { ModalUpgrade } from "./_componentes/ModalUpgrade";
import { TourProduto } from "./_componentes/TourProduto";
import useSWR from "swr";
import { api } from "@/biblioteca/http-client";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsLauncherOpen(true);
    window.addEventListener("open-neuro-launcher", handleOpen);
    return () => window.removeEventListener("open-neuro-launcher", handleOpen);
  }, []);

  const { data: summaryData } = useSWR("/api/painel/resumo", (url) => api.get<any>(url));
  const tourStatus = summaryData?.tourStatus || "LOADING";
  
  // DEBUG: Forçar PENDING para teste visual se o banco falhar
  const finalTourStatus = tourStatus === "LOADING" ? "LOADING" : (summaryData?.tourStatus || "PENDING");

  return (
    <>
      <NeuroLauncher isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} />
      <AssistenteBoasVindas />
      <ModalUpgrade />
      {finalTourStatus !== "LOADING" && <TourProduto initialStatus={finalTourStatus} />}
      {children}
    </>
  );
}
