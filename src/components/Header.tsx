import { useEffect, useState } from "react";
import { Thermometer, Home } from "lucide-react";

export const Header = () => {
  const [time, setTime] = useState(new Date());
  const temperature = 4.8; // This would come from an API in real implementation

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass-card p-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 text-primary glow-effect">
            <Home className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight font-display text-gradient">Smart Home</span>
            <span className="text-xs text-muted-foreground">Control Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border">
            <Thermometer className="w-4 h-4 text-accent" />
            <span className="text-lg font-semibold font-display">
              {temperature.toFixed(1)}
              <span className="text-xs text-muted-foreground ml-0.5">°C</span>
            </span>
          </div>

        </div>
      </div>

      <div className="flex items-center justify-center mt-3 pt-3 border-t border-border/50">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums tracking-tight font-display text-gradient">
            {time.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-sm text-muted-foreground">
            {time.toLocaleDateString('hu-HU', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </header>
  );
};
