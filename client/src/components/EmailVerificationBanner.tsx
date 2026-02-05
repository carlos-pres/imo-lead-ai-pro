import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EmailVerificationBanner() {
  const { customer, isEmailVerified, token } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (isEmailVerified || isDismissed || !customer) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        toast({
          title: "Email enviado",
          description: data.emailSent 
            ? "Verifique a sua caixa de entrada para o link de verificação."
            : "O serviço de email não está configurado. Contacte o suporte.",
        });
      } else if (response.status === 429) {
        toast({
          title: "Aguarde",
          description: data.error || "Aguarde alguns minutos antes de solicitar novo email.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível enviar o email de verificação.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de ligação. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="mb-4 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <span className="font-medium">Verifique o seu email</span>
            <span className="hidden sm:inline"> - Enviámos um link de verificação para <strong>{customer.email}</strong>. Por favor, verifique a sua caixa de entrada para ativar a sua conta.</span>
            <span className="sm:hidden"> - Verifique a sua caixa de entrada.</span>
          </AlertDescription>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {resendSuccess ? (
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Enviado</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              disabled={isResending}
              className="border-amber-500/50 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              data-testid="button-resend-verification"
            >
              {isResending ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Reenviar</span>
                </>
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/30"
            data-testid="button-dismiss-verification-banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}
