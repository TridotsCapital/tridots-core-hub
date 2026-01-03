import { cn } from "@/lib/utils";

interface NpsRatingScaleProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function NpsRatingScale({ value, onChange, disabled }: NpsRatingScaleProps) {
  const getRatingColor = (rating: number) => {
    if (rating <= 6) return "bg-red-500 hover:bg-red-600 border-red-600";
    if (rating <= 8) return "bg-yellow-500 hover:bg-yellow-600 border-yellow-600";
    return "bg-emerald-500 hover:bg-emerald-600 border-emerald-600";
  };

  const getSelectedColor = (rating: number) => {
    if (rating <= 6) return "bg-red-500 border-red-600 ring-2 ring-red-300";
    if (rating <= 8) return "bg-yellow-500 border-yellow-600 ring-2 ring-yellow-300";
    return "bg-emerald-500 border-emerald-600 ring-2 ring-emerald-300";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onChange(i)}
            className={cn(
              "flex-1 h-10 sm:h-12 rounded-md border-2 font-semibold text-sm sm:text-base transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              value === i
                ? cn("text-white", getSelectedColor(i))
                : cn(
                    "bg-muted/50 border-border text-foreground",
                    "hover:border-primary/50"
                  )
            )}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-red-500 font-medium">Detratores (0-6)</span>
        <span className="text-yellow-600 font-medium">Neutros (7-8)</span>
        <span className="text-emerald-500 font-medium">Promotores (9-10)</span>
      </div>
    </div>
  );
}
