import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { LogIn, UserPlus, Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "signup";
  redirectTo?: string;
}

export function AuthModal({ open, onOpenChange, defaultTab = "login", redirectTo = "/dashboard" }: AuthModalProps) {
  const { toast } = useToast();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    phone: "",
    company: "" 
  });

  const [trialExpired, setTrialExpired] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: typeof loginData) => {
      // Use fetch directly to handle response before throwing
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      const result = await response.json();
      
      // Check if response was not ok and has trialExpired flag
      if (!response.ok && result.trialExpired) {
        throw { ...result, isTrialExpired: true };
      }
      if (!response.ok) {
        throw new Error(result.error || "Email ou password incorretos");
      }
      return result;
    },
    onSuccess: (data) => {
      if (data.token && data.customer) {
        setTrialExpired(false);
        setLoginError(null);
        login(data.token, data.customer);
        toast({
          title: "Sessão iniciada!",
          description: "Bem-vindo de volta ao ImoLead AI Pro!",
        });
        onOpenChange(false);
        setLocation(redirectTo);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Email ou password incorretos.";
      setLoginError(errorMessage);
      
      if (error.isTrialExpired) {
        setTrialExpired(true);
        toast({
          title: "Período de teste expirado",
          description: "Enviámos um email com os detalhes para renovar a sua conta.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao iniciar sessão",
          description: error.message || "Email ou password incorretos.",
          variant: "destructive"
        });
      }
    }
  });

  const signupMutation = useMutation({
    mutationFn: async (data: typeof signupData) => {
      // Use fetch directly to handle response properly
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar conta");
      }
      return result;
    },
    onSuccess: (data) => {
      if (data.token && data.customer) {
        login(data.token, data.customer);
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo ao ImoLead AI Pro!",
        });
        onOpenChange(false);
        setLocation(redirectTo);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password.length < 6) {
      toast({
        title: "Password muito curta",
        description: "A password deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }
    signupMutation.mutate(signupData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aceder ao ImoLead AI Pro</DialogTitle>
          <DialogDescription>
            {activeTab === "signup" 
              ? "Crie uma conta grátis e experimente durante 7 dias sem compromisso."
              : "Inicie sessão para aceder ao seu painel de gestão de leads."
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="gap-2" data-testid="tab-login">
              <LogIn className="h-4 w-4" />
              Entrar
            </TabsTrigger>
            <TabsTrigger value="signup" className="gap-2" data-testid="tab-signup">
              <UserPlus className="h-4 w-4" />
              Criar Conta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            {trialExpired && (
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                  O seu período de teste expirou
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                  Para continuar a usar o ImoLead AI Pro, subscreva um dos nossos planos.
                </p>
                <Button 
                  type="button"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    setLocation('/loja');
                  }}
                  data-testid="button-go-to-store"
                >
                  Ver Planos
                </Button>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="joao@exemplo.pt"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  data-testid="input-modal-login-email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      setLocation('/esqueci-senha');
                    }}
                    className="text-sm text-primary hover:underline"
                    data-testid="link-modal-forgot-password"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="A sua password"
                  value={loginData.password}
                  onChange={(e) => {
                    setLoginData({ ...loginData, password: e.target.value });
                    setLoginError(null);
                  }}
                  required
                  data-testid="input-modal-login-password"
                />
              </div>
              {loginError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg" role="alert" data-testid="login-error-message">
                  <p className="text-sm text-destructive font-medium">{loginError}</p>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full gap-2" 
                disabled={loginMutation.isPending}
                data-testid="button-modal-login-submit"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A entrar...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome Completo *</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="João Silva"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  required
                  data-testid="input-modal-signup-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email *</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="joao@exemplo.pt"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                  data-testid="input-modal-signup-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password *</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                  data-testid="input-modal-signup-password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Telefone</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="912 345 678"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    data-testid="input-modal-signup-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Empresa</Label>
                  <Input
                    id="signup-company"
                    type="text"
                    placeholder="Imobiliária"
                    value={signupData.company}
                    onChange={(e) => setSignupData({ ...signupData, company: e.target.value })}
                    data-testid="input-modal-signup-company"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full gap-2" 
                disabled={signupMutation.isPending}
                data-testid="button-modal-signup-submit"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A criar conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Começar 7 Dias Grátis
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Sem cartão de crédito. Cancele quando quiser.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
