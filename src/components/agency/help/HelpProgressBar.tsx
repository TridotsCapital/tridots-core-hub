import { cn } from "@/lib/utils";

interface HelpProgressBarProps {
  progress: number;
}

export function HelpProgressBar({ progress }: HelpProgressBarProps) {
  return (
    <div className="relative h-1 bg-muted">
      <div
        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute right-2 -top-5 text-[10px] text-muted-foreground">
        {Math.round(progress)}% lido
      </div>
    </div>
  );
}
