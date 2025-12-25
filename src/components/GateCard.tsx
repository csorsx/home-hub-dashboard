import { DoorClosed, DoorOpen, Loader2, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRemootio } from "@/hooks/useRemootio";

interface GateCardProps {
  name: string;
  initialState?: "open" | "closed";
}

export const GateCard = ({ name }: GateCardProps) => {
  const { triggerGate, isConnected, isAuthenticated, gateStatus, connectionStatus } = useRemootio();

  // Use hook status if available, otherwise just default
  const isOpen = gateStatus === 'open';
  const isReady = isConnected && isAuthenticated;

  return (
    <button
      onClick={triggerGate}
      disabled={!isReady}
      className={cn(
        "glass-card p-4 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer group animate-fade-in w-full",
        isOpen && "border-success/50 glow-accent",
        !isReady && "opacity-70"
      )}
      style={{ animationDelay: "250ms" }}
    >
      <div
        className={cn(
          "p-3 rounded-xl transition-all duration-300",
          isOpen
            ? "bg-success/20 text-success"
            : !isReady
              ? "bg-muted text-muted-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-muted/80"
        )}
      >
        {!isReady ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isOpen ? (
          <DoorOpen className="w-6 h-6" />
        ) : (
          <DoorClosed className="w-6 h-6" />
        )}
      </div>
      <div className="flex flex-col items-start gap-0.5">
        <span className="font-medium text-base text-foreground">{name}</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs uppercase tracking-wider font-semibold",
              isOpen ? "text-success" : "text-muted-foreground"
            )}
          >
            {isOpen ? "Nyitva" : "Zárva"}
          </span>

          {/* Connection Indicator */}
          <div className={cn("text-[10px] items-center gap-1 flex", isReady ? "text-green-500" : "text-red-500")}>
            {isReady ? <Wifi className="w-3 h-3" /> : (
              <span className="flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                <span>{connectionStatus || 'Disconnected'}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
