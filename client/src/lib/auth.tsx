import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { Customer } from "@shared/schema";

interface AuthContextType {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  hasPaidPlan: boolean;
  isProPlan: boolean;
  isAdminDemo: boolean;
  isEmailVerified: boolean;
  login: (token: string, customer: Customer) => void;
  logout: () => void;
  updateCustomer: (customer: Customer) => void;
  enableAdminDemo: () => void;
  disableAdminDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminDemo, setIsAdminDemo] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("authToken");
      const storedCustomer = localStorage.getItem("customer");
      const storedAdminDemo = localStorage.getItem("adminDemoMode");
      
      if (storedAdminDemo === "true") {
        setIsAdminDemo(true);
      }
      
      if (storedToken) {
        try {
          // Verify token and get fresh customer data from server
          const response = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: storedToken }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.valid && data.customer) {
              // Update with fresh customer data from server (includes plan)
              const freshCustomer = data.customer as Customer;
              localStorage.setItem("customer", JSON.stringify(freshCustomer));
              setToken(storedToken);
              setCustomer(freshCustomer);
              setIsLoading(false);
              return;
            }
          }
          
          // Token invalid - clear storage
          localStorage.removeItem("authToken");
          localStorage.removeItem("customer");
        } catch {
          // Network error - use cached data if available
          if (storedCustomer) {
            try {
              const parsed = JSON.parse(storedCustomer);
              setToken(storedToken);
              setCustomer(parsed);
            } catch {
              localStorage.removeItem("authToken");
              localStorage.removeItem("customer");
            }
          }
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = useCallback((newToken: string, newCustomer: Customer) => {
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("customer", JSON.stringify(newCustomer));
    setToken(newToken);
    setCustomer(newCustomer);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("customer");
    localStorage.removeItem("adminDemoMode");
    setToken(null);
    setCustomer(null);
    setIsAdminDemo(false);
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    localStorage.setItem("customer", JSON.stringify(updatedCustomer));
    setCustomer(updatedCustomer);
  }, []);

  const enableAdminDemo = useCallback(() => {
    localStorage.setItem("adminDemoMode", "true");
    setIsAdminDemo(true);
  }, []);

  const disableAdminDemo = useCallback(() => {
    localStorage.removeItem("adminDemoMode");
    setIsAdminDemo(false);
  }, []);

  // Calculate trial status
  const trialInfo = useMemo(() => {
    // Admin demo mode has full access (Pro features)
    if (isAdminDemo) {
      return { isTrialActive: true, trialDaysRemaining: 999, hasPaidPlan: true, isProPlan: true };
    }
    
    if (!customer) {
      return { isTrialActive: false, trialDaysRemaining: 0, hasPaidPlan: false, isProPlan: false };
    }

    const hasPaidPlan = customer.plan === "basic" || customer.plan === "pro";
    const isProPlan = customer.plan === "pro";
    
    if (hasPaidPlan) {
      return { isTrialActive: false, trialDaysRemaining: 0, hasPaidPlan: true, isProPlan };
    }

    if (customer.trialEndsAt) {
      const trialEnd = new Date(customer.trialEndsAt);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        isTrialActive: diffDays > 0,
        trialDaysRemaining: Math.max(0, diffDays),
        hasPaidPlan: false,
        isProPlan: false,
      };
    }

    // For older accounts without trial info, give them full trial
    return { isTrialActive: true, trialDaysRemaining: 7, hasPaidPlan: false, isProPlan: false };
  }, [customer, isAdminDemo]);

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        isAuthenticated: !!token && !!customer,
        isLoading,
        isTrialActive: trialInfo.isTrialActive,
        trialDaysRemaining: trialInfo.trialDaysRemaining,
        hasPaidPlan: trialInfo.hasPaidPlan,
        isProPlan: trialInfo.isProPlan,
        isAdminDemo,
        isEmailVerified: customer?.emailVerified || false,
        login,
        logout,
        updateCustomer,
        enableAdminDemo,
        disableAdminDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isTrialActive, trialDaysRemaining, hasPaidPlan, isAdminDemo } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  // Admin demo mode bypasses authentication
  if (!isAuthenticated && !isAdminDemo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-6">
            Precisa de iniciar sessão para aceder a esta página.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/login" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              data-testid="link-login-redirect"
            >
              Iniciar Sessão
            </a>
            <a 
              href="/cadastro" 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              data-testid="link-register-redirect"
            >
              Criar Conta Grátis
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Experimente grátis durante 7 dias, sem cartão de crédito.
          </p>
        </div>
      </div>
    );
  }

  // Check if trial has expired and user doesn't have a paid plan
  if (!hasPaidPlan && !isTrialActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mx-auto">
              <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Período de Teste Expirado</h2>
          <p className="text-muted-foreground mb-6">
            O seu período de 7 dias grátis terminou. Subscreva um plano para continuar a usar o ImoLead AI Pro.
          </p>
          <div className="flex flex-col gap-3">
            <a 
              href="/loja" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              data-testid="link-subscribe"
            >
              Ver Planos e Subscrever
            </a>
            <p className="text-sm text-muted-foreground">
              A partir de apenas <span className="font-semibold">€39/mês</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Trial banner component to show in dashboard
export function TrialBanner() {
  const { isTrialActive, trialDaysRemaining, hasPaidPlan } = useAuth();

  if (hasPaidPlan || !isTrialActive) {
    return null;
  }

  const urgentClass = trialDaysRemaining <= 2 
    ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800" 
    : "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800";
  
  const textClass = trialDaysRemaining <= 2
    ? "text-red-800 dark:text-red-200"
    : "text-amber-800 dark:text-amber-200";

  return (
    <div className={`border rounded-lg p-3 mb-4 ${urgentClass}`} data-testid="trial-banner">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className={`text-sm ${textClass}`}>
          {trialDaysRemaining === 1 
            ? "Último dia de teste grátis!" 
            : `Restam ${trialDaysRemaining} dias do seu período de teste grátis.`
          }
        </p>
        <a 
          href="/loja" 
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          data-testid="link-upgrade-from-banner"
        >
          Subscrever Agora
        </a>
      </div>
    </div>
  );
}
