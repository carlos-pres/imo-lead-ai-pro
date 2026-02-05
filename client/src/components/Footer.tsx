import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">IL</span>
              </div>
              <span className="font-bold">ImoLead AI Pro</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Automatização inteligente para profissionais imobiliários em Portugal.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-social-instagram">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-social-linkedin">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Funcionalidades</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Web Scraping</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">IA & Automação</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Relatórios</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Integrações</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/termos" className="hover:text-foreground transition-colors" data-testid="link-terms">Termos de Servico</a></li>
              <li><a href="/privacidade" className="hover:text-foreground transition-colors" data-testid="link-privacy">Politica de Privacidade</a></li>
              <li><a href="/seguranca" className="hover:text-foreground transition-colors" data-testid="link-security">Seguranca</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Receba dicas e novidades sobre automação imobiliária.
            </p>
            <div className="flex gap-2">
              <Input placeholder="seu@email.pt" type="email" data-testid="input-newsletter" />
              <Button size="sm" data-testid="button-newsletter-submit">Subscrever</Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 ImoLead AI Pro. Todos os direitos reservados.
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <span className="font-semibold">SHALON SOLUÇÕES TECNOLÓGICAS</span> · Deus seja louvado!
          </p>
        </div>
      </div>
    </footer>
  );
}
