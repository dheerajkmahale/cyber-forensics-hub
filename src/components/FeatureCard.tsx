import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  delay?: number;
}

const FeatureCard = ({ icon: Icon, title, description, badge }: FeatureCardProps) => {
  return (
    <div className="group relative glow-border rounded-sm bg-card p-6 transition-all duration-300 hover:border-primary/60 hover:bg-muted cursor-pointer overflow-hidden">
      {/* Scan line effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 scan-line pointer-events-none" />
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/60" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/60" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/60" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/60" />

      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-sm border border-primary/30 bg-primary/5 group-hover:border-primary/60 group-hover:bg-primary/10 transition-all duration-300 animate-pulse-glow">
          <Icon className="w-5 h-5 text-neon" style={{ color: "hsl(155 100% 50%)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-neon transition-colors duration-300" style={{ fontFamily: "Orbitron, monospace" }}>
              {title}
            </h3>
            {badge && (
              <span className="text-xs px-1.5 py-0.5 rounded border border-secondary/40 text-secondary font-mono" style={{ color: "hsl(185 100% 55%)", borderColor: "hsl(185 100% 55% / 0.4)", fontSize: "9px" }}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
