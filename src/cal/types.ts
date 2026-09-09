export type Calendar = {
  id: string;
  urlId: string;
  title: string;
  startDate: string;
  endDate: string;
  notes: string;
  isPubliclyVisible: boolean;
  isReadOnly: boolean;
  ownerId: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  ownerId: string;
};

export interface CategoryWithColor extends Category {
  color: string;
}

export type Day = {
  id: string;
  date: string;
  categoryId?: string;
  halfCategoryId?: string;
  icon?: string;
  note?: string;
  ownerId: string;
};
