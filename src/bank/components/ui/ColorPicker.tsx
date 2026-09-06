import {
  ACCOUNT_COLORS,
  type AccountColorId,
  DEFAULT_ACCOUNT_COLOR,
} from "@bank/utils/accountColor";
import { cn } from "@bank/utils/cn";
import { useState } from "react";

interface Props {
  defaultValue?: string | null;
  name?: string;
}

export function ColorPicker({ defaultValue, name = "color" }: Props) {
  const initial =
    ACCOUNT_COLORS.find((color) => color.id === defaultValue)?.id ?? DEFAULT_ACCOUNT_COLOR;
  const [selected, setSelected] = useState<AccountColorId>(initial);

  return (
    <fieldset>
      <legend className="sr-only">Color</legend>
      <div className="flex flex-wrap gap-3">
        {ACCOUNT_COLORS.map((color) => {
          const isSelected = selected === color.id;
          return (
            <label
              className={cn(
                "relative grid size-11 press cursor-pointer place-items-center rounded-full border-2 shadow-card",
                color.swatch,
                isSelected
                  ? "border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : "border-transparent",
              )}
              key={color.id}
              title={color.label}
            >
              <input
                checked={isSelected}
                className="sr-only"
                name={name}
                onChange={() => setSelected(color.id)}
                type="radio"
                value={color.id}
              />
              <span className="sr-only">{color.label}</span>
              {isSelected && (
                <span aria-hidden className="text-foreground/70 text-lg font-extrabold">
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
