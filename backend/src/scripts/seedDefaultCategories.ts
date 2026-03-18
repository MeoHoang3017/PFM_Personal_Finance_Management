/**
 * Seed danh mục mặc định của hệ thống (user = null).
 * Chạy tự động khi server khởi động (sau khi kết nối DB).
 * Dùng chung cho tất cả user.
 */
import Category from "../models/category.model";

const DEFAULT_CATEGORIES = [
  // Thu nhập
  { name: "Lương", type: "income" as const, icon: "work", color: "#4CAF50" },
  { name: "Thưởng", type: "income" as const, icon: "card_giftcard", color: "#8BC34A" },
  { name: "Đầu tư", type: "income" as const, icon: "trending_up", color: "#2196F3" },
  { name: "Thu nhập khác", type: "income" as const, icon: "attach_money", color: "#9E9E9E" },
  // Chi tiêu
  { name: "Ăn uống", type: "expense" as const, icon: "restaurant", color: "#FF5722" },
  { name: "Di chuyển", type: "expense" as const, icon: "directions_car", color: "#FF9800" },
  { name: "Nhà ở", type: "expense" as const, icon: "home", color: "#795548" },
  { name: "Giải trí", type: "expense" as const, icon: "movie", color: "#9C27B0" },
  { name: "Mua sắm", type: "expense" as const, icon: "shopping_cart", color: "#E91E63" },
  { name: "Sức khỏe", type: "expense" as const, icon: "local_hospital", color: "#F44336" },
  { name: "Giáo dục", type: "expense" as const, icon: "school", color: "#3F51B5" },
  { name: "Chi tiêu khác", type: "expense" as const, icon: "category", color: "#607D8B" },
];

export async function runSeedDefaultCategories(): Promise<void> {
  try {
    const existingCount = await Category.countDocuments({ user: null });
    if (existingCount > 0) {
      console.log(`Default categories already exist (${existingCount}). Skip seed.`);
      return;
    }

    await Category.insertMany(
      DEFAULT_CATEGORIES.map((c) => ({
        name: c.name,
        type: c.type,
        parentCategory: null,
        icon: c.icon,
        color: c.color,
        user: null,
      }))
    );
    console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
  } catch (error) {
    console.error("Failed to seed default categories:", error);
    throw error;
  }
}
