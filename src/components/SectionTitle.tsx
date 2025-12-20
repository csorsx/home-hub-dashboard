import { LucideIcon } from "lucide-react";

interface SectionTitleProps {
  icon: LucideIcon;
  title: string;
}

export const SectionTitle = ({ icon: Icon, title }: SectionTitleProps) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Icon className="w-5 h-5 text-primary" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
  );
};
