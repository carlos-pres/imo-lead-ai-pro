import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  UserX, 
  Lock,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Calendar,
  Eye,
  EyeOff,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: string;
  plan: string | null;
  trialEndsAt: string | null;
  createdAt: string;
}

export function AdminSection() {
  const { toast } = useToast();
  const { enableAdminDemo } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleEnterDemoMode = () => {
    enableAdminDemo();
    toast({
      title: "Modo Apresentação Ativado",
      description: "A redirecionar para o dashboard com dados de demonstração...",
    });
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 100);
  };

  // Verify stored token on mount
  const verifyStoredToken = async () => {
    const storedToken = localStorage.getItem("adminHomeToken");
    if (!storedToken) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: storedToken }),
      });
      const data = await response.json();
      
      if (data.valid) {
        setAdminToken(storedToken);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("adminHomeToken");
        setIsAuthenticated(false);
      }
    } catch {
      localStorage.removeItem("adminHomeToken");
      setIsAuthenticated(false);
    }
  };

  // Run verification on component mount
  useEffect(() => {
    verifyStoredToken();
  }, []);

  const { data: customers = [], isLoading, refetch } = useQuery<Customer[]>({
    queryKey: ["/api/admin/home/customers"],
    enabled: isAuthenticated === true && !!adminToken,
    queryFn: async () => {
      const response = await fetch("/api/admin/home/customers", {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const response = await fetch(`/api/admin/home/customers/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/home/customers"] });
      toast({
        title: "Estado atualizado",
        description: "O estado do utilizador foi alterado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o estado do utilizador",
        variant: "destructive",
      });
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const response = await apiRequest("POST", "/api/admin/auth", { password });
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem("adminHomeToken", data.token);
        setAdminToken(data.token);
        setIsAuthenticated(true);
        toast({
          title: "Acesso concedido",
          description: "Bem-vindo ao painel de administração",
        });
      }
    } catch (err) {
      toast({
        title: "Erro de autenticação",
        description: "Password incorreta",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
      setPassword("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminHomeToken");
    setAdminToken(null);
    setIsAuthenticated(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Ativo</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inativo</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string | null, trialEndsAt: string | null) => {
    if (plan === "trial" && trialEndsAt) {
      const daysLeft = differenceInDays(new Date(trialEndsAt), new Date());
      if (daysLeft <= 0) {
        return <Badge variant="destructive">Trial Expirado</Badge>;
      }
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{daysLeft} dias restantes</Badge>;
    }
    switch (plan) {
      case "basic":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Basic</Badge>;
      case "pro":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Pro</Badge>;
      default:
        return <Badge variant="outline">{plan || "N/A"}</Badge>;
    }
  };

  const toggleStatus = (customer: Customer) => {
    const newStatus = customer.status === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate({ id: customer.id, newStatus });
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <section id="admin" className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Painel de Administração
            </h2>
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section id="admin" className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Painel de Administração
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Introduza a password para aceder à gestão de utilizadores
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password de Administrador</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Introduza a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                      data-testid="input-admin-section-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoggingIn}
                  data-testid="button-admin-section-login"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      A verificar...
                    </>
                  ) : (
                    "Aceder ao Painel"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="admin" className="py-16 md:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Painel de Administração
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Gerencie os utilizadores registados e o seu estado
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Registados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.filter(c => c.status === "active").length}</p>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.filter(c => c.plan === "trial").length}</p>
                  <p className="text-sm text-muted-foreground">Em Trial</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Mode Button - Prominent placement */}
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-lg">Modo Apresentação</h3>
                <p className="text-sm text-muted-foreground">
                  Ver o dashboard com dados de demonstração para apresentações a clientes
                </p>
              </div>
              <Button 
                onClick={handleEnterDemoMode}
                size="lg"
                className="w-full sm:w-auto"
                data-testid="button-admin-demo-mode"
              >
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Modo Apresentação
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle>Utilizadores Registados</CardTitle>
              <CardDescription>Lista de todos os utilizadores com período de 7 dias grátis</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              data-testid="button-admin-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                      <TableHead className="hidden md:table-cell">Empresa</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="hidden sm:table-cell">Registado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum utilizador registado
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow key={customer.id} data-testid={`row-admin-customer-${customer.id}`}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground hidden sm:block" />
                              <span className="truncate max-w-[150px]">{customer.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {customer.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {customer.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {customer.company ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {customer.company}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getPlanBadge(customer.plan, customer.trialEndsAt)}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: pt })}
                          </TableCell>
                          <TableCell>{getStatusBadge(customer.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={customer.status === "active" ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleStatus(customer)}
                              disabled={toggleStatusMutation.isPending}
                              data-testid={`button-toggle-${customer.id}`}
                            >
                              {customer.status === "active" ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Desativar</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Ativar</span>
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            Fechar Painel Admin
          </Button>
        </div>
      </div>
    </section>
  );
}
