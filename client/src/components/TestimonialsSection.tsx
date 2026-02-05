import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import testimonialMale from "@assets/generated_images/Testimonial_avatar_male_4c10ae52.png";
import testimonialFemale from "@assets/generated_images/Testimonial_avatar_female_985b2288.png";

const testimonials = [
  {
    quote: "O ImoLead AI Pro transformou completamente a minha forma de trabalhar. Antes passava horas a procurar leads manualmente. Agora o sistema faz tudo automaticamente e eu foco-me apenas nos leads quentes.",
    author: "João Silva",
    role: "Consultor Imobiliário",
    company: "RE/MAX Lisboa",
    avatar: testimonialMale,
    initials: "JS"
  },
  {
    quote: "A classificação automática com IA é impressionante. O sistema identifica leads com alto potencial de conversão com uma precisão incrível. Aumentei as minhas vendas em 40% nos primeiros 3 meses.",
    author: "Ana Costa",
    role: "Mediadora Imobiliária",
    company: "Century 21 Porto",
    avatar: testimonialFemale,
    initials: "AC"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-24 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Profissionais Confiam no ImoLead AI Pro
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Junte-se a centenas de profissionais imobiliários que já automatizaram a sua prospeção.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-elevate active-elevate-2" data-testid={`card-testimonial-${index}`}>
              <CardContent className="pt-6">
                <p className="text-lg mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                    <AvatarFallback>{testimonial.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
