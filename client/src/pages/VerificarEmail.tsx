import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

export default function VerificarEmail() {
  const [, setLocation] = useLocation();
  const { customer, updateCustomer, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'pending' | 'loading' | 'success' | 'error' | 'resend'>('pending');
  const [message, setMessage] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      setStatus('error');
      setMessage('Token de verificação em falta. Por favor, utilize o link enviado no seu email.');
    } else {
      setToken(tokenParam);
    }
  }, []);

  const handleVerifyEmail = async () => {
    if (!token) return;
    
    setStatus('loading');
    
    try {
      const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('O seu email foi verificado com sucesso! A sua conta está agora ativa.');
        
        if (customer && isAuthenticated) {
          updateCustomer({
            ...customer,
            emailVerified: true,
            emailVerifiedAt: new Date(),
          });
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Erro ao verificar email. Por favor, tente novamente.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro de ligação. Por favor, verifique a sua internet e tente novamente.');
    }
  };

  const handleResendEmail = async () => {
    if (!resendEmail.trim()) {
      setResendMessage('Por favor, introduza o seu email.');
      return;
    }
    
    setResendLoading(true);
    setResendMessage('');
    
    try {
      const response = await fetch('/api/auth/resend-verification-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.alreadyVerified) {
          setResendMessage('O seu email já está verificado! Pode fazer login.');
        } else {
          setResendMessage(data.message || 'Email enviado! Verifique a sua caixa de entrada.');
        }
      } else {
        setResendMessage(data.error || 'Erro ao enviar email.');
      }
    } catch (error) {
      setResendMessage('Erro de ligação. Tente novamente.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            {status === 'pending' && (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" data-testid="icon-pending" />
              </div>
            )}
            {status === 'loading' && (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" data-testid="icon-loading" />
              </div>
            )}
            {status === 'success' && (
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" data-testid="icon-success" />
              </div>
            )}
            {status === 'error' && (
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" data-testid="icon-error" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl" data-testid="text-title">
            {status === 'pending' && 'Confirmar Email'}
            {status === 'loading' && 'A verificar email...'}
            {status === 'success' && 'Email Verificado!'}
            {status === 'error' && 'Erro na Verificação'}
          </CardTitle>
          
          <CardDescription className="text-base" data-testid="text-message">
            {status === 'pending' && 'Clique no botão abaixo para confirmar o seu endereço de email.'}
            {status === 'loading' && 'A processar o seu pedido de verificação...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'pending' && token && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      Verificação de Segurança
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Ao confirmar, irá ativar a sua conta e poderá aceder a todas as funcionalidades do ImoLead AI Pro.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleVerifyEmail}
                data-testid="button-confirm-email"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirmar Email
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setLocation('/')}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                      Conta ativada com sucesso
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Pode agora aceder a todas as funcionalidades da plataforma ImoLead AI Pro.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setLocation('/dashboard')}
                data-testid="button-go-dashboard"
              >
                Ir para o Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                      Não foi possível verificar o email
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      O link pode ter expirado ou já foi utilizado.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <RefreshCw className="h-4 w-4" />
                  Solicitar novo email de verificação
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resend-email">O seu email</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    data-testid="input-resend-email"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  data-testid="button-resend-email"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A enviar...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar novo link
                    </>
                  )}
                </Button>
                {resendMessage && (
                  <p className={`text-sm ${resendMessage.includes('erro') || resendMessage.includes('Erro') ? 'text-red-600' : 'text-green-600'}`} data-testid="text-resend-message">
                    {resendMessage}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  className="w-full" 
                  onClick={() => setLocation('/dashboard')}
                  data-testid="button-go-dashboard-error"
                >
                  Ir para o Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setLocation('/')}
                  data-testid="button-go-home"
                >
                  Voltar ao início
                </Button>
              </div>
            </>
          )}

          {status === 'loading' && (
            <p className="text-center text-sm text-muted-foreground">
              Por favor, aguarde enquanto verificamos o seu email...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
