"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Send, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/shared/icon";
import { useToast } from "@/components/ui/toast";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import { Stepper } from "./stepper";
import { SidePanel } from "./side-panel";
import { SuccessScreen } from "./success-screen";
import { StepInfo, StepDocuments, StepBanking, StepAddress, StepReview } from "./steps";
import {
  INITIAL_DATA,
  STEPS,
  stepValidity,
  dossierNumber,
  type OnboardingData,
} from "./constants";

export function OnboardingWizard() {
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState<OnboardingData>(INITIAL_DATA);
  const [submitted, setSubmitted] = React.useState(false);

  const update = React.useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const valid = React.useMemo(() => stepValidity(data), [data]);
  const dossier = React.useMemo(() => dossierNumber(data), [data]);

  const isLast = step === STEPS.length - 1;
  const canContinue = valid[step];

  function goTo(target: number) {
    setStep(target);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    if (!canContinue) return;
    goTo(Math.min(step + 1, STEPS.length - 1));
  }

  function prev() {
    goTo(Math.max(step - 1, 0));
  }

  function submit() {
    if (!valid.every(Boolean)) return;
    setSubmitted(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    toast({
      title: "Demande envoyée 🎉",
      description: `Dossier ${dossier} · validation sous 24-48h.`,
      tone: "success",
    });
  }

  if (submitted) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <SuccessScreen data={data} dossier={dossier} />
      </div>
    );
  }

  const current = STEPS[step];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl brand-gradient text-white shadow-glow">
          <Rocket className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-black tracking-tight text-ink">Inscription commerçant</h1>
          <p className="text-sm text-muted">Rejoignez NOVIGO en 5 étapes et développez votre activité.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-4 sm:p-5">
            <Stepper current={step} valid={valid} onGo={goTo} />
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon name={current.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[12px] font-semibold text-brand">
                  Étape {step + 1} sur {STEPS.length}
                </p>
                <h2 className="text-lg font-bold text-ink">{current.label}</h2>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 0 && <StepInfo data={data} update={update} />}
                {step === 1 && <StepDocuments data={data} update={update} />}
                {step === 2 && <StepBanking data={data} update={update} />}
                {step === 3 && <StepAddress data={data} update={update} />}
                {step === 4 && <StepReview data={data} update={update} onEdit={goTo} />}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
              <Button variant="ghost" onClick={prev} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4" /> Précédent
              </Button>
              {isLast ? (
                <Button variant="success" onClick={submit} disabled={!canContinue}>
                  <Send className="h-4 w-4" /> Soumettre ma demande
                </Button>
              ) : (
                <Button onClick={next} disabled={!canContinue}>
                  Suivant <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!canContinue && (
              <p className={cn("mt-3 text-center text-[12px] text-muted", isLast && "text-warning")}>
                {isLast
                  ? "Acceptez les conditions pour soumettre votre demande."
                  : "Complétez les champs requis pour continuer."}
              </p>
            )}
          </Card>
        </div>

        <aside className="hidden lg:block">
          <Reveal>
            <SidePanel current={step} valid={valid} />
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
