import { DoorOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRemootio } from "@/hooks/useRemootio";

interface GateCardProps {
  name: string;
}

export const GateCard = ({ name }: GateCardProps) => {
  const { triggerGate, status, message } = useRemootio();

  const isTriggering = status === 'triggering';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <button
      onClick={triggerGate}
      disabled={isTriggering}
      className={cn(
        "glass-card p-4 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer group animate-fade-in w-full",
        isSuccess && "border-success/50 glow-accent",
        isError && "border-destructive/50"
      )}
      style={{ animationDelay: "250ms" }}
    >
      <div
        className={cn(
          "p-3 rounded-xl transition-all duration-300",
          isSuccess
            ? "bg-success/20 text-success"
            : isError
              ? "bg-destructive/20 text-destructive"
              : "bg-muted text-muted-foreground group-hover:bg-muted/80"
        )}
      >
        {isTriggering ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <DoorOpen className="w-6 h-6" />
        )}
      </div>
      <div className="flex flex-col items-start gap-0.5">
        <span className="font-semibold text-lg text-foreground">{name}</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm uppercase tracking-wider font-bold",
              isSuccess ? "text-success" : isError ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {message}
          </span>
        </div>
      </div>
    </button>
  );
};
