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
        "glass-card p-3 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group animate-fade-in",
        isOn && "border-primary/50 glow-effect"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "p-3 rounded-xl transition-all duration-300",
          isOn
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground group-hover:bg-muted/80"
        )}
      >
        {isOn ? (
          <Lightbulb className="w-6 h-6 animate-pulse-glow" />
        ) : (
          <LightbulbOff className="w-6 h-6" />
        )}
      </div>
      <span
        className={cn(
          "font-medium text-sm transition-colors duration-300",
          isOn ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {name}
      </span>

    </button>
  );
};
