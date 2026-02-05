import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  onStartClick?: () => void;
}

export function CTASection({ onStartClick }: CTASectionProps) {
  return (
    <section className="py-20 md:py-24 lg:py-32 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
          Pronto para Transformar o Seu Negócio Imobiliário?
        </h2>
        <p className="text-xl mb-8 text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
          Junte-se a centenas de profissionais que já automatizaram a prospeção 
          e multiplicaram os seus resultados com IA.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary"
            className="px-8 py-6 text-lg"
            onClick={onStartClick}
            data-testid="button-cta-final-start"
          >
            Começar Teste Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="px-8 py-6 text-lg border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-cta-final-demo"
          >
            Agendar Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
