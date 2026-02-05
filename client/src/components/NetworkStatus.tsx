import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
      toast({
        title: "Ligação restabelecida",
        description: "A sua ligação à internet foi restabelecida.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
      toast({
        title: "Sem ligação à internet",
        description: "Verifique a sua ligação e tente novamente.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  if (!showOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-left">
      <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Sem ligação à internet</span>
      </div>
    </div>
  );
}
