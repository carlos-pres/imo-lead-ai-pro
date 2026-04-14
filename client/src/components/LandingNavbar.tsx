import React from "react";
import { Menu, X } from "lucide-react";

interface NavItem {
  label: string;
  onClick: () => void;
}

interface LandingNavbarProps {
  onLoginClick: () => void;
  onCreateAccountClick?: () => void;
  navItems: NavItem[];
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLoginClick,
  onCreateAccountClick,
  navItems,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#1322371a] bg-white/90 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#174dbb] to-[#2e7df6] text-sm font-bold text-white">
              IL
            </div>
            <div>
              <div className="font-bold text-[#132237]">ImoLead AI Pro</div>
              <div className="text-xs text-[#174dbb]">AutomaÃ§Ã£o inteligente</div>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="text-sm font-semibold text-[#7a8698] transition-colors hover:text-[#174dbb]"
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden gap-3 md:flex">
            <button
              onClick={onLoginClick}
              className="rounded-lg px-6 py-2 text-sm font-semibold text-[#132237] transition-colors hover:text-[#174dbb]"
              type="button"
            >
              Entrar
            </button>
            <button
              onClick={onCreateAccountClick || onLoginClick}
              className="rounded-lg bg-gradient-to-r from-[#174dbb] to-[#2e7df6] px-6 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#174dbb20]"
              type="button"
            >
              Criar conta
            </button>
          </div>

          <button className="text-[#132237] md:hidden" onClick={() => setIsOpen(!isOpen)} type="button">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="mt-4 space-y-3 border-t border-[#1322371a] pb-4 pt-4 md:hidden">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="block w-full py-2 text-left text-sm font-semibold text-[#7a8698] transition-colors hover:text-[#174dbb]"
                type="button"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                (onCreateAccountClick || onLoginClick)();
                setIsOpen(false);
              }}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#174dbb] to-[#2e7df6] px-6 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#174dbb20]"
              type="button"
            >
              Criar conta
            </button>
            <button
              onClick={() => {
                onLoginClick();
                setIsOpen(false);
              }}
              className="w-full rounded-lg px-6 py-2 text-sm font-semibold text-[#132237]"
              type="button"
            >
              Entrar
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
