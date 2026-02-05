import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, MessageSquare } from "lucide-react";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 p-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
            <XCircle className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Pagamento cancelado</CardTitle>
          <CardDescription>
            O processo de pagamento foi interrompido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Não foi efectuada qualquer cobrança. Pode tentar novamente quando quiser 
              ou contactar-nos se tiver alguma dúvida.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Precisa de ajuda? A nossa equipa está disponível para esclarecer qualquer questão.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link href="/loja" className="w-full">
            <Button className="w-full gap-2" data-testid="button-retry-checkout">
              <ArrowLeft className="h-4 w-4" />
              Voltar à loja
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full gap-2" data-testid="button-contact-support">
              <MessageSquare className="h-4 w-4" />
              Contactar suporte
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
