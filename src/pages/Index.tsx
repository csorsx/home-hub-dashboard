import { Header } from "@/components/Header";
import { LightCard } from "@/components/LightCard";
import { GateCard } from "@/components/GateCard";
import { CameraFeed } from "@/components/CameraFeed";
import { SectionTitle } from "@/components/SectionTitle";
import { Lightbulb, Shield, Video } from "lucide-react";

const lights = [
  { name: "Oldal", initialState: true },
  { name: "Utca", initialState: true },
  { name: "Bejárat", initialState: true },
  { name: "Terasz", initialState: true },
  { name: "XMas", initialState: true },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <Header />

        {/* Lights Section */}
        <section>
          <SectionTitle icon={Lightbulb} title="Világítás" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {lights.map((light, index) => (
              <LightCard
                key={light.name}
                name={light.name}
                initialState={light.initialState}
                delay={index * 50}
              />
            ))}
          </div>
        </section>

        {/* Security Section */}
        <section>
          <SectionTitle icon={Shield} title="Biztonság" />
          <div className="grid gap-4">
            <GateCard name="Kapu" initialState="closed" />
          </div>
        </section>

        {/* Camera Section */}
        <section>
          <SectionTitle icon={Video} title="Kamera" />
          <div className="grid gap-4">
            <CameraFeed name="Bejárat kamera" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
