import { Camera } from "lucide-react";
import { useRef, useEffect, useState } from "react";

interface CameraFeedProps {
  name: string;
  feedUrl?: string;
}

export const CameraFeed = ({ name, feedUrl }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feedUrl || !videoRef.current) return;

    const video = videoRef.current;
    let pc: RTCPeerConnection | null = null;

    const connectWebRTC = async () => {
      try {
        // Create peer connection
        pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Handle incoming tracks
        pc.ontrack = (event) => {
          if (video.srcObject !== event.streams[0]) {
            video.srcObject = event.streams[0];
            setIsConnected(true);
            setError(null);
          }
        };

        // Create and send offer
        pc.addTransceiver('video', { direction: 'recvonly' });
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send offer to signaling server (the stream URL is the WHEP endpoint)
        const response = await fetch(feedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: offer.sdp
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const answerSdp = await response.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      } catch (err: any) {
        console.error('WebRTC connection failed:', err);
        setError(err.message || 'Connection failed');
        setIsConnected(false);
      }
    };

    connectWebRTC();

    return () => {
      if (pc) {
        pc.close();
      }
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [feedUrl]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
            <Camera className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">{name}</span>
          {isConnected && (
            <span className="flex items-center gap-1 text-[10px] text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Élő
            </span>
          )}
          {error && (
            <span className="text-[10px] text-destructive">{error}</span>
          )}
        </div>
      </div>
      <div className="relative aspect-video bg-background/50">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {!isConnected && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Kapcsolódás...</span>
          </div>
        )}
      </div>
    </div>
  );
};
