import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import heroImage from "@assets/generated_images/Hero_real_estate_professional_4e9cdb7c.png";

interface HeroSectionProps {
  onStartClick?: () => void;
  onDemoClick?: () => void;
}

export function HeroSection({ onStartClick, onDemoClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6">
            Automatize a Prospeção Imobiliária com IA
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
            ImoLead AI Pro encontra, qualifica e contacta leads automaticamente. 
            Poupe tempo e foque-se no que realmente importa: fechar negócios.
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg bg-primary hover:bg-primary/90 backdrop-blur-md"
              onClick={onStartClick}
              data-testid="button-cta-start"
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg border-white/40 text-white hover:bg-white/10 backdrop-blur-md"
              onClick={onDemoClick}
              data-testid="button-cta-demo"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">10.000+ Leads Prospectados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Classificação Automática com IA</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Relatórios Diários</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
