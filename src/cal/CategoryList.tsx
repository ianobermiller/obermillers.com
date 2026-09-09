import { clsx } from "clsx";
import { MoreVertical, Plus } from "lucide-react";

import { createCategory, deleteCategory, updateCategory } from "./api";
import { Button, IconButton } from "./components/Button";
import { Eyebrow } from "./components/Layout";
import { useOwnerId } from "./hooks/useOwnerId";
import { setSelectedCategoryID, useSelectedCategoryID } from "./Store";
import type { CategoryWithColor } from "./types";
import { colorVars } from "./utils/colors";

export function CategoryList({
  calendarId,
  categories,
  countByCategory,
  onCopy,
  onCopyAll,
}: {
  calendarId: string;
  categories: CategoryWithColor[];
  countByCategory: Record<string, number | undefined>;
  onCopy: (category: CategoryWithColor) => void;
  onCopyAll: () => void;
}) {
  const ownerId = useOwnerId();
  const selectedId = useSelectedCategoryID();

  const addCategory = async () => {
    const categoryId = await createCategory(calendarId, ownerId);
    setSelectedCategoryID(categoryId);
  };

  const selected = categories.find((category) => category.id === selectedId);

  return (
    <div className="border-cc-border bg-cc-surface rounded-xl border shadow-xs">
      <div className="border-cc-border flex items-center justify-between gap-2 border-b px-4 py-3">
        <Eyebrow>Places</Eyebrow>
        <IconButton
          aria-label="Add a place"
          className="-mr-1.5 size-8"
          onClick={() => void addCategory()}
          type="button"
          variant="ghost"
        >
          <Plus size={16} />
        </IconButton>
      </div>

      {categories.length > 0 ? (
        <ul className="flex flex-col p-2">
          {categories.map((category) => (
            <CategoryRow
              calendarId={calendarId}
              category={category}
              count={countByCategory[category.id] ?? 0}
              key={category.id}
              onCopy={onCopy}
            />
          ))}
        </ul>
      ) : (
        <p className="text-cc-muted px-4 py-3 text-sm">
          Add a place — a city, a hotel, or just &ldquo;Travel&rdquo; — then paint the days you
          spend there.
        </p>
      )}

      <div className="border-cc-border flex flex-wrap items-center gap-2 border-t px-4 py-3">
        <Button onClick={() => void addCategory()} type="button">
          <Plus size={15} />
          Add
        </Button>
        <Button disabled={categories.length === 0} onClick={onCopyAll} type="button">
          Copy all
        </Button>
        {selected ? (
          <Button onClick={() => setSelectedCategoryID(null)} type="button" variant="ghost">
            Deselect
          </Button>
        ) : null}
      </div>

      <p className="border-cc-border text-cc-muted border-t px-4 py-3 text-xs leading-relaxed">
        {selected ? (
          <>
            <span className="text-cc-text font-semibold">{selected.name || "This place"}</span> is
            your brush. Click a day to fill it, or drag across several. Click the lower-right corner
            to set just the second half of a travel day.
          </>
        ) : (
          "Pick a place to start painting days."
        )}
      </p>
    </div>
  );
}

function CategoryRow({
  calendarId,
  category,
  count,
  onCopy,
}: {
  calendarId: string;
  category: CategoryWithColor;
  count: number;
  onCopy: (category: CategoryWithColor) => void;
}) {
  const selectedId = useSelectedCategoryID();
  const isSelected = selectedId === category.id;
  const onNameChange = (target: HTMLInputElement) => {
    void updateCategory(calendarId, category.id, target.value);
  };

  const onColorClick = () => setSelectedCategoryID(category.id);

  return (
    <li
      className={clsx(
        "group flex items-center gap-2.5 rounded-lg px-2 py-1.5",
        isSelected ? "bg-cc-surface-2" : "hover:bg-cc-surface-2",
      )}
    >
      <button
        aria-label={`Select ${category.name}`}
        className={clsx(
          "cc-fill size-5 shrink-0 cursor-pointer rounded-md",
          isSelected && "ring-2 ring-cc-accent ring-offset-2 ring-offset-cc-surface-2",
        )}
        onClick={onColorClick}
        style={colorVars(category.color)}
        type="button"
      />

      <input
        className={clsx(
          "min-w-0 flex-1 rounded border-0 bg-transparent px-1 py-0.5 text-sm",
          "focus-visible:bg-cc-surface focus-visible:ring-1 focus-visible:ring-cc-accent",
          "focus-visible:outline-none",
          isSelected ? "font-semibold text-cc-text" : "font-medium",
        )}
        defaultValue={category.name}
        onBlur={(e) => onNameChange(e.currentTarget)}
        onFocus={onColorClick}
        onKeyDown={(e) => e.key === "Enter" && onNameChange(e.currentTarget)}
        placeholder="Unnamed"
        type="text"
      />

      <span className="text-cc-muted shrink-0 text-xs tabular-nums">{count}n</span>

      <div className="group/menu relative shrink-0">
        <IconButton
          aria-label={`Actions for ${category.name}`}
          className="size-7 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
          type="button"
          variant="ghost"
        >
          <MoreVertical size={16} />
        </IconButton>

        <div className="border-cc-border bg-cc-surface absolute right-0 z-10 hidden min-w-32 flex-col overflow-hidden rounded-lg border py-1 text-sm whitespace-nowrap shadow-lg group-focus-within/menu:flex">
          <button
            className="hover:bg-cc-surface-2 cursor-pointer px-3 py-1.5 text-left"
            onClick={(e) => {
              e.currentTarget.blur();
              onCopy(category);
            }}
            type="button"
          >
            Copy HTML
          </button>
          <button
            className="text-cc-danger hover:bg-cc-surface-2 cursor-pointer px-3 py-1.5 text-left"
            onClick={() => {
              void deleteCategory(calendarId, category.id);
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
