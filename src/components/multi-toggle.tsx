import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiToggleOption = {
  value: string;
  label: string;
  icon?: LucideIcon;
};

/** Grupa etykiet z wielokrotnym wyborem, w stylu przycisków oceny. */
export function MultiToggle({
  options,
  values,
  onChange,
  ariaLabel,
}: {
  options: readonly MultiToggleOption[];
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
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden="true" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
