import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";

interface NavigationHeaderProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export function NavigationHeader({ onLoginClick, onSignupClick }: NavigationHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, customer, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">IL</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline">ImoLead AI Pro</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#funcionalidades" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-features">
                Funcionalidades
              </a>
              <a href="#precos" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-pricing">
                Preços
              </a>
              <a href="#contacto" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-contact">
                Contacto
              </a>
              {isAuthenticated && (
                <>
                  <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-dashboard">
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Olá, {customer?.name?.split(' ')[0]}
                </span>
                <Link href="/dashboard">
                  <Button size="sm" data-testid="button-nav-dashboard">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  data-testid="button-nav-logout"
                >
                  Sair
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLoginClick}
                  className="gap-2"
                  data-testid="button-nav-login"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar
                </Button>
                <Button 
                  size="sm" 
                  onClick={onSignupClick}
                  className="gap-2"
                  data-testid="button-nav-signup"
                >
                  <UserPlus className="h-4 w-4" />
                  Criar Conta
                </Button>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-4">
            <a href="#funcionalidades" className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md" data-testid="link-mobile-features">
              Funcionalidades
            </a>
            <a href="#precos" className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md" data-testid="link-mobile-pricing">
              Preços
            </a>
            <a href="#contacto" className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md" data-testid="link-mobile-contact">
              Contacto
            </a>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md" data-testid="link-mobile-dashboard">
                  Dashboard
                </Link>
                <div className="px-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={logout}
                    data-testid="button-mobile-logout"
                  >
                    Sair
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="px-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mb-2 gap-2" 
                    onClick={() => { setMobileMenuOpen(false); onLoginClick?.(); }}
                    data-testid="button-mobile-login"
                  >
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Button>
                </div>
                <div className="px-4">
                  <Button 
                    size="sm" 
                    className="w-full gap-2" 
                    onClick={() => { setMobileMenuOpen(false); onSignupClick?.(); }}
                    data-testid="button-mobile-signup"
                  >
                    <UserPlus className="h-4 w-4" />
                    Criar Conta
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
