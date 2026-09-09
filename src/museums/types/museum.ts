export type DiscountType = "free" | "50-percent" | "distance-based" | "varies" | "free-public";

export type MuseumType = "astc" | "aza";

/**
 * Membership tiers a venue accepts for reciprocal admission. The ASTC passport
 * lists these per venue instead of a per-venue admittance policy; the admittance
 * rules themselves are uniform across the program (see ASTC_ADMITTANCE_RULE).
 */
export type EligibleMemberships = {
  individual: string[];
  group: string[];
};

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
  eligibleMemberships?: EligibleMemberships;
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
