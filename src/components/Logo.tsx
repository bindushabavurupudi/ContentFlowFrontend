import { Calendar } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-lg" },
    md: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-xl" },
    lg: { box: "h-12 w-12", icon: "h-6 w-6", text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl btn-gradient flex items-center justify-center`}>
        <Calendar className={`${s.icon} text-primary-foreground`} />
      </div>
      <span className={`${s.text} font-bold tracking-tight`}>ContentFlow</span>
    </div>
  );
}
