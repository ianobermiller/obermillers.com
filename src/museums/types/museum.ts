export type DiscountType = "free" | "50-percent" | "distance-based" | "varies";

export type MuseumType = "astc" | "aza";

export type Museum = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  phone: string;
  website: string;
  admittancePolicy: string;
  proofOfResidenceRequired: boolean;
  latitude: number;
  longitude: number;
  discountType: DiscountType;
  specialNotes: string;
  distance?: number;
  type?: MuseumType;
};

export type CitySearchLocation = {
  city: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
};

export type SearchFilters = {
  citySearchLocation?: CitySearchLocation;
  citySearchRadius: 10 | 50 | 100;
};
