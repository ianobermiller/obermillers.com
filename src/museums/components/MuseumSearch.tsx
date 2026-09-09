import { LayoutGrid, Map } from "lucide-react";
import { useMemo, useState } from "react";

import { calculateDistance } from "../lib/distance";
import type { Museum, SearchFilters } from "../types/museum";
import { FilterPanel } from "./FilterPanel";
import { MapView } from "./MapView";
import { MuseumCard } from "./MuseumCard";
import { Button } from "./ui/button";

export function MuseumSearch({
  filters,
  museums,
  onFiltersChange,
}: {
  filters: SearchFilters;
  museums: Museum[];
  onFiltersChange: (filters: SearchFilters) => void;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const filteredAndSortedMuseums = useMemo(() => {
    const cityLocation = filters.citySearchLocation;
    if (cityLocation === undefined) {
      return museums.toSorted((a, b) => a.name.localeCompare(b.name));
    }

    return museums
      .map((museum) =>
        Object.assign<Museum, Pick<Museum, "distance">>(
          { ...museum },
          {
            distance: calculateDistance(
              cityLocation.latitude,
              cityLocation.longitude,
              museum.latitude,
              museum.longitude,
            ),
          },
        ),
      )
      .filter((museum) => (museum.distance ?? Infinity) <= filters.citySearchRadius)
      .toSorted((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [filters, museums]);

  return (
    <div className="space-y-6">
      <FilterPanel filters={filters} onFiltersChange={onFiltersChange} />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {filters.citySearchLocation !== undefined
              ? `Showing ${filteredAndSortedMuseums.length} museums`
              : `Showing all ${filteredAndSortedMuseums.length} museums`}
          </p>

          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("grid")}
              size="sm"
              title="Grid view"
              variant={viewMode === "grid" ? "default" : "outline"}
            >
              <LayoutGrid className="mr-1 h-4 w-4" />
              Grid
            </Button>
            <Button
              onClick={() => setViewMode("map")}
              size="sm"
              title="Map view"
              variant={viewMode === "map" ? "default" : "outline"}
            >
              <Map className="mr-1 h-4 w-4" />
              Map
            </Button>
          </div>
        </div>

        {filteredAndSortedMuseums.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-lg">No museums found in this area.</p>
            <p className="text-muted-foreground mt-2 text-sm">Try increasing the search radius.</p>
          </div>
        ) : viewMode === "map" ? (
          <MapView museums={filteredAndSortedMuseums} showDistance />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedMuseums.map((museum) => (
              <MuseumCard key={`${museum.type}-${museum.id}`} museum={museum} showDistance />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
