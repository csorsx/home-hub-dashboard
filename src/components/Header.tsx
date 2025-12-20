import { useEffect, useState } from "react";
import { Thermometer, Home, Settings } from "lucide-react";

export const Header = () => {
  const [time, setTime] = useState(new Date());
  const temperature = 4.8; // This would come from an API in real implementation

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass-card p-6 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/20 text-primary">
          <Home className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-tight">Smart Home</span>
          <span className="text-sm text-muted-foreground">Control Panel</span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-secondary">
          <Thermometer className="w-5 h-5 text-primary" />
          <span className="text-2xl font-semibold">
            {temperature.toFixed(1)}
            <span className="text-base text-muted-foreground ml-0.5">°C</span>
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-4xl font-bold tabular-nums tracking-tight">
            {time.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-sm text-muted-foreground">
            {time.toLocaleDateString('hu-HU', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <button className="p-3 rounded-2xl bg-secondary hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
