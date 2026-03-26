import React from 'react';
import { Menu, X } from 'lucide-react';

interface NavItem {
  label: string;
  onClick: () => void;
}

interface LandingNavbarProps {
  onLoginClick: () => void;
  navItems: NavItem[];
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onLoginClick, navItems }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black-950/80 backdrop-blur-lg border-b border-gold-500/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center text-black-900 font-bold text-sm">
              IL
            </div>
            <div>
              <div className="font-bold text-white">ImoLead AI Pro</div>
              <div className="text-xs text-gold-400">Automação inteligente</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="text-slate-300 hover:text-gold-400 transition-colors text-sm font-semibold"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:block">
            <button
              onClick={onLoginClick}
              className="px-6 py-2 rounded-lg bg-gradient-gold text-black-900 font-semibold text-sm hover:shadow-lg hover:shadow-gold-500/30 transition-all"
            >
              Entrar
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-gold-500/20 pt-4">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="block w-full text-left text-slate-300 hover:text-gold-400 transition-colors text-sm font-semibold py-2"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                onLoginClick();
                setIsOpen(false);
              }}
              className="w-full mt-4 px-6 py-2 rounded-lg bg-gradient-gold text-black-900 font-semibold text-sm hover:shadow-lg hover:shadow-gold-500/30 transition-all"
            >
              Entrar
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
