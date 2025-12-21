import { Camera, Maximize2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

interface CameraFeedProps {
  name: string;
  feedUrl?: string;
}

export const CameraFeed = ({ name, feedUrl }: CameraFeedProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
          <span className="flex items-center gap-1 text-[10px] text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Élő
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="relative aspect-video bg-background/50">
        {feedUrl ? (
          <iframe
            src={feedUrl}
            title={`${name} camera feed`}
            className="w-full h-full border-0"
            allow="autoplay"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Camera className="w-12 h-12 opacity-30" />
              <span className="text-xs">Kamera előnézet</span>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-background/80 backdrop-blur text-[10px] text-muted-foreground font-mono">
          {new Date().toLocaleString('hu-HU')}
        </div>
      </div>
    </div>
  );
};
