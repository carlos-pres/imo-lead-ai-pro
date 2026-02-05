import { useState } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ContactSection } from "@/components/ContactSection";
import { CTASection } from "@/components/CTASection";
import { AdminSection } from "@/components/AdminSection";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { DemoModal } from "@/components/DemoModal";

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("signup");
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [authRedirectTo, setAuthRedirectTo] = useState("/dashboard");

  const openAuthModal = (tab: "login" | "signup" = "signup", redirectTo: string = "/dashboard") => {
    setAuthModalTab(tab);
    setAuthRedirectTo(redirectTo);
    setAuthModalOpen(true);
  };

  const openDemoModal = () => {
    setDemoModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <NavigationHeader 
        onLoginClick={() => openAuthModal("login")}
        onSignupClick={() => openAuthModal("signup")}
      />
      <HeroSection 
        onStartClick={() => openAuthModal("signup")}
        onDemoClick={openDemoModal}
      />
      <FeaturesSection />
      <PricingSection 
        onPlanClick={(planType) => {
          if (planType === "custom") {
            document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
          } else {
            openAuthModal("signup", "/loja");
          }
        }}
      />
      <TestimonialsSection />
      <ContactSection />
      <CTASection onStartClick={() => openAuthModal("signup")} />
      <AdminSection />
      <Footer />

      <AuthModal 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
        redirectTo={authRedirectTo}
      />
      <DemoModal 
        open={demoModalOpen}
        onOpenChange={setDemoModalOpen}
        onStartTrial={() => openAuthModal("signup")}
      />
    </div>
  );
}
