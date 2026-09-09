import { MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import { geocodeCityMultiple, type GeocodingResult } from "../lib/geocoding";
import type { SearchFilters } from "../types/museum";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "./ui/command";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function FilterPanel({
  filters,
  onFiltersChange,
}: {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}) {
  const [cityInput, setCityInput] = useState(filters.citySearchLocation?.displayName ?? "");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [cityMatches, setCityMatches] = useState<GeocodingResult[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    async (searchText: string) => {
      if (searchText.trim() === "" || searchText.length < 2) {
        setCityMatches([]);
        setGeocodingError(null);
        return;
      }

      setIsGeocoding(true);
      setGeocodingError(null);

      try {
        const results = await geocodeCityMultiple(searchText, 5);

        if (results.length === 0) {
          setGeocodingError("No cities found. Try a different name or format.");
          setCityMatches([]);
        } else if (results.length === 1) {
          const result = results[0];
          if (result !== undefined) {
            onFiltersChange({
              ...filters,
              citySearchLocation: result,
            });
            setCityInput(result.displayName);
            setCityMatches([]);
            setGeocodingError(null);
          }
        } else {
          setCityMatches(results);
          setGeocodingError(null);
        }
      } catch {
        setGeocodingError("Error finding city. Please try again.");
        setCityMatches([]);
      } finally {
        setIsGeocoding(false);
      }
    },
    [filters, onFiltersChange],
  );

  useEffect(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    if (
      filters.citySearchLocation !== undefined &&
      cityInput === filters.citySearchLocation.displayName
    ) {
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      void performSearch(cityInput);
    }, 400);

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cityInput, filters.citySearchLocation, performSearch]);

  const handleSelectCity = (result: GeocodingResult) => {
    onFiltersChange({
      ...filters,
      citySearchLocation: result,
    });
    setCityInput(result.displayName);
    setCityMatches([]);
    setGeocodingError(null);
  };

  const handleCityInputChange = (value: string) => {
    setCityInput(value);
    if (
      filters.citySearchLocation !== undefined &&
      value !== filters.citySearchLocation.displayName
    ) {
      onFiltersChange({ citySearchRadius: filters.citySearchRadius });
    }
  };

  const handleRadiusChange = (value: string) => {
    const radius = Number.parseInt(value, 10);
    if (radius === 10 || radius === 50 || radius === 100) {
      onFiltersChange({ ...filters, citySearchRadius: radius });
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setCityMatches([]);
    }
  };

  const handleClearInput = () => {
    setCityInput("");
    setCityMatches([]);
    setGeocodingError(null);
    if (filters.citySearchLocation !== undefined) {
      onFiltersChange({ citySearchRadius: filters.citySearchRadius });
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="text-muted-foreground absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              className="pr-10 pl-10"
              onChange={(event) => handleCityInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a city (e.g., Los Angeles, Seattle)"
              type="text"
              value={cityInput}
            />
            {isGeocoding ? (
              <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            ) : cityInput !== "" ? (
              <button
                className="text-muted-foreground hover:text-foreground absolute top-0 right-0 h-full px-3 transition-colors"
                onClick={handleClearInput}
                title="Clear search"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {filters.citySearchLocation !== undefined && (
            <div className="w-24">
              <Select onValueChange={handleRadiusChange} value={String(filters.citySearchRadius)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">&lt; 10 mi</SelectItem>
                  <SelectItem value="50">&lt; 50 mi</SelectItem>
                  <SelectItem value="100">&lt; 100 mi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {geocodingError !== null && <p className="text-destructive text-sm">{geocodingError}</p>}
        {cityMatches.length > 0 && (
          <Command className="rounded-md border shadow-md">
            <CommandList>
              <CommandEmpty>No cities found.</CommandEmpty>
              <CommandGroup heading="Select a city">
                {cityMatches.map((result) => (
                  <CommandItem
                    className="cursor-pointer"
                    key={result.displayName}
                    onSelect={() => handleSelectCity(result)}
                    value={result.displayName}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{result.city}</span>
                      <span className="text-muted-foreground text-sm">{result.displayName}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </div>
    </div>
  );
}
