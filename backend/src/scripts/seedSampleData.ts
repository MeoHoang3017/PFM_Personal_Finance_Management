/**
 * Seed dữ liệu mẫu để demo PFM (đăng nhập, ví, giao dịch, báo cáo, ngân sách).
 *
 * Tài khoản (mật khẩu: 123456):
 * - demo@pfm.local — giao diện VI, VND + ví USD; có thêm giao dịch "neo" tháng hiện tại.
 * - en@pfm.local — giao diện EN, USD + ví VND.
 *
 * Chạy: npx tsx src/scripts/seedSampleData.ts
 *       npm run seed:sample
 * Seed lại từ đầu (xóa giao dịch + ngân sách của user mẫu, reset số dư ví): thêm --reset
 *       npx tsx src/scripts/seedSampleData.ts --reset
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/database";
import { runSeedDefaultCategories } from "./seedDefaultCategories";
import { runSeedCurrenciesAndExchangeRates } from "./seedCurrenciesAndExchangeRates";
import { hashPassword } from "../utils/hasher";
import { User, Wallet, Transaction, Category, Budget, ExchangeRate } from "../models";

dotenv.config();

const RESET_SAMPLE = process.argv.includes("--reset");

/** User mẫu — chỉ 2 tài khoản, đủ để demo đa tiền tệ + đa ngôn ngữ */
const SAMPLE_USERS = [
  {
    username: "demo",
    email: "demo@pfm.local",
    password: "123456",
    theme: "light" as const,
    language: "vi",
    currency: "VND",
  },
  {
    username: "demo_en",
    email: "en@pfm.local",
    password: "123456",
    theme: "light" as const,
    language: "en",
    currency: "USD",
  },
];

const INCOME_DESCRIPTIONS: Record<string, string[]> = {
  Lương: ["Lương tháng", "Lương công ty", "Chuyển khoản lương"],
  Thưởng: ["Thưởng dự án", "Thưởng hiệu suất"],
  "Đầu tư": ["Cổ tức", "Lãi tiết kiệm"],
  "Thu nhập khác": ["Thu nợ", "Hoàn thuế", "Thu nhập phụ"],
};

const EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  "Ăn uống": ["Cơm trưa VP", "Cafe", "Ăn tối", "Siêu thị", "GrabFood"],
  "Di chuyển": ["Xăng xe", "Grab", "Gửi xe", "Bảo trì"],
  "Nhà ở": ["Tiền nhà", "Điện nước", "Internet"],
  "Giải trí": ["Xem phim", "Netflix", "Du lịch cuối tuần"],
  "Mua sắm": ["Quần áo", "Phụ kiện"],
  "Sức khỏe": ["Khám định kỳ", "Thuốc"],
  "Giáo dục": ["Khóa học online", "Sách"],
  "Chi tiêu khác": ["Quà tặng", "Phí ngân hàng"],
};

/** Mô tả tiếng Anh (cùng key category tiếng Việt từ DB) */
const INCOME_DESCRIPTIONS_EN: Record<string, string[]> = {
  Lương: ["Salary deposit", "Payroll"],
  Thưởng: ["Project bonus", "Performance bonus"],
  "Đầu tư": ["Dividend", "Interest"],
  "Thu nhập khác": ["Refund", "Side income"],
};

const EXPENSE_DESCRIPTIONS_EN: Record<string, string[]> = {
  "Ăn uống": ["Lunch", "Coffee", "Dinner", "Groceries"],
  "Di chuyển": ["Gas", "Ride share", "Parking"],
  "Nhà ở": ["Rent", "Utilities", "Internet"],
  "Giải trí": ["Movies", "Streaming", "Weekend trip"],
  "Mua sắm": ["Clothes", "Gadgets"],
  "Sức khỏe": ["Checkup", "Pharmacy"],
  "Giáo dục": ["Online course", "Books"],
  "Chi tiêu khác": ["Gift", "Bank fee"],
};

const INCOME_AMOUNTS = [3_000_000, 5_000_000, 8_000_000, 12_000_000, 18_000_000, 25_000_000];
const EXPENSE_AMOUNTS = [35_000, 55_000, 120_000, 250_000, 450_000, 890_000, 1_500_000, 2_400_000];
const INCOME_AMOUNTS_USD = [80, 150, 350, 800, 1_500, 3_200, 4_500];
const EXPENSE_AMOUNTS_USD = [3, 6, 12, 25, 45, 75, 120, 200];

