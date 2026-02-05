import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("cookieConsent", "dismissed");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-md">
      <Card className="shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10 shrink-0">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-sm">Cookies Essenciais</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Utilizamos apenas cookies essenciais para o funcionamento da plataforma 
                  (sessao e preferencias). Nao usamos cookies de rastreamento ou publicidade.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  onClick={handleAccept}
                  data-testid="button-accept-cookies"
                >
                  Aceitar
                </Button>
                <Link href="/privacidade">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-xs"
                  >
                    Saber mais
                  </Button>
                </Link>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 h-6 w-6"
              onClick={handleDismiss}
              data-testid="button-dismiss-cookies"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
