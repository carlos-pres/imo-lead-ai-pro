import { Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import { CookieConsent } from "@/components/CookieConsent";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import Store from "@/pages/Store";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import Privacidade from "@/pages/Privacidade";
import Termos from "@/pages/Termos";
import Seguranca from "@/pages/Seguranca";
import VerificarEmail from "@/pages/VerificarEmail";
import EsqueciSenha from "@/pages/EsqueciSenha";
import RedefinirSenha from "@/pages/RedefinirSenha";
import NotFound from "@/pages/not-found";
import InvestorPitch from "@/pages/InvestorPitch";

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    </div>
  );
}

function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={ProtectedDashboard} />
        <Route path="/dashboard/:page" component={ProtectedDashboard} />
        <Route path="/admin" component={Admin} />
        <Route path="/loja" component={Store} />
        <Route path="/pricing" component={Store} />
        <Route path="/precos" component={Store} />
        <Route path="/cadastro" component={Register} />
        <Route path="/register" component={Register} />
        <Route path="/registo" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/privacidade" component={Privacidade} />
        <Route path="/politica-privacidade" component={Privacidade} />
        <Route path="/privacy-policy" component={Privacidade} />
        <Route path="/termos" component={Termos} />
        <Route path="/termos-servico" component={Termos} />
        <Route path="/terms-of-service" component={Termos} />
        <Route path="/seguranca" component={Seguranca} />
        <Route path="/security" component={Seguranca} />
        <Route path="/store" component={Store} />
        <Route path="/investor" component={InvestorPitch} />
        <Route path="/investidor" component={InvestorPitch} />
        <Route path="/verificar-email" component={VerificarEmail} />
        <Route path="/esqueci-senha" component={EsqueciSenha} />
        <Route path="/forgot-password" component={EsqueciSenha} />
        <Route path="/redefinir-senha" component={RedefinirSenha} />
        <Route path="/reset-password" component={RedefinirSenha} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <NetworkStatus />
            <CookieConsent />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
