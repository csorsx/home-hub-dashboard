import { Header } from "@/components/Header";
import { LightCard } from "@/components/LightCard";
import { GateCard } from "@/components/GateCard";
import { CameraFeed } from "@/components/CameraFeed";
import { SectionTitle } from "@/components/SectionTitle";
import { Lightbulb, Shield, Video } from "lucide-react";

const lights = [
  {
    name: "Oldal",
    webhook: "http://192.168.1.104:5678/webhook/045bcc8d-d608-4cee-b347-a0953762cc2d"
  },
  {
    name: "Utca",
    webhook: "http://192.168.1.104:5678/webhook/ed92876e-f69a-4493-b85a-7628c929e59b"
  },
  {
    name: "Bejárat",
    webhook: "http://192.168.1.104:5678/webhook/c2f46e99-a43e-4642-ad33-7aa2f18a5df8"
  },
  {
    name: "Terasz",
    webhook: "http://192.168.1.104:5678/webhook/b7bcfee5-37cc-471c-8b1f-ad844b594419"
  },
  {
    name: "XMas",
    webhook: "http://192.168.1.104:5678/webhook/4b140be2-db2f-4632-9661-0f1b4b86edca"
  },
];

const Index = () => {
  const handleLightToggle = async (webhook?: string) => {
    if (!webhook) return;
    try {
      await fetch(webhook, { mode: 'no-cors' });
      // toast.success("Command sent");
    } catch (error) {
      console.error("Failed to trigger webhook:", error);
      // toast.error("Failed to send command");
    }
  };

  return (
    <div className="min-h-screen synthwave-bg relative overflow-hidden">
      {/* Synthwave Grid */}
      <div className="fixed inset-0 synthwave-grid opacity-50 pointer-events-none"
        style={{ perspective: '500px', transform: 'rotateX(60deg) translateY(50%)', transformOrigin: 'center top' }} />

      {/* Synthwave Sun */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full synthwave-sun opacity-60 blur-sm pointer-events-none" />

      {/* Horizontal scan lines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(320 100% 60%) 2px, hsl(320 100% 60%) 4px)' }} />

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-48 h-48 bg-accent/20 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 px-3 py-4 max-w-[750px] mx-auto space-y-4">
        <Header />

        {/* Lights Section */}
        <section>
          <SectionTitle icon={Lightbulb} title="Világítás" />
          <div className="grid grid-cols-3 gap-2">
            {lights.map((light, index) => (
              <LightCard
                key={light.name}
                name={light.name}
                delay={index * 50}
                onToggle={() => handleLightToggle(light.webhook)}
              />
            ))}
          </div>
        </section>

        {/* Security Section */}
        <section>
          <SectionTitle icon={Shield} title="Biztonság" />
          <GateCard name="Kapu" initialState="closed" />
        </section>

        {/* Camera Section */}
        <section>
          <SectionTitle icon={Video} title="Kamera" />
          <CameraFeed name="Bejárat kamera" feedUrl="http://192.168.1.104:8889/cam1/" />
        </section>
      </div>
    </div>
  );
};

export default Index;
