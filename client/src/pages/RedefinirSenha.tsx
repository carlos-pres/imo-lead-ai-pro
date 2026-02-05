import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RedefinirSenha() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [message, setMessage] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasVerified = useRef(false);
  const token = useRef<string | null>(null);

  useEffect(() => {
    if (hasVerified.current) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    token.current = urlParams.get('token');

    if (!token.current) {
      setStatus('invalid');
      setMessage('Token de recuperação em falta. Por favor, utilize o link enviado no seu email.');
      return;
    }

    const verifyToken = async () => {
      hasVerified.current = true;
      
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token.current!)}`);
        const data = await response.json();

        if (data.success) {
          setStatus('valid');
        } else {
          setStatus('invalid');
          setMessage(data.error || 'Token inválido ou expirado.');
        }
      } catch (error) {
        setStatus('invalid');
        setMessage('Erro de ligação. Por favor, tente novamente.');
      }
    };

    verifyToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.current, password })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('A sua senha foi alterada com sucesso!');
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao alterar senha",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de ligação. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {status === 'loading' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl">A Verificar...</CardTitle>
              <CardDescription>A validar o seu pedido de recuperação</CardDescription>
            </CardHeader>
          </>
        )}

        {status === 'invalid' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Link Inválido</CardTitle>
              <CardDescription className="mt-2">{message}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => setLocation("/esqueci-senha")}
                  className="w-full"
                  data-testid="button-request-new"
                >
                  Solicitar Novo Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/login")}
                  className="w-full"
                  data-testid="button-back-login"
                >
                  Voltar ao Login
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {status === 'valid' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
              <CardDescription>Introduza a sua nova senha</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirme a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    data-testid="input-confirm-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  data-testid="button-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A alterar...
                    </>
                  ) : (
                    "Alterar Senha"
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {status === 'success' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Senha Alterada</CardTitle>
              <CardDescription className="mt-2">{message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation("/login")}
                className="w-full"
                data-testid="button-go-login"
              >
                Ir para o Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