type LeanCat = { _id: mongoose.Types.ObjectId; name: string; type: string };

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

async function seedFixedExchangeRatesForToday(): Promise<void> {
  const dateOnly = new Date();
  dateOnly.setHours(0, 0, 0, 0);

  const samples: Array<{ baseCurrency: string; targetCurrency: string; rate: number }> = [
    { baseCurrency: "USD", targetCurrency: "VND", rate: 25_450 },
    { baseCurrency: "USD", targetCurrency: "EUR", rate: 0.92 },
    { baseCurrency: "USD", targetCurrency: "GBP", rate: 0.79 },
    { baseCurrency: "USD", targetCurrency: "JPY", rate: 150 },
  ];

  for (const s of samples) {
    await ExchangeRate.updateOne(
      { baseCurrency: s.baseCurrency, targetCurrency: s.targetCurrency, date: dateOnly },
      { $set: { baseCurrency: s.baseCurrency, targetCurrency: s.targetCurrency, rate: s.rate, date: dateOnly, source: "seed" } },
      { upsert: true }
    );
  }

  console.log(`[Seed Exchange Rates] Upserted ${samples.length} sample USD rates for ${dateOnly.toISOString().slice(0, 10)}`);
}

async function resetSampleUsersData(sampleEmails: string[]): Promise<void> {
  const users = await User.find({ email: { $in: sampleEmails } }).select("_id email").lean();
  if (users.length === 0) {
    console.log("[Reset] Không có user mẫu trong DB — bỏ qua.");
    return;
  }
  for (const u of users) {
    const uid = u._id as mongoose.Types.ObjectId;
    const dr = await Transaction.deleteMany({ user: uid });
    const br = await Budget.deleteMany({ user: uid });
    await Wallet.updateMany({ user: uid }, { $set: { balance: 0 } });
    console.log(`[Reset] ${u.email}: xóa ${dr.deletedCount} giao dịch, ${br.deletedCount} ngân sách; số dư ví = 0`);
  }
}

/** Giao dịch cố định tháng hiện tại — tài khoản demo@pfm.local (VND + USD) */
function buildAnchorTransactionsDemoVn(
  userId: mongoose.Types.ObjectId,
  walletVndId: mongoose.Types.ObjectId,
  walletUsdId: mongoose.Types.ObjectId | null,
  incomeCats: LeanCat[],
  expenseCats: LeanCat[]
): Record<string, unknown>[] {
  const incomeId = (n: string) => incomeCats.find((c) => c.name === n)!._id;
  const expenseId = (n: string) => expenseCats.find((c) => c.name === n)!._id;
  const { start } = getMonthRange(0);
  const y = start.getFullYear();
  const m = start.getMonth();
  const at = (day: number, hour = 12) => new Date(y, m, day, hour, 0, 0, 0);

  const txs: Record<string, unknown>[] = [
    {
      amount: 18_500_000,
      currency: "VND",
      type: "income",
      category: incomeId("Lương"),
      date: at(5, 9),
      description: "Lương tháng (demo)",
      notes: "PFM seed",
      wallet: walletVndId,
      user: userId,
    },
    {
      amount: 4_800_000,
      currency: "VND",
      type: "expense",
      category: expenseId("Nhà ở"),
      date: at(1, 8),
      description: "Tiền thuê nhà",
      notes: "",
      wallet: walletVndId,
      user: userId,
    },
    {
      amount: 350_000,
      currency: "VND",
      type: "expense",
      category: expenseId("Di chuyển"),
      date: at(3),
      description: "Đổ xăng + gửi xe",
      notes: "",
      wallet: walletVndId,
      user: userId,
    },
  ];

  for (const day of [10, 14, 18, 22, 26]) {
    txs.push({
      amount: 95_000 + (day % 7) * 12_000,
      currency: "VND",
      type: "expense",
      category: expenseId("Ăn uống"),
      date: at(day, 12),
      description: day === 14 ? "Cafe team building" : "Ăn trưa công ty",
      notes: "",
      wallet: walletVndId,
      user: userId,
    });
  }

  txs.push({
    amount: 1_800_000,
    currency: "VND",
    type: "income",
    category: incomeId("Thưởng"),
    date: at(25, 15),
    description: "Thưởng KPI quý",
    notes: "",
    wallet: walletVndId,
    user: userId,
  });

  if (walletUsdId) {
    txs.push(
      {
        amount: 520,
        currency: "USD",
        type: "income",
        category: incomeId("Thu nhập khác"),
        date: at(16, 11),
        description: "Freelance (USD)",
        notes: "",
        wallet: walletUsdId,
        user: userId,
      },
      {
        amount: 89,
        currency: "USD",
        type: "expense",
        category: expenseId("Mua sắm"),
        date: at(19),
        description: "Đơn hàng online (USD)",
        notes: "",
        wallet: walletUsdId,
        user: userId,
      }
    );
  }

  return txs;
}

