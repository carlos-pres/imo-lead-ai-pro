import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, X, Rocket, Search, Eye, Bot } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
  icon: typeof CheckCircle2;
}

const ONBOARDING_KEY = "imolead_onboarding_completed";
const CHECKLIST_KEY = "imolead_onboarding_checklist";

export function OnboardingTour({ onPageChange }: { onPageChange?: (page: string) => void }) {
  const [runTour, setRunTour] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklist, setChecklist] = useState<OnboardingStep[]>([
    { id: "profile", title: "Completar perfil", completed: false, icon: CheckCircle2 },
    { id: "search", title: "Fazer primeira pesquisa Casafari", completed: false, icon: Search },
    { id: "lead", title: "Ver detalhes de um lead", completed: false, icon: Eye },
    { id: "ai", title: "Testar Assistente IA", completed: false, icon: Bot },
  ]);

  useEffect(() => {
    try {
      const onboardingStatus = localStorage.getItem(ONBOARDING_KEY);
      const savedChecklist = localStorage.getItem(CHECKLIST_KEY);
      
      if (savedChecklist) {
        try {
          const parsed = JSON.parse(savedChecklist);
          if (Array.isArray(parsed)) {
            setChecklist(parsed);
          }
        } catch {}
      }
      
      if (!onboardingStatus) {
        setShowChecklist(true);
        setTimeout(() => setRunTour(true), 500);
      } else if (onboardingStatus === "tour_skipped" || onboardingStatus === "tour_completed") {
        setShowChecklist(true);
      } else if (onboardingStatus === "dismissed" || onboardingStatus === "skipped") {
        setShowChecklist(false);
        setRunTour(false);
      }
    } catch (e) {
      console.warn("Error loading onboarding state:", e);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '[data-testid="sidebar-overview"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Bem-vindo ao ImoLead AI Pro!</h3>
          <p>Este é o seu painel de controlo. Aqui pode ver estatísticas e o resumo dos seus leads.</p>
        </div>
      ),
      placement: "right",
      disableBeacon: true,
    },
    {
      target: '[data-testid="sidebar-leads"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Gestão de Leads</h3>
          <p>Visualize, filtre e gerencie todos os seus leads num só lugar.</p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[data-testid="sidebar-casafari"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Pesquisa Casafari</h3>
          <p>Pesquise imóveis no Casafari e capte leads automaticamente com análise de IA.</p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[data-testid="sidebar-ai"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Assistente IA</h3>
          <p>Use a inteligência artificial para analisar leads, gerar mensagens e obter insights do mercado.</p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[data-testid="sidebar-messages"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">CRM Pro</h3>
          <p>Gerencie comunicações, crie templates e acompanhe o histórico de interações com cada lead.</p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[data-testid="sidebar-settings"]',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Definições</h3>
          <p>Configure o seu perfil, integrações e preferências de notificação.</p>
        </div>
      ),
      placement: "right",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      if (status === STATUS.FINISHED) {
        localStorage.setItem(ONBOARDING_KEY, "tour_completed");
      } else if (status === STATUS.SKIPPED) {
        localStorage.setItem(ONBOARDING_KEY, "tour_skipped");
      }
    }
  };

  const completeStep = (stepId: string) => {
    const updatedChecklist = checklist.map(item => 
      item.id === stepId ? { ...item, completed: true } : item
    );
    setChecklist(updatedChecklist);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(updatedChecklist));
    
    if (stepId === "search" && onPageChange) {
      onPageChange("casafari");
    } else if (stepId === "lead" && onPageChange) {
      onPageChange("leads");
    } else if (stepId === "ai" && onPageChange) {
      onPageChange("ai");
    } else if (stepId === "profile" && onPageChange) {
      onPageChange("settings");
    }
  };

  const skipTour = () => {
    setRunTour(false);
    localStorage.setItem(ONBOARDING_KEY, "skipped");
  };

  const dismissChecklist = () => {
    setShowChecklist(false);
    setRunTour(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "dismissed");
    } catch (e) {
      console.warn("Could not save onboarding state:", e);
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;
  const allCompleted = completedCount === checklist.length;

  if (!showChecklist && !runTour) return null;
  if (allCompleted) return null;

  return (
    <>
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "hsl(var(--primary))",
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
            padding: 16,
          },
          tooltipContent: {
            padding: "8px 0",
          },
          buttonNext: {
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            borderRadius: 6,
            padding: "8px 16px",
          },
          buttonBack: {
            color: "hsl(var(--muted-foreground))",
            marginRight: 8,
          },
          buttonSkip: {
            color: "hsl(var(--muted-foreground))",
          },
        }}
        locale={{
          back: "Anterior",
          close: "Fechar",
          last: "Concluir",
          next: "Próximo",
          skip: "Saltar tour",
        }}
      />

      {showChecklist && !runTour && (
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent" data-testid="onboarding-checklist">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Primeiros passos</CardTitle>
                  <p className="text-sm text-muted-foreground">{completedCount}/{checklist.length} passos completados</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={dismissChecklist}
                data-testid="button-dismiss-onboarding"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {checklist.map((step) => (
                <Button
                  key={step.id}
                  variant={step.completed ? "secondary" : "outline"}
                  className={`justify-start gap-2 h-auto py-3 px-4 ${step.completed ? "opacity-60" : ""}`}
                  onClick={() => !step.completed && completeStep(step.id)}
                  disabled={step.completed}
                  data-testid={`onboarding-step-${step.id}`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={step.completed ? "line-through" : ""}>{step.title}</span>
                </Button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRunTour(true)}
                data-testid="button-restart-tour"
              >
                Ver tour guiado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export function useOnboardingProgress() {
  const completeStep = (stepId: string) => {
    const saved = localStorage.getItem(CHECKLIST_KEY);
    if (saved) {
      try {
        const checklist = JSON.parse(saved);
        const updated = checklist.map((item: OnboardingStep) => 
          item.id === stepId ? { ...item, completed: true } : item
        );
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(updated));
      } catch {}
    }
  };

  return { completeStep };
}
