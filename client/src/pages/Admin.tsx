import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Euro, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  Search,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Landmark,
  Lock,
  LogOut,
  Shield,
  Play,
  LayoutDashboard,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  taxId: string | null;
  status: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  planName: string;
  price: number;
  currency: string;
  billingCycle: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

interface Payment {
  id: string;
  customerId: string | null;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentMethodDetails: any;
  description: string | null;
  invoiceNumber: string | null;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

interface DashboardStats {
  totalCustomers: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  totalRevenue: number;
  totalPayments: number;
  byMethod: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, number>;
  byMonth: Array<{ month: string; amount: number; count: number }>;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mbway: "MBWay",
  card: "Cartão",
  multibanco: "Multibanco",
  bank_transfer: "Transferência",
};

const PAYMENT_METHOD_ICONS: Record<string, typeof Smartphone> = {
  mbway: Smartphone,
  card: CreditCard,
  multibanco: Landmark,
  bank_transfer: Building2,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500",
  pending: "bg-yellow-500",
  failed: "bg-red-500",
  refunded: "bg-gray-500",
  active: "bg-green-500",
  cancelled: "bg-red-500",
  past_due: "bg-orange-500",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const ITEMS_PER_PAGE = 10;

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <div className="space-y-3 w-full px-4">
        <Skeleton className="h-40 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/admin/auth", { password });
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem("adminToken", data.token);
        onLogin(data.token);
        toast({
          title: "Login bem sucedido",
          description: "Bem-vindo ao painel de administração",
        });
      }
    } catch (err: any) {
      setError("Password incorreta");
      toast({
        title: "Erro de autenticação",
        description: "Password incorreta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Área de Administração</CardTitle>
            <CardDescription>
              Introduza a password de administrador para aceder ao painel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Introduza a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    data-testid="input-admin-password"
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading ? "A verificar..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const { enableAdminDemo, isAdminDemo } = useAuth();
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [paymentFilter, setPaymentFilter] = useState({
    status: "",
    paymentMethod: "",
    search: "",
  });
  const [paymentPage, setPaymentPage] = useState(1);
  const [subscriptionPage, setSubscriptionPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleEnterDemoMode = () => {
    enableAdminDemo();
    toast({
      title: "Modo Demo Ativado",
      description: "Agora pode apresentar o dashboard com todas as funcionalidades",
    });
    // Small delay to ensure state is updated before navigation
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 100);
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await apiRequest("POST", "/api/admin/verify", { token });
        const data = await response.json();
        setIsAuthenticated(data.valid === true);
        if (!data.valid) {
          localStorage.removeItem("adminToken");
        }
      } catch {
        setIsAuthenticated(false);
        localStorage.removeItem("adminToken");
      }
    };

    verifyToken();
  }, []);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    toast({
      title: "Sessão terminada",
      description: "Terminou a sessão com sucesso",
    });
  };

  const { data: dashboardStats, isLoading: loadingStats, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAuthenticated === true,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: customers = [], isLoading: loadingCustomers, refetch: refetchCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
    enabled: isAuthenticated === true,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: subscriptions = [], isLoading: loadingSubscriptions, refetch: refetchSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions"],
    enabled: isAuthenticated === true,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    enabled: isAuthenticated === true,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const handleRefreshAll = useCallback(() => {
    refetchStats();
    refetchPayments();
    refetchCustomers();
    refetchSubscriptions();
  }, [refetchStats, refetchPayments, refetchCustomers, refetchSubscriptions]);

  const clearFilters = useCallback(() => {
    setPaymentFilter({ status: "", paymentMethod: "", search: "" });
    setPaymentPage(1);
  }, []);

  const hasActiveFilters = paymentFilter.status || paymentFilter.paymentMethod || paymentFilter.search;

  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A verificar autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const filteredPayments = useMemo(() => {
    let result = payments.filter((payment) => {
      if (paymentFilter.status && paymentFilter.status !== "all" && payment.status !== paymentFilter.status) return false;
      if (paymentFilter.paymentMethod && paymentFilter.paymentMethod !== "all" && payment.paymentMethod !== paymentFilter.paymentMethod) return false;
      if (paymentFilter.search) {
        const searchLower = paymentFilter.search.toLowerCase();
        const customer = customers.find(c => c.id === payment.customerId);
        if (!customer?.name.toLowerCase().includes(searchLower) &&
            !customer?.email.toLowerCase().includes(searchLower) &&
            !payment.invoiceNumber?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[sortConfig.key];
        const bVal = (b as any)[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [payments, paymentFilter, customers, sortConfig]);

  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, paymentPage]);

  const totalPaymentPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);

  const paginatedSubscriptions = useMemo(() => {
    const start = (subscriptionPage - 1) * ITEMS_PER_PAGE;
    return subscriptions.slice(start, start + ITEMS_PER_PAGE);
  }, [subscriptions, subscriptionPage]);

  const totalSubscriptionPages = Math.ceil(subscriptions.length / ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * ITEMS_PER_PAGE;
    return customers.slice(start, start + ITEMS_PER_PAGE);
  }, [customers, customerPage]);

  const totalCustomerPages = Math.ceil(customers.length / ITEMS_PER_PAGE);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return "N/A";
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Desconhecido";
  };

  const getPaymentMethodIcon = (method: string) => {
    const Icon = PAYMENT_METHOD_ICONS[method] || CreditCard;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const colorClass = STATUS_COLORS[status] || "bg-gray-500";
    const labels: Record<string, string> = {
      completed: "Concluído",
      pending: "Pendente",
      failed: "Falhado",
      refunded: "Reembolsado",
      active: "Ativo",
      cancelled: "Cancelado",
      past_due: "Em atraso",
    };
    return (
      <Badge className={`${colorClass} text-white`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const chartData = dashboardStats?.byMonth.map(item => ({
    name: format(new Date(item.month + "-01"), "MMM", { locale: pt }),
    receita: item.amount / 100,
    pagamentos: item.count,
  })) || [];

  const methodChartData = dashboardStats?.byMethod
    ? Object.entries(dashboardStats.byMethod).map(([method, data]) => ({
        name: PAYMENT_METHOD_LABELS[method] || method,
        value: data.amount / 100,
        count: data.count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Painel de Administração</h1>
            <p className="text-muted-foreground">
              Monitorize pagamentos, subscrições e clientes
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleEnterDemoMode}
              data-testid="button-enter-demo"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Modo Apresentação
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefreshAll}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              data-testid="button-admin-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <TrendingUp className="h-4 w-4 mr-2" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">
              <Euro className="h-4 w-4 mr-2" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
              <Calendar className="h-4 w-4 mr-2" />
              Subscrições
            </TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers">
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loadingStats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <ChartSkeleton />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-56" />
                    </CardHeader>
                    <CardContent>
                      <ChartSkeleton />
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                      <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-mrr">
                        {formatCurrency(dashboardStats?.monthlyRecurringRevenue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        MRR (receita recorrente mensal)
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-total-revenue">
                        {formatCurrency(dashboardStats?.totalRevenue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dashboardStats?.totalPayments || 0} pagamentos processados
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium">Subscritores Ativos</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-active-subscriptions">
                        {dashboardStats?.activeSubscriptions || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dashboardStats?.totalCustomers || 0} clientes totais
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-success-rate">
                        {dashboardStats?.byStatus?.completed && dashboardStats?.totalPayments
                          ? Math.round((dashboardStats.byStatus.completed / dashboardStats.totalPayments) * 100)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dashboardStats?.byStatus?.failed || 0} pagamentos falhados
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Receita Mensal</CardTitle>
                      <CardDescription>Evolução da receita nos últimos meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value * 100)}
                            labelStyle={{ color: "black" }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="receita" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: "#3b82f6" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Métodos de Pagamento</CardTitle>
                      <CardDescription>Distribuição por método de pagamento</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={methodChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {methodChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                  <CardDescription>
                    {filteredPayments.length} pagamentos encontrados
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(filteredPayments, "pagamentos")}
                  disabled={filteredPayments.length === 0}
                  data-testid="button-export-payments"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por cliente ou fatura..."
                      className="pl-10"
                      value={paymentFilter.search}
                      onChange={(e) => {
                        setPaymentFilter({ ...paymentFilter, search: e.target.value });
                        setPaymentPage(1);
                      }}
                      data-testid="input-payment-search"
                    />
                  </div>
                  <Select
                    value={paymentFilter.status}
                    onValueChange={(value) => {
                      setPaymentFilter({ ...paymentFilter, status: value });
                      setPaymentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-payment-status">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="failed">Falhado</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={paymentFilter.paymentMethod}
                    onValueChange={(value) => {
                      setPaymentFilter({ ...paymentFilter, paymentMethod: value });
                      setPaymentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-payment-method">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="mbway">MBWay</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="multibanco">Multibanco</SelectItem>
                      <SelectItem value="bank_transfer">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>

                {loadingPayments ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('createdAt')}
                            >
                              <div className="flex items-center gap-1">
                                Data
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('amount')}
                            >
                              <div className="flex items-center gap-1">
                                Valor
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fatura</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPayments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Nenhum pagamento encontrado
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedPayments.map((payment) => (
                            <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                              <TableCell>
                                {format(new Date(payment.createdAt), "dd/MM/yyyy", { locale: pt })}
                              </TableCell>
                              <TableCell className="font-medium">
                                {getCustomerName(payment.customerId)}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {payment.description || "Sem descrição"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getPaymentMethodIcon(payment.paymentMethod)}
                                  <span>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(payment.amount)}
                              </TableCell>
                              <TableCell>{getStatusBadge(payment.status)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {payment.invoiceNumber || "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPaymentPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {paymentPage} de {totalPaymentPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
                          disabled={paymentPage === 1}
                          data-testid="button-prev-payment-page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentPage(p => Math.min(totalPaymentPages, p + 1))}
                          disabled={paymentPage === totalPaymentPages}
                          data-testid="button-next-payment-page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Subscrições</CardTitle>
                  <CardDescription>{subscriptions.length} subscrições registadas</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(subscriptions, "subscricoes")}
                  disabled={subscriptions.length === 0}
                  data-testid="button-export-subscriptions"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                {loadingSubscriptions ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : (
                  <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Ciclo</TableHead>
                          <TableHead>Período Atual</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSubscriptions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Nenhuma subscrição encontrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedSubscriptions.map((subscription) => (
                            <TableRow key={subscription.id} data-testid={`row-subscription-${subscription.id}`}>
                              <TableCell className="font-medium">
                                {getCustomerName(subscription.customerId)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{subscription.planName}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(subscription.price)}
                              </TableCell>
                              <TableCell>
                                {subscription.billingCycle === "monthly" ? "Mensal" : "Anual"}
                              </TableCell>
                              <TableCell>
                                {format(new Date(subscription.currentPeriodStart), "dd/MM", { locale: pt })} - {format(new Date(subscription.currentPeriodEnd), "dd/MM/yyyy", { locale: pt })}
                              </TableCell>
                              <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {totalSubscriptionPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {subscriptionPage} de {totalSubscriptionPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSubscriptionPage(p => Math.max(1, p - 1))}
                          disabled={subscriptionPage === 1}
                          data-testid="button-prev-sub-page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSubscriptionPage(p => Math.min(totalSubscriptionPages, p + 1))}
                          disabled={subscriptionPage === totalSubscriptionPages}
                          data-testid="button-next-sub-page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Clientes</CardTitle>
                  <CardDescription>{customers.length} clientes registados</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(customers, "clientes")}
                  disabled={customers.length === 0}
                  data-testid="button-export-customers"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                {loadingCustomers ? (
                  <TableSkeleton rows={5} cols={7} />
                ) : (
                  <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>NIF</TableHead>
                          <TableHead>Desde</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCustomers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Nenhum cliente encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedCustomers.map((customer) => (
                            <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                              <TableCell className="font-medium">{customer.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  {customer.email}
                                </div>
                              </TableCell>
                              <TableCell>
                                {customer.phone ? (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {customer.phone}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {customer.company ? (
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    {customer.company}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>{customer.taxId || "-"}</TableCell>
                              <TableCell>
                                {format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: pt })}
                              </TableCell>
                              <TableCell>{getStatusBadge(customer.status)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {totalCustomerPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {customerPage} de {totalCustomerPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                          disabled={customerPage === 1}
                          data-testid="button-prev-customer-page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomerPage(p => Math.min(totalCustomerPages, p + 1))}
                          disabled={customerPage === totalCustomerPages}
                          data-testid="button-next-customer-page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
