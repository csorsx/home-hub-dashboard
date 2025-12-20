import { Lightbulb, LightbulbOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LightCardProps {
  name: string;
  initialState?: boolean;
  delay?: number;
}

export const LightCard = ({ name, initialState = false, delay = 0 }: LightCardProps) => {
  const [isOn, setIsOn] = useState(initialState);

  return (
    <button
      onClick={() => setIsOn(!isOn)}
      className={cn(
        "glass-card p-6 flex flex-col items-center gap-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group animate-fade-in",
        isOn && "border-primary/50 glow-effect"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "p-4 rounded-2xl transition-all duration-300",
          isOn
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground group-hover:bg-muted/80"
        )}
      >
        {isOn ? (
          <Lightbulb className="w-8 h-8 animate-pulse-glow" />
        ) : (
          <LightbulbOff className="w-8 h-8" />
        )}
      </div>
      <span
        className={cn(
          "font-medium text-lg transition-colors duration-300",
          isOn ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {name}
      </span>
      <span
        className={cn(
          "text-xs uppercase tracking-wider font-semibold",
          isOn ? "text-primary" : "text-muted-foreground"
        )}
      >
        {isOn ? "On" : "Off"}
      </span>
    </button>
  );
};
