/**
 * Seed dữ liệu mẫu: 5 user, mỗi user có ví mặc định và giao dịch rải đều 5 tháng gần nhất.
 * Mỗi tháng: 20–40 giao dịch (thu + chi), category đầy đủ.
 * Chạy: npx tsx src/scripts/seedSampleData.ts hoặc npm run seed:sample
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/database";
import { runSeedDefaultCategories } from "./seedDefaultCategories";
import { hashPassword } from "../utils/hasher";
import { User, Wallet, Transaction, Category } from "../models";

dotenv.config();

const SAMPLE_USERS = [
  { username: "user1", email: "user1@sample.com", password: "123456" },
  { username: "user2", email: "user2@sample.com", password: "123456" },
  { username: "user3", email: "user3@sample.com", password: "123456" },
  { username: "user4", email: "user4@sample.com", password: "123456" },
  { username: "user5", email: "user5@sample.com", password: "123456" },
];

const INCOME_CATEGORIES = ["Lương", "Thưởng", "Đầu tư", "Thu nhập khác"];
const EXPENSE_CATEGORIES = [
  "Ăn uống",
  "Di chuyển",
  "Nhà ở",
  "Giải trí",
  "Mua sắm",
  "Sức khỏe",
  "Giáo dục",
  "Chi tiêu khác",
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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function getMonthRange(monthOffset: number): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthOffset;
  let y = year;
  let m = month;
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
  const incomeNames = categories.filter((c) => c.type === "income").map((c) => c.name);
  const expenseNames = categories.filter((c) => c.type === "expense").map((c) => c.name);

  const useIncomeCategories = incomeNames.length > 0 ? incomeNames : INCOME_CATEGORIES;
  const useExpenseCategories = expenseNames.length > 0 ? expenseNames : EXPENSE_CATEGORIES;

  const createdUserIds: mongoose.Types.ObjectId[] = [];
  const userWallets: { userId: mongoose.Types.ObjectId; walletId: mongoose.Types.ObjectId }[] = [];

  for (const u of SAMPLE_USERS) {
    const existing = await User.findOne({ $or: [{ email: u.email }, { username: u.username }] });
    if (existing) {
      const w = await Wallet.findOne({ user: existing._id });
      if (w) {
        createdUserIds.push(existing._id);
        userWallets.push({ userId: existing._id, walletId: w._id });
      } else {
        const defaultWallet = new Wallet({
          name: "Ví mặc định",
          balance: 0,
          user: existing._id,
        });
        await defaultWallet.save();
        createdUserIds.push(existing._id);
        userWallets.push({ userId: existing._id, walletId: defaultWallet._id });
      }
      console.log(`User ${u.email} already exists, skip create.`);
      continue;
    }

    const hashedPassword = await hashPassword(u.password);
    const newUser = new User({
      username: u.username,
      email: u.email,
      password: hashedPassword,
      theme: "light",
      language: "vi",
      currency: "VND",
    });
    await newUser.save();
    createdUserIds.push(newUser._id);

    const defaultWallet = new Wallet({
      name: "Ví mặc định",
      balance: 0,
      user: newUser._id,
    });
    await defaultWallet.save();
    userWallets.push({ userId: newUser._id, walletId: defaultWallet._id });
    console.log(`Created user: ${u.email}`);
  }

  for (const { userId, walletId } of userWallets) {
    const existingCount = await Transaction.countDocuments({ user: userId });
    if (existingCount >= 50) {
      console.log(`User ${userId} already has ${existingCount} transactions, skip.`);
      continue;
    }

    let totalIncome = 0;
    let totalExpense = 0;

    for (let monthOffset = 0; monthOffset < 5; monthOffset++) {
      const { start, end } = getMonthRange(monthOffset);
      const count = randomInt(20, 40);
      const transactions: any[] = [];

      for (let i = 0; i < count; i++) {
        const isIncome = Math.random() < 0.35;
        const category = isIncome
          ? randomChoice(useIncomeCategories)
          : randomChoice(useExpenseCategories);
        const descMap = isIncome ? INCOME_DESCRIPTIONS : EXPENSE_DESCRIPTIONS;
        const options = (descMap as any)[category];
        const description = Array.isArray(options)
          ? randomChoice(options)
          : (isIncome ? "Thu nhập" : "Chi tiêu");

        let amount: number;
        if (isIncome) {
          amount = randomChoice([500000, 1000000, 15000000, 20000000, 25000000, 3000000, 5000000]);
        } else {
          amount = randomChoice([
            15000, 35000, 50000, 75000, 120000, 200000, 350000, 500000, 800000, 1500000,
          ]);
        }

        const date = randomDateInRange(start, end);
        transactions.push({
          amount,
          type: isIncome ? "income" : "expense",
          category,
          date,
          description,
          notes: "",
          wallet: walletId,
          user: userId,
        });

        if (isIncome) totalIncome += amount;
        else totalExpense += amount;
      }

      await Transaction.insertMany(transactions);
    }

    const balance = totalIncome - totalExpense;
    await Wallet.updateOne({ _id: walletId }, { $set: { balance } });
    console.log(`User ${userId}: ${await Transaction.countDocuments({ user: userId })} transactions, balance ${balance}`);
  }

  console.log("Seed sample data done.");
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
