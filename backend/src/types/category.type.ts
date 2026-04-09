import { Document } from 'mongoose';
import { Pagination } from "../utils/pagination";

export type CategoryType = 'income' | 'expense';

export interface CreateCategoryData {
  name: string;
  type: CategoryType;
  parentCategory?: string | null;
  user?: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  type?: CategoryType;
  parentCategory?: string | null;
  icon?: string;
  color?: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  type: CategoryType;
  parentCategory?: string | null | undefined;
  user?: string | undefined;
  icon?: string;
  color?: string;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface CategoryDocument extends Document {
  name: string;
  type: CategoryType;
  parentCategory?: string | null;
  user?: string;
}

export interface PaginatedCategoriesResponse {
  data: CategoryResponse[];
  pagination: Pagination;
}
