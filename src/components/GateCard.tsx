import { DoorClosed, DoorOpen, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface GateCardProps {
  name: string;
  initialState?: "open" | "closed";
}

export const GateCard = ({ name, initialState = "closed" }: GateCardProps) => {
  const [status, setStatus] = useState<"open" | "closed" | "moving">(initialState);

  const handleToggle = () => {
    setStatus("moving");
    setTimeout(() => {
      setStatus(prev => prev === "moving" ? (initialState === "closed" ? "open" : "closed") : prev);
    }, 2000);
  };

  const isOpen = status === "open";
  const isMoving = status === "moving";

  return (
    <button
      onClick={handleToggle}
      disabled={isMoving}
      className={cn(
        "glass-card p-4 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer group animate-fade-in w-full",
        isOpen && "border-success/50 glow-accent",
        isMoving && "border-warning/50"
      )}
      style={{ animationDelay: "250ms" }}
    >
      <div
        className={cn(
          "p-3 rounded-xl transition-all duration-300",
          isOpen
            ? "bg-success/20 text-success"
            : isMoving
            ? "bg-warning/20 text-warning"
            : "bg-muted text-muted-foreground group-hover:bg-muted/80"
        )}
      >
        {isMoving ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isOpen ? (
          <DoorOpen className="w-6 h-6" />
        ) : (
          <DoorClosed className="w-6 h-6" />
        )}
      </div>
      <div className="flex flex-col items-start gap-0.5">
        <span className="font-medium text-base text-foreground">{name}</span>
        <span
          className={cn(
            "text-xs uppercase tracking-wider font-semibold",
            isOpen ? "text-success" : isMoving ? "text-warning" : "text-muted-foreground"
          )}
        >
          {isMoving ? "Mozog..." : isOpen ? "Nyitva" : "Zárva"}
        </span>
      </div>
    </button>
  );
};
