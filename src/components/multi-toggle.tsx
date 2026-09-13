import { cn } from "@/lib/utils";

/** Grupa etykiet z wielokrotnym wyborem, w stylu przycisków oceny. */
export function MultiToggle({
  options,
  values,
  onChange,
  ariaLabel,
}: {
  options: readonly { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  ariaLabel?: string;
}) {
  const toggle = (value: string) => {
    onChange(
      values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
    );
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
