import Category from "../models/category.model";
import { CreateCategoryData, UpdateCategoryData, CategoryResponse, PaginatedCategoriesResponse } from "../types/category.type";
import { paginate } from "../utils/pagination";
import mongoose from "mongoose";

// List categories with pagination.
// Khi không có userId: chỉ trả về danh mục hệ thống (user = null), dùng chung cho mọi user.
// Khi có userId: trả về danh mục của user đó (dùng cho filter nội bộ).
export async function listCategories(
  filter: { user?: string; type?: string } = {},
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedCategoriesResponse> {
  const query: any = {};
  if (filter.user) {
    query.user = filter.user;
  } else {
    // Public list: chỉ danh mục hệ thống (user null)
    query.user = null;
  }
  if (filter.type) query.type = filter.type;

  const skip = (page - 1) * pageSize;
  const totalItems = await Category.countDocuments(query);
  
  const cats = await Category.find(query)
    .skip(skip)
    .limit(pageSize)
    .lean();
  
  const formattedCats = cats.map((cat: any) => ({
    id: cat._id.toString(),
    name: cat.name,
    type: cat.type,
    parentCategory: cat.parentCategory ? cat.parentCategory.toString() : null,
    user: cat.user ? cat.user.toString() : undefined,
    icon: cat.icon || '',
    color: cat.color || '#000000',
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  }));

  return paginate(formattedCats, page, pageSize, totalItems);
}

// List categories by user with pagination: danh mục hệ thống (user null) + danh mục của user.
export async function listCategoriesByUser(
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedCategoriesResponse> {
  const query = { $or: [{ user: null }, { user: new mongoose.Types.ObjectId(userId) }] };
  const skip = (page - 1) * pageSize;
  const totalItems = await Category.countDocuments(query);
  
  const cats = await Category.find(query)
    .skip(skip)
    .limit(pageSize)
    .lean();
  
  const formattedCats = cats.map((cat: any) => ({
    id: cat._id.toString(),
    name: cat.name,
    type: cat.type,
    parentCategory: cat.parentCategory ? cat.parentCategory.toString() : null,
    user: cat.user ? cat.user.toString() : undefined,
    icon: cat.icon || '',
    color: cat.color || '#000000',
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  }));

  return paginate(formattedCats, page, pageSize, totalItems);
}

// Create a new category
export async function createCategory(payload: CreateCategoryData): Promise<CategoryResponse> {
  const { name, type, parentCategory, user, icon, color } = payload;

  if (parentCategory) {
    const parentExists = await Category.findById(parentCategory).lean();
    if (!parentExists) {
      throw new Error("Parent category not found");
    }
  }

  const category = new Category({
    name,
    type,
    parentCategory: parentCategory ? new mongoose.Types.ObjectId(parentCategory) : null,
    user: user ? new mongoose.Types.ObjectId(user) : undefined,
    icon: icon || '',
    color: color || '#000000',
  });

  const saved = await category.save();

  return {
    id: saved._id.toString(),
    name: saved.name,
    type: saved.type,
    parentCategory: saved.parentCategory ? saved.parentCategory.toString() : null,
    user: saved.user ? saved.user.toString() : undefined,
    icon: saved.icon || '',
    color: saved.color || '#000000',
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
  };
}

// Get category by id
export async function getCategoryById(id: string): Promise<CategoryResponse | null> {
  const cat = await Category.findById(id).lean();
  if (!cat) return null;
  return {
    id: cat._id.toString(),
    name: cat.name,
    type: cat.type,
    parentCategory: cat.parentCategory ? cat.parentCategory.toString() : null,
    user: cat.user ? cat.user.toString() : undefined,
    icon: cat.icon || '',
    color: cat.color || '#000000',
    createdAt: (cat as any).createdAt,
    updatedAt: (cat as any).updatedAt,
  };
}



// Update category (không cho sửa danh mục hệ thống user = null)
export async function updateCategory(id: string, payload: UpdateCategoryData): Promise<CategoryResponse | null> {
  const existing = await Category.findById(id).lean();
  if (!existing) return null;
  if (existing.user == null) {
    throw new Error("Cannot update system category");
  }

  // Prevent parent = self
  if (payload.parentCategory !== undefined && payload.parentCategory === id) {
    throw new Error("Parent category cannot be itself");
  }
  // Prevent circular: new parent must not be self or a descendant of self
  if (payload.parentCategory !== undefined && payload.parentCategory) {
    let currentId: mongoose.Types.ObjectId | null = new mongoose.Types.ObjectId(payload.parentCategory);
    while (currentId) {
      if (currentId.toString() === id) {
        throw new Error("Parent cannot be a sub-category of this category (circular)");
      }
      const parentDoc = await Category.findById(currentId).select("parentCategory").lean();
      currentId = parentDoc?.parentCategory ? new mongoose.Types.ObjectId((parentDoc as any).parentCategory) : null;
    }
  }

  const update: any = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.type !== undefined) update.type = payload.type;
  if (payload.parentCategory !== undefined) update.parentCategory = payload.parentCategory ? new mongoose.Types.ObjectId(payload.parentCategory) : null;
  if (payload.icon !== undefined) update.icon = payload.icon;
  if (payload.color !== undefined) update.color = payload.color;

  const updated = await Category.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!updated) return null;

  return {
    id: updated._id.toString(),
    name: updated.name,
    type: updated.type,
    parentCategory: updated.parentCategory ? updated.parentCategory.toString() : null,
    user: updated.user ? updated.user.toString() : undefined,
    icon: updated.icon || '',
    color: updated.color || '#000000',
    createdAt: (updated as any).createdAt,
    updatedAt: (updated as any).updatedAt,
  };
}

// Delete category (không cho xóa danh mục hệ thống user = null; không xóa nếu còn danh mục con)
export async function deleteCategory(id: string): Promise<{ deleted: boolean }> {
  const existing = await Category.findById(id).lean();
  if (!existing) return { deleted: false };
  if (existing.user == null) {
    throw new Error("Cannot delete system category");
  }
  const hasChildren = await Category.countDocuments({ parentCategory: new mongoose.Types.ObjectId(id) });
  if (hasChildren > 0) {
    throw new Error("Cannot delete category that has sub-categories. Remove or move sub-categories first.");
  }
  const res = await Category.findByIdAndDelete(id);
  return { deleted: !!res };
}
