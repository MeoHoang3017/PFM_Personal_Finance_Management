/**
 * Seed dữ liệu mẫu chuẩn để test toàn bộ luồng hệ thống và mọi chức năng:
 * - User (đăng nhập, cài đặt theme/ngôn ngữ/tiền tệ)
 * - Ví (nhiều ví để test chọn ví, giao dịch theo ví)
 * - Giao dịch (thu/chi, 12 tháng, categoryId, filter, báo cáo)
 * - Ngân sách (theo category, monthly)
 * - Mục tiêu (targetAmount, currentAmount, dueDate)
 *
 * Chạy: npx tsx src/scripts/seedSampleData.ts hoặc npm run seed:sample
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/database";
import { runSeedDefaultCategories } from "./seedDefaultCategories";
import { hashPassword } from "../utils/hasher";
import { User, Wallet, Transaction, Category, Budget, Goal } from "../models";

dotenv.config();

// --- Cấu hình user mẫu (password chung: 123456) ---
const SAMPLE_USERS = [
  { username: "demo", email: "demo@pfm.local", password: "123456", theme: "light" as const, language: "vi", currency: "VND" },
  { username: "user1", email: "user1@sample.com", password: "123456", theme: "light" as const, language: "vi", currency: "VND" },
  { username: "user2", email: "user2@sample.com", password: "123456", theme: "dark" as const, language: "en", currency: "USD" },
  { username: "user3", email: "user3@sample.com", password: "123456", theme: "light" as const, language: "vi", currency: "VND" },
];

const INCOME_DESCRIPTIONS: Record<string, string[]> = {
  "Lương": ["Lương tháng", "Lương công ty", "Tiền lương"],
  "Thưởng": ["Thưởng cuối năm", "Thưởng dự án", "Thưởng hiệu suất"],
  "Đầu tư": ["Cổ tức", "Lãi tiết kiệm", "Thu nhập đầu tư"],
  "Thu nhập khác": ["Thu nợ", "Tiền quà", "Hoàn thuế"],
};

const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  "Ăn uống": ["Cơm trưa", "Cafe", "Ăn tối", "Siêu thị", "Giao đồ ăn"],
  "Di chuyển": ["Xăng xe", "Grab", "Bảo trì xe", "Gửi xe"],
  "Nhà ở": ["Tiền nhà", "Điện nước", "Internet", "Vệ sinh"],
  "Giải trí": ["Xem phim", "Netflix", "Game", "Du lịch"],
  "Mua sắm": ["Mua quần áo", "Điện thoại", "Đồ gia dụng"],
  "Sức khỏe": ["Khám bệnh", "Thuốc", "Bảo hiểm"],
  "Giáo dục": ["Học phí", "Sách", "Khóa học online"],
  "Chi tiêu khác": ["Quà tặng", "Phí ngân hàng", "Khác"],
};

const INCOME_AMOUNTS = [500000, 1000000, 3000000, 5000000, 15000000, 20000000, 25000000];
const EXPENSE_AMOUNTS = [15000, 35000, 50000, 75000, 120000, 200000, 350000, 500000, 800000, 1500000];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function getMonthRange(monthOffset: number): { start: Date; end: Date } {
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth() - monthOffset;
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function randomDateInRange(start: Date, end: Date): Date {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(t);
}

export async function runSeedSampleData(): Promise<void> {
  await runSeedDefaultCategories();

  const categories = await Category.find({ user: null }).lean();
  const incomeCats = categories.filter((c) => c.type === "income");
  const expenseCats = categories.filter((c) => c.type === "expense");

  if (incomeCats.length === 0 || expenseCats.length === 0) {
    console.log("No default categories. Skip seed.");
    return;
  }

  const userWallets: { userId: mongoose.Types.ObjectId; wallets: mongoose.Types.ObjectId[] }[] = [];

  // --- Tạo user và ví ---
  for (const u of SAMPLE_USERS) {
    let user = await User.findOne({ $or: [{ email: u.email }, { username: u.username }] }).select("+password");
    if (!user) {
      const hashedPassword = await hashPassword(u.password);
      user = new User({
        username: u.username,
        email: u.email,
        password: hashedPassword,
        theme: u.theme,
        language: u.language,
        currency: u.currency,
      });
      await user.save();
      console.log(`Created user: ${u.email}`);
    } else {
      console.log(`User ${u.email} already exists.`);
    }

    let wallets = await Wallet.find({ user: user._id }).lean();
    if (wallets.length === 0) {
      const defaultWallet = new Wallet({ name: "Ví mặc định", balance: 0, currency: u.currency, user: user._id });
      await defaultWallet.save();
      const defaultLean = await Wallet.findById(defaultWallet._id).lean();
      if (defaultLean) wallets = [defaultLean];
      if (u.username === "demo") {
        const second = new Wallet({ name: "Ví tiết kiệm", balance: 0, currency: u.currency, user: user._id });
        await second.save();
        const secondLean = await Wallet.findById(second._id).lean();
        if (secondLean) wallets.push(secondLean);
      }
      console.log(`Created ${wallets.length} wallet(s) for ${u.email}`);
    }
    userWallets.push({ userId: user._id, wallets: wallets.map((w) => w._id) });
  }

  // --- Giao dịch: 12 tháng, mỗi user ~25–45 giao dịch/tháng, dùng categoryId ---
  for (const { userId, wallets } of userWallets) {
    const existingCount = await Transaction.countDocuments({ user: userId });
    if (existingCount >= 400) {
      console.log(`User ${userId} already has ${existingCount} transactions. Skip.`);
      continue;
    }

    const defaultWalletId = wallets[0]!;
    let totalIncome = 0;
    let totalExpense = 0;

    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const { start, end } = getMonthRange(monthOffset);
      const count = randomInt(25, 45);
      const transactions: any[] = [];

      for (let i = 0; i < count; i++) {
        const isIncome = Math.random() < 0.35;
        const catDoc = isIncome ? randomChoice(incomeCats) : randomChoice(expenseCats);
        const categoryId = catDoc._id;
        const categoryName = catDoc.name;
        const descMap = isIncome ? INCOME_DESCRIPTIONS : EXPENSE_DESCRIPTIONS;
        const options = (descMap as any)[categoryName];
        const description = Array.isArray(options) ? randomChoice(options) : (isIncome ? "Thu nhập" : "Chi tiêu");
        const amount = isIncome ? randomChoice(INCOME_AMOUNTS) : randomChoice(EXPENSE_AMOUNTS);
        const date = randomDateInRange(start, end);

        transactions.push({
          amount,
          type: isIncome ? "income" : "expense",
          category: categoryId,
          date,
          description,
          notes: "",
          wallet: defaultWalletId,
          user: userId,
        });

        if (isIncome) totalIncome += amount;
        else totalExpense += amount;
      }

      await Transaction.insertMany(transactions);
    }

    const balance = totalIncome - totalExpense;
    await Wallet.updateOne({ _id: defaultWalletId }, { $set: { balance } });
    const totalTx = await Transaction.countDocuments({ user: userId });
    console.log(`User ${userId}: ${totalTx} transactions, balance ${balance}`);
  }

  // --- Ngân sách: mỗi user 2–4 budget monthly (expense category), tháng hiện tại ---
  const now = new Date();
  const budgetStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const budgetEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  for (const { userId } of userWallets) {
    const existingBudgets = await Budget.countDocuments({ user: userId });
    if (existingBudgets >= 4) continue;

    const budgetCategories = expenseCats.slice(0, 4);
    for (const cat of budgetCategories) {
      const already = await Budget.findOne({ user: userId, category: cat._id, startDate: budgetStart });
      if (already) continue;

      await Budget.create({
        amount: randomChoice([500000, 1000000, 2000000, 3000000]),
        category: cat._id,
        period: "monthly",
        startDate: budgetStart,
        endDate: budgetEnd,
        user: userId,
        isActive: true,
      });
    }
    console.log(`Budgets created for user ${userId}`);
  }

  // --- Mục tiêu: mỗi user 2–3 goals, dueDate trong tương lai ---
  const goalTemplates = [
    { title: "Mua xe máy", targetAmount: 25000000, currentAmount: 5000000 },
    { title: "Du lịch cuối năm", targetAmount: 15000000, currentAmount: 3000000 },
    { title: "Quỹ khẩn cấp", targetAmount: 50000000, currentAmount: 10000000 },
  ];

  for (const { userId } of userWallets) {
    const existingGoals = await Goal.countDocuments({ user: userId });
    if (existingGoals >= 3) continue;

    const dueDate = new Date(now.getFullYear() + 1, now.getMonth(), 15);
    for (let i = 0; i < 3; i++) {
      const t = goalTemplates[i]!;
      const exists = await Goal.findOne({ user: userId, title: t.title });
      if (exists) continue;
      await Goal.create({
        title: t.title,
        targetAmount: t.targetAmount,
        currentAmount: t.currentAmount,
        dueDate: new Date(dueDate.getTime() + i * 30 * 24 * 60 * 60 * 1000),
        user: userId,
      });
    }
    console.log(`Goals created for user ${userId}`);
  }

  console.log("Seed sample data done. Use demo@pfm.local / 123456 to test.");
}

async function main() {
  await connectDB();
  await runSeedSampleData();
  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
