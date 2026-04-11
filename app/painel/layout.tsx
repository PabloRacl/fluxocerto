"use client";

import { useState, useEffect } from "react";
import { NeuroLauncher } from "./_componentes/NeuroLauncher";
import { OnboardingWizard } from "./_componentes/OnboardingWizard";
import { UpgradeModal } from "./_componentes/UpgradeModal";
import { ProductTour } from "./_componentes/ProductTour";
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
      <OnboardingWizard />
      <UpgradeModal />
      {finalTourStatus !== "LOADING" && <ProductTour initialStatus={finalTourStatus} />}
      {children}
    </>
  );
}
