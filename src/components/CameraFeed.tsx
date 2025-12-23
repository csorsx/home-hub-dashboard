import { Camera, Play } from "lucide-react";
import { useState } from "react";

interface CameraFeedProps {
  name: string;
  feedUrl?: string;
}

export const CameraFeed = ({ name, feedUrl }: CameraFeedProps) => {
  const [isStreamLoaded, setIsStreamLoaded] = useState(true);

  return (
    <div
      className="glass-card overflow-hidden animate-fade-in"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
            <Camera className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">{name}</span>
          {isStreamLoaded && (
            <span className="flex items-center gap-1 text-[10px] text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Élő
            </span>
          )}
        </div>
      </div>
      <div className="relative aspect-video bg-background/50">
        {feedUrl && isStreamLoaded ? (
          <iframe
            src={feedUrl}
            title={`${name} camera feed`}
            className="w-full h-full border-0"
            allow="autoplay"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => setIsStreamLoaded(true)}
              className="flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <div className="p-4 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <span className="text-sm font-medium">Stream betöltése</span>
            </button>
          </div>
        )}
        {isStreamLoaded && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-[10px] text-muted-foreground font-mono">
            {new Date().toLocaleString('hu-HU')}
          </div>
        )}
      </div>
    </div>
  );
};
