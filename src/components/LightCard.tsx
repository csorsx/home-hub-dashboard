import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface LightCardProps {
  name: string;
  delay?: number;
  onToggle?: () => void;
}

export const LightCard = ({ name, delay = 0, onToggle }: LightCardProps) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "glass-card p-4 flex flex-col items-center gap-3 animate-fade-in transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group",
        "active:bg-primary/5 border-primary/50 glow-effect"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-3 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <Lightbulb className="w-6 h-6" />
      </div>

      <span className="font-medium text-sm text-foreground">
        {name}
      </span>
    </button>
  );
};
