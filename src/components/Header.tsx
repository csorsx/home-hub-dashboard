import { useEffect, useState } from "react";
import { Thermometer, Home, Clock } from "lucide-react";

export const Header = () => {
  const [time, setTime] = useState(new Date());
  const [temp, setTemp] = useState<number | null>(null);

  // Hourly page reload
  useEffect(() => {
    const reloadTimer = setTimeout(() => {
      window.location.reload();
    }, 60 * 60 * 1000);
    return () => clearTimeout(reloadTimer);
  }, []);

  // Clock interval
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Weather fetch (Open-Meteo) for Budaörs, HU
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=47.46&longitude=18.96&current_weather=true"
        );
        const data = await res.json();
        if (data.current_weather) {
          setTemp(data.current_weather.temperature);
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
      }
    };

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 15 * 60 * 1000); // Update every 15 min
    return () => clearInterval(weatherInterval);
  }, []);

  return (
    <header className="glass-card p-3 animate-fade-in mb-6">
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Left: Title */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20 text-primary glow-effect">
            <Home className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight font-display text-gradient hidden xs:inline">
            Smart Home
          </span>
        </div>

        {/* Middle: Clock */}
        <div className="flex items-center gap-3 px-4 py-1 rounded-xl bg-background/40 border border-white/5 mx-auto">
          <Clock className="w-4 h-4 text-primary/70" />
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight font-display text-gradient uppercase">
              {time.toLocaleDateString('hu-HU', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-2xl font-bold tabular-nums tracking-tight font-display text-gradient">
              {time.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
              <span className="text-base opacity-50 ml-0.5">
                :{time.toLocaleTimeString('hu-HU', { second: '2-digit' })}
              </span>
            </span>
          </div>
        </div>

        {/* Right: Temp */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border">
          <Thermometer className="w-5 h-5 text-accent" />
          <span className="text-2xl font-semibold font-display">
            {temp !== null ? temp.toFixed(1) : "--.-"}
            <span className="text-sm text-muted-foreground ml-0.5">°C</span>
          </span>
        </div>
      </div>
    </header>
  );
};
