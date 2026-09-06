export type RecipeSummary = {
  slug: string;
  name: string;
  category: string;
  description: string;
  image?: string;
};

export type Recipe = {
  name: string;
  description?: string;
  category: string;
  time?: {
    total?: string;
    prep?: string;
    cook?: string;
  };
  servings?: string;
  image?: string;
  ingredientGroups: Array<{
    name?: string;
    ingredients: string[];
  }>;
  directions: string[];
  notes?: string[];
  source?: {
    name: string;
    url?: string;
  };
};
