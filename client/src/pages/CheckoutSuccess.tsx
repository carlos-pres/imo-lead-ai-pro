import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-4 rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Pagamento confirmado!</CardTitle>
          <CardDescription>
            A sua subscrição foi activada com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">ImoLead AI Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Obrigado por escolher o ImoLead AI Pro. A sua conta está agora activa 
              e pode começar a usar todas as funcionalidades.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Enviámos um email de confirmação com os detalhes da sua subscrição.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full gap-2" data-testid="button-goto-dashboard">
              Ir para o Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full" data-testid="button-goto-home">
              Voltar à página inicial
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