/** Giao dịch neo — en@pfm.local (USD + ví VND) */
function buildAnchorTransactionsDemoEn(
  userId: mongoose.Types.ObjectId,
  walletUsdId: mongoose.Types.ObjectId,
  walletVndId: mongoose.Types.ObjectId | null,
  incomeCats: LeanCat[],
  expenseCats: LeanCat[]
): Record<string, unknown>[] {
  const incomeId = (n: string) => incomeCats.find((c) => c.name === n)!._id;
  const expenseId = (n: string) => expenseCats.find((c) => c.name === n)!._id;
  const { start } = getMonthRange(0);
  const y = start.getFullYear();
  const m = start.getMonth();
  const at = (day: number) => new Date(y, m, day, 12, 0, 0, 0);

  const txs: Record<string, unknown>[] = [
    {
      amount: 4_200,
      currency: "USD",
      type: "income",
      category: incomeId("Lương"),
      date: at(5),
      description: "Monthly salary (demo)",
      notes: "PFM seed",
      wallet: walletUsdId,
      user: userId,
    },
    {
      amount: 1_350,
      currency: "USD",
      type: "expense",
      category: expenseId("Nhà ở"),
      date: at(1),
      description: "Rent",
      notes: "",
      wallet: walletUsdId,
      user: userId,
    },
    {
      amount: 45,
      currency: "USD",
      type: "expense",
      category: expenseId("Ăn uống"),
      date: at(11),
      description: "Lunch",
      notes: "",
      wallet: walletUsdId,
      user: userId,
    },
    {
      amount: 120,
      currency: "USD",
      type: "expense",
      category: expenseId("Giải trí"),
      date: at(20),
      description: "Weekend outing",
      notes: "",
      wallet: walletUsdId,
      user: userId,
    },
  ];

  if (walletVndId) {
    txs.push({
      amount: 180_000,
      currency: "VND",
      type: "expense",
      category: expenseId("Ăn uống"),
      date: at(15),
      description: "Ăn phở (VND wallet)",
      notes: "",
      wallet: walletVndId,
      user: userId,
    });
  }

  return txs;
}

