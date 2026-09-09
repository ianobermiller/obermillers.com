export type GeocodingResult = {
  city: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

export async function geocodeCityMultiple(
  cityName: string,
  limit: number = 5,
): Promise<GeocodingResult[]> {
  try {
    const query = encodeURIComponent(cityName);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=${limit}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Museum Finder App",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = (await response.json()) as NominatimResult[];
    if (data.length === 0) {
      return [];
    }

    return data.map((result) => {
      const address = result.address ?? {};
      const mapped: GeocodingResult = {
        city: address.city ?? address.town ?? address.village ?? cityName,
        country: address.country ?? "Unknown",
        latitude: Number.parseFloat(result.lat),
        longitude: Number.parseFloat(result.lon),
        displayName: result.display_name,
      };
      if (address.state !== undefined) {
        mapped.state = address.state;
      }
      return mapped;
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}
