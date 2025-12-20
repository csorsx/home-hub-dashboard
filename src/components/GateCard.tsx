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
        "glass-card p-6 flex items-center gap-6 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer group animate-fade-in col-span-full",
        isOpen && "border-success/50",
        isMoving && "border-warning/50"
      )}
      style={{ animationDelay: "250ms" }}
    >
      <div
        className={cn(
          "p-4 rounded-2xl transition-all duration-300",
          isOpen
            ? "bg-success/20 text-success"
            : isMoving
            ? "bg-warning/20 text-warning"
            : "bg-muted text-muted-foreground group-hover:bg-muted/80"
        )}
      >
        {isMoving ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isOpen ? (
          <DoorOpen className="w-8 h-8" />
        ) : (
          <DoorClosed className="w-8 h-8" />
        )}
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="font-medium text-xl text-foreground">{name}</span>
        <span
          className={cn(
            "text-sm uppercase tracking-wider font-semibold",
            isOpen ? "text-success" : isMoving ? "text-warning" : "text-muted-foreground"
          )}
        >
          {isMoving ? "Moving..." : isOpen ? "Open" : "Closed"}
        </span>
      </div>
    </button>
  );
};