export async function runSeedSampleData(): Promise<void> {
  await runSeedCurrenciesAndExchangeRates();
  await runSeedDefaultCategories();
  await seedFixedExchangeRatesForToday();

  const sampleEmails = SAMPLE_USERS.map((u) => u.email);
  if (RESET_SAMPLE) {
    console.log("[Seed] --reset: xóa giao dịch & ngân sách user mẫu, reset số dư ví.");
    await resetSampleUsersData(sampleEmails);
  }

  const categories = await Category.find({ user: null }).lean();
  const incomeCats = categories.filter((c) => c.type === "income") as unknown as LeanCat[];
  const expenseCats = categories.filter((c) => c.type === "expense") as unknown as LeanCat[];

  if (incomeCats.length === 0 || expenseCats.length === 0) {
    console.log("No default categories. Skip seed.");
    return;
  }

  type WalletSeedRef = { id: mongoose.Types.ObjectId; currency: string };
  type UserWalletSeed = {
    userId: mongoose.Types.ObjectId;
    email: string;
    language: string;
    currency: string;
    wallets: WalletSeedRef[];
  };

  const userWallets: UserWalletSeed[] = [];

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

    const cur = u.currency.toUpperCase();
    const primaryName = cur === "VND" ? "Ví chi tiêu (VND)" : "Main wallet (USD)";
    let primary = await Wallet.findOne({
      user: user._id,
      name: { $in: [primaryName, "Ví mặc định", "Ví chi tiêu (VND)", "Main wallet (USD)"] },
    }).lean();
    if (!primary) {
      const created = await Wallet.create({ name: primaryName, balance: 0, currency: cur, user: user._id });
      primary = created.toObject() as NonNullable<typeof primary>;
    }
    if (!primary) throw new Error(`Không tạo được ví chính cho ${u.email}`);

    const wallets: WalletSeedRef[] = [{ id: primary._id as mongoose.Types.ObjectId, currency: (primary.currency as string) || cur }];

    if (u.email === "demo@pfm.local") {
      let usd = await Wallet.findOne({ user: user._id, name: { $in: ["Ví USD (dự phòng)", "Ví tiết kiệm (USD)"] } }).lean();
      if (!usd) {
        const created = await Wallet.create({ name: "Ví USD (dự phòng)", balance: 0, currency: "USD", user: user._id });
        usd = created.toObject() as NonNullable<typeof usd>;
      }
      if (!usd) throw new Error("Không tạo được ví USD demo");
      wallets.push({ id: usd._id as mongoose.Types.ObjectId, currency: "USD" });
    }

    if (u.email === "en@pfm.local") {
      let vnd = await Wallet.findOne({ user: user._id, name: { $in: ["Ví VND (chi tiêu)", "Ví chi tiêu (VND)"] } }).lean();
      if (!vnd) {
        const created = await Wallet.create({ name: "Ví VND (chi tiêu)", balance: 0, currency: "VND", user: user._id });
        vnd = created.toObject() as NonNullable<typeof vnd>;
      }
      if (!vnd) throw new Error("Không tạo được ví VND demo EN");
      if (!wallets.some((w) => w.currency === "VND")) {
        wallets.push({ id: vnd._id as mongoose.Types.ObjectId, currency: "VND" });
      }
    }

    console.log(`Wallets for ${u.email}: ${wallets.map((w) => w.currency).join(", ")}`);
    userWallets.push({
      userId: user._id as mongoose.Types.ObjectId,
      email: u.email,
      language: u.language,
      currency: cur,
      wallets,
    });
  }

  for (const uw of userWallets) {
    const existingCount = await Transaction.countDocuments({ user: uw.userId });
    if (existingCount > 0 && !RESET_SAMPLE) {
      console.log(`User ${uw.email} already has ${existingCount} transactions. Skip transaction seed (dùng --reset để ghi đè).`);
      continue;
    }

    const balanceByWalletId = new Map<string, number>();
    for (const w of uw.wallets) balanceByWalletId.set(w.id.toString(), 0);

    const isVi = uw.language === "vi";
    const incDesc = isVi ? INCOME_DESCRIPTIONS : INCOME_DESCRIPTIONS_EN;
    const expDesc = isVi ? EXPENSE_DESCRIPTIONS : EXPENSE_DESCRIPTIONS_EN;

    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const { start, end } = getMonthRange(monthOffset);
      const isCurrentMonthAnchors =
        monthOffset === 0 && (uw.email === "demo@pfm.local" || uw.email === "en@pfm.local");

      let anchorBatch: Record<string, unknown>[] = [];
      if (isCurrentMonthAnchors) {
        if (uw.email === "demo@pfm.local") {
          const wVnd = uw.wallets.find((x) => x.currency === "VND");
          const wUsd = uw.wallets.find((x) => x.currency === "USD");
          if (wVnd) {
            anchorBatch = buildAnchorTransactionsDemoVn(uw.userId, wVnd.id, wUsd?.id ?? null, incomeCats, expenseCats);
          }
        } else if (uw.email === "en@pfm.local") {
          const wUsd = uw.wallets.find((x) => x.currency === "USD");
          const wVnd = uw.wallets.find((x) => x.currency === "VND");
          if (wUsd) {
            anchorBatch = buildAnchorTransactionsDemoEn(uw.userId, wUsd.id, wVnd?.id ?? null, incomeCats, expenseCats);
          }
        }
      }

      const baseRandom = monthOffset === 0 && anchorBatch.length > 0 ? randomInt(14, 24) : randomInt(22, 38);
      const transactions: Record<string, unknown>[] = [...anchorBatch];

      for (const row of anchorBatch) {
        const wid = (row.wallet as mongoose.Types.ObjectId).toString();
        const amt = row.amount as number;
        const isInc = row.type === "income";
        const prev = balanceByWalletId.get(wid) ?? 0;
        balanceByWalletId.set(wid, isInc ? prev + amt : prev - amt);
      }

      for (let i = 0; i < baseRandom; i++) {
        const walletRef = randomChoice(uw.wallets);
        const walletId = walletRef.id;
        const walletCurrency = (walletRef.currency || "USD").toUpperCase();
        const isIncome = Math.random() < 0.34;
        const catDoc = isIncome ? randomChoice(incomeCats) : randomChoice(expenseCats);
        const categoryId = catDoc._id;
        const categoryName = catDoc.name;
        const descMap = isIncome ? incDesc : expDesc;
        const options = (descMap as Record<string, string[]>)[categoryName];
        const description = Array.isArray(options) ? randomChoice(options) : isIncome ? "Income" : "Expense";
        const amount =
          walletCurrency === "USD"
            ? isIncome
              ? randomChoice(INCOME_AMOUNTS_USD)
              : randomChoice(EXPENSE_AMOUNTS_USD)
            : isIncome
              ? randomChoice(INCOME_AMOUNTS)
              : randomChoice(EXPENSE_AMOUNTS);
        const date = randomDateInRange(start, end);

        transactions.push({
          amount,
          currency: walletCurrency,
          type: isIncome ? "income" : "expense",
          category: categoryId,
          date,
          description,
          notes: "",
          wallet: walletId,
          user: uw.userId,
        });

        const key = walletId.toString();
        const prev = balanceByWalletId.get(key) ?? 0;
        balanceByWalletId.set(key, isIncome ? prev + amount : prev - amount);
      }

      try {
        if (transactions.length > 0) {
          await Transaction.insertMany(transactions);
        }
      } catch (err: unknown) {
        const code = err && typeof err === "object" && "code" in err ? (err as { code?: number }).code : undefined;
        if (code === 11000) {
          console.warn(`User ${uw.email}: duplicate key, skip month ${monthOffset}`);
        } else {
          throw err;
        }
      }
    }

    await Promise.all(
      Array.from(balanceByWalletId.entries()).map(([walletId, balance]) =>
        Wallet.updateOne({ _id: new mongoose.Types.ObjectId(walletId) }, { $set: { balance } })
      )
    );
    const totalTx = await Transaction.countDocuments({ user: uw.userId });
    console.log(`User ${uw.email}: ${totalTx} giao dịch, ${uw.wallets.length} ví`);
  }

  const budgetAmountsVnd: Record<string, number> = {
    "Ăn uống": 9_000_000,
    "Di chuyển": 2_500_000,
    "Nhà ở": 6_000_000,
    "Giải trí": 3_000_000,
    "Mua sắm": 4_000_000,
  };
  const budgetAmountsUsd: Record<string, number> = {
    "Ăn uống": 450,
    "Di chuyển": 120,
    "Nhà ở": 1_400,
    "Giải trí": 200,
    "Mua sắm": 180,
  };

  for (const uw of userWallets) {
    const cur = uw.currency;
    const map = cur === "VND" ? budgetAmountsVnd : budgetAmountsUsd;
    for (const cat of expenseCats) {
      const amt = map[cat.name];
      if (amt == null) continue;
      const already = await Budget.findOne({ user: uw.userId, category: cat._id });
      if (already) continue;
      try {
        await Budget.create({
          amount: amt,
          category: cat._id,
          period: "monthly",
          user: uw.userId,
          isActive: true,
          currency: cur,
        });
      } catch (err: unknown) {
        const code = err && typeof err === "object" && "code" in err ? (err as { code?: number }).code : undefined;
        if (code !== 11000) throw err;
      }
    }
    console.log(`Ngân sách đã đảm bảo cho ${uw.email}`);
  }

  console.log("");
  console.log("=== Demo ===");
  console.log("  demo@pfm.local / 123456  (VI, VND + USD)");
  console.log("  en@pfm.local   / 123456  (EN, USD + VND)");
  console.log("Chạy lại từ đầu: npx tsx src/scripts/seedSampleData.ts --reset");
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
