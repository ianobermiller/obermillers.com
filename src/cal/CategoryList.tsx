import { MoreVertical, Plus } from "lucide-react";

import { createCategory, deleteCategory, updateCategory } from "./api";
import { Button, IconButton } from "./components/Button";
import { Input } from "./components/Input";
import { useOwnerId } from "./hooks/useOwnerId";
import { setSelectedCategoryID, useSelectedCategoryID } from "./Store";
import type { CategoryWithColor } from "./types";
import { getColorForMode } from "./utils/colors";

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

  return (
    <div className="flex w-72 flex-col gap-3">
      <h3>Categories</h3>

      <ul className="flex flex-col gap-2">
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

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void addCategory()} type="button">
          <Plus size={24} />
          Add
        </Button>
        <Button onClick={onCopyAll} type="button">
          Copy all
        </Button>
        <Button
          disabled={selectedId === null}
          onClick={() => setSelectedCategoryID(null)}
          type="button"
        >
          Deselect
        </Button>
      </div>
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
  const onNameChange = (target: HTMLInputElement) => {
    void updateCategory(calendarId, category.id, target.value);
  };

  const onColorClick = () => setSelectedCategoryID(category.id);

  return (
    <div className="flex items-center gap-2">
      <button
        className={`inline-flex size-8 items-center justify-center rounded-full border-2 border-solid font-bold text-white ${
          selectedId === category.id ? "border-slate-900 dark:border-white" : "border-transparent"
        }`}
        onClick={onColorClick}
        style={{ background: getColorForMode(category.color) }}
        type="button"
      >
        <span className="drop-shadow-[0_1px_1px_black]">{count}</span>
      </button>

      <Input
        defaultValue={category.name}
        onBlur={(e) => onNameChange(e.currentTarget)}
        onFocus={onColorClick}
        onKeyDown={(e) => e.key === "Enter" && onNameChange(e.currentTarget)}
        type="text"
      />

      <div className="group relative">
        <IconButton type="button">
          <MoreVertical size={20} />
        </IconButton>

        <div className="absolute right-0 z-10 hidden flex-col rounded bg-white whitespace-nowrap shadow-md group-focus-within:flex dark:bg-slate-700 dark:text-slate-100">
          <button
            className="rounded px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600"
            onClick={(e) => {
              e.currentTarget.blur();
              onCopy(category);
            }}
            type="button"
          >
            Copy HTML
          </button>
          <button
            className="rounded px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600"
            onClick={() => {
              void deleteCategory(calendarId, category.id);
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
