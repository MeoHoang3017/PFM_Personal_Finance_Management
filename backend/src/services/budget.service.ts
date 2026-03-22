import Budget from "../models/budget.model";
import Transaction from "../models/transaction.model";
import User from "../models/user.model";
import { paginate } from "../utils/pagination";
import { BudgetResponse, PaginatedBudgetsResponse, CreateBudgetData, UpdateBudgetData, BudgetFilter, BudgetPeriodPreset } from "../types/budget.type";
import mongoose from "mongoose";
import { convertCurrency } from "./exchangeRate.service";

/** Chuẩn hóa period từ DB (legacy daily → custom). */
function normalizePeriod(period: string): BudgetPeriodPreset | "daily" {
    if (period === "daily") return "custom";
    if (["weekly", "monthly", "yearly", "custom"].includes(period)) {
        return period as BudgetPeriodPreset;
    }
    return "monthly";
}

/** Thứ Hai đầu tuần (local) 00:00:00 */
function startOfISOWeek(d: Date): Date {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = date.getDay();
    const diff = (day + 6) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

function endOfISOWeek(d: Date): Date {
    const s = startOfISOWeek(d);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
}

function startOfMonth(d: Date): Date {
    const s = new Date(d.getFullYear(), d.getMonth(), 1);
    s.setHours(0, 0, 0, 0);
    return s;
}

function endOfMonth(d: Date): Date {
    const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return e;
}

function startOfYear(d: Date): Date {
    return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function endOfYear(d: Date): Date {
    return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * Cửa sổ thời gian dùng để tính chi tiêu (theo "hôm nay" cho weekly/monthly/yearly).
 * custom / daily: dùng startDate/endDate lưu trong document.
 */
export function resolveBudgetWindow(
    budget: { period?: string; startDate?: Date | null; endDate?: Date | null },
    refDate: Date = new Date()
): { start: Date; end: Date } {
    const raw = budget.period || "monthly";
    if (raw === "daily" || normalizePeriod(raw) === "custom") {
        const start = budget.startDate ? new Date(budget.startDate) : startOfMonth(refDate);
        const end = budget.endDate ? new Date(budget.endDate) : endOfMonth(refDate);
        return { start, end };
    }
    const p = normalizePeriod(raw);
    if (p === "weekly") {
        return { start: startOfISOWeek(refDate), end: endOfISOWeek(refDate) };
    }
    if (p === "monthly") {
        return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
    }
    if (p === "yearly") {
        return { start: startOfYear(refDate), end: endOfYear(refDate) };
    }
    return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
}

/**
 * Tổng chi trong kỳ, quy đổi về [targetCurrency] (đơn vị của ngân sách hoặc user).
 */
async function getSpentInRange(
    userId: mongoose.Types.ObjectId,
    categoryId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date,
    targetCurrency: string
): Promise<number> {
    const displayCurrency = targetCurrency.toUpperCase();

    const txs = await Transaction.find({
        user: userId,
        type: "expense",
        category: categoryId,
        date: { $gte: startDate, $lte: endDate },
    })
        .populate("wallet", "currency")
        .lean();

    let total = 0;
    for (const tx of txs) {
        const w = tx.wallet as { currency?: string } | mongoose.Types.ObjectId | undefined;
        const walletCurrency =
            w != null && typeof w === "object" && "currency" in w && typeof (w as { currency?: string }).currency === "string"
                ? String((w as { currency: string }).currency).toUpperCase()
                : "USD";
        let amt = typeof tx.amount === "number" ? tx.amount : 0;
        if (walletCurrency !== displayCurrency) {
            const converted = await convertCurrency(amt, walletCurrency, displayCurrency, tx.date as Date);
            if (converted !== null) {
                amt = converted;
            }
        }
        total += amt;
    }
    return total;
}

function resolveBudgetCurrency(budget: { currency?: string }, fallbackUserCurrency: string): string {
    const c = budget.currency;
    if (c != null && String(c).trim() !== "") {
        return String(c).toUpperCase();
    }
    return fallbackUserCurrency.toUpperCase();
}

function apiPeriodFromDoc(period: string | undefined): string {
    if (period === "daily") return "custom";
    return period || "monthly";
}

function formatBudgetResponse(
    budget: any,
    window: { start: Date; end: Date },
    extra?: {
        spentAmount?: number;
        categoryName?: string;
        categoryIcon?: string;
        categoryColor?: string;
        currency: string;
    }
): BudgetResponse {
    const spent = extra?.spentAmount ?? 0;
    const amount = budget.amount ?? 0;
    const currency = extra?.currency ?? "USD";
    return {
        id: budget._id.toString(),
        amount,
        currency,
        category: (budget.category && (budget.category._id ?? budget.category)).toString(),
        ...(extra?.categoryName != null ? { categoryName: extra.categoryName } : {}),
        ...(extra?.categoryIcon != null && extra.categoryIcon !== "" ? { categoryIcon: extra.categoryIcon } : {}),
        ...(extra?.categoryColor != null && extra.categoryColor !== "" ? { categoryColor: extra.categoryColor } : {}),
        period: apiPeriodFromDoc(budget.period),
        startDate: window.start,
        endDate: window.end,
        user: (budget.user && (budget.user._id ?? budget.user)).toString(),
        isActive: budget.isActive,
        spentAmount: spent,
        isOverBudget: amount > 0 && spent > amount,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
    };
}

async function getUserBudgetsService(
    filter: BudgetFilter,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedBudgetsResponse> {
    const skip = (page - 1) * pageSize;
    const query: any = { user: filter.user };

    if (filter.category) query.category = new mongoose.Types.ObjectId(filter.category);
    if (filter.period) query.period = filter.period;
    if (filter.isActive !== undefined) query.isActive = filter.isActive;

    const totalItems = await Budget.countDocuments(query);

    const budgets = await Budget.find(query)
        .populate("category", "name icon color")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

    const userDoc = await User.findById(filter.user).select("currency").lean();
    const userCurrency = ((userDoc?.currency as string) || "USD").toUpperCase();

    const userId = new mongoose.Types.ObjectId(filter.user);
    const ref = new Date();
    const formattedBudgets = await Promise.all(
        budgets.map(async (b: any) => {
            const categoryId = b.category && (b.category._id ?? b.category);
            const window = resolveBudgetWindow(b, ref);
            const budgetCur = resolveBudgetCurrency(b, userCurrency);
            const spentAmount = await getSpentInRange(userId, categoryId, window.start, window.end, budgetCur);
            const cat = b.category as { name?: string; icon?: string; color?: string } | undefined;
            const categoryName = cat && typeof cat.name === "string" ? cat.name : undefined;
            const categoryIcon = cat && typeof cat.icon === "string" && cat.icon.trim() !== "" ? cat.icon : undefined;
            const categoryColor = cat && typeof cat.color === "string" && cat.color.trim() !== "" ? cat.color : undefined;
            return formatBudgetResponse(b, window, {
                spentAmount,
                categoryName,
                categoryIcon,
                categoryColor,
                currency: budgetCur,
            });
        })
    );
    return paginate(formattedBudgets, page, pageSize, totalItems);
}

async function getBudgetByIdService(budgetId: string): Promise<BudgetResponse> {
    const budget = await Budget.findById(budgetId).populate("category", "name icon color").lean();
    if (!budget) {
        throw new Error("Budget not found");
    }
    const userId = budget.user as mongoose.Types.ObjectId;
    const userDoc = await User.findById(userId).select("currency").lean();
    const userCurrency = ((userDoc?.currency as string) || "USD").toUpperCase();
    const cat = budget.category as { name?: string; icon?: string; color?: string; _id?: mongoose.Types.ObjectId } | undefined;
    const categoryId = cat && ((cat as any)._id ?? cat);
    const ref = new Date();
    const window = resolveBudgetWindow(budget, ref);
    const budgetCur = resolveBudgetCurrency(budget as any, userCurrency);
    const spentAmount = await getSpentInRange(userId, categoryId, window.start, window.end, budgetCur);
    const categoryName = cat && typeof cat.name === "string" ? cat.name : undefined;
    const categoryIcon = cat && typeof cat.icon === "string" && cat.icon.trim() !== "" ? cat.icon : undefined;
    const categoryColor = cat && typeof cat.color === "string" && cat.color.trim() !== "" ? cat.color : undefined;
    return formatBudgetResponse(budget, window, {
        spentAmount,
        categoryName,
        categoryIcon,
        categoryColor,
        currency: budgetCur,
    });
}

async function createBudgetService(data: CreateBudgetData): Promise<BudgetResponse> {
    const dup = await Budget.findOne({
        user: new mongoose.Types.ObjectId(data.user),
        category: new mongoose.Types.ObjectId(data.category),
    });
    if (dup) {
        throw new Error("A budget already exists for this category");
    }

    const userDoc = await User.findById(data.user).select("currency").lean();
    const userCurrency = ((userDoc?.currency as string) || "USD").toUpperCase();
    const currency = (data.currency && String(data.currency).trim() !== "" ? String(data.currency) : userCurrency).toUpperCase();

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (data.period === "custom") {
        if (!data.startDate || !data.endDate) {
            throw new Error("startDate and endDate are required for custom period");
        }
        if (data.startDate >= data.endDate) {
            throw new Error("Start date must be before end date");
        }
        startDate = data.startDate;
        endDate = data.endDate;
    }

    const budget = new Budget({
        amount: data.amount,
        category: new mongoose.Types.ObjectId(data.category),
        period: data.period,
        currency,
        ...(startDate != null ? { startDate } : {}),
        ...(endDate != null ? { endDate } : {}),
        user: new mongoose.Types.ObjectId(data.user),
        isActive: data.isActive !== undefined ? data.isActive : true,
    });

    const saved = await budget.save();
    const populated = await Budget.findById(saved._id).populate("category", "name icon color").lean();
    const ref = new Date();
    const window = resolveBudgetWindow(populated ?? saved.toObject(), ref);
    const categoryId = new mongoose.Types.ObjectId(data.category);
    const spentAmount = await getSpentInRange(
        new mongoose.Types.ObjectId(data.user),
        categoryId,
        window.start,
        window.end,
        currency
    );
    const b = populated ?? saved.toObject();
    const cat = b.category as { name?: string; icon?: string; color?: string } | undefined;
    const categoryName = cat && typeof cat.name === "string" ? cat.name : undefined;
    const categoryIcon = cat && typeof cat.icon === "string" && cat.icon.trim() !== "" ? cat.icon : undefined;
    const categoryColor = cat && typeof cat.color === "string" && cat.color.trim() !== "" ? cat.color : undefined;
    return formatBudgetResponse(b, window, { spentAmount, categoryName, categoryIcon, categoryColor, currency });
}

async function updateBudgetService(budgetId: string, data: UpdateBudgetData): Promise<BudgetResponse> {
    const budget = await Budget.findById(budgetId);
    if (!budget) {
        throw new Error("Budget not found");
    }

    const nextPeriod = data.period !== undefined ? data.period : (budget.period as BudgetPeriodPreset);
    let startDate = data.startDate !== undefined ? data.startDate : budget.startDate;
    let endDate = data.endDate !== undefined ? data.endDate : budget.endDate;

    if (nextPeriod === "custom") {
        if (!startDate || !endDate) {
            throw new Error("startDate and endDate are required for custom period");
        }
        if (startDate >= endDate) {
            throw new Error("Start date must be before end date");
        }
    }

    if (data.category !== undefined) {
        const catId = new mongoose.Types.ObjectId(data.category);
        const conflict = await Budget.findOne({
            user: budget.user,
            category: catId,
            _id: { $ne: budget._id },
        });
        if (conflict) {
            throw new Error("A budget already exists for this category");
        }
    }

    const $set: Record<string, unknown> = {};
    if (data.amount !== undefined) $set.amount = data.amount;
    if (data.category !== undefined) $set.category = new mongoose.Types.ObjectId(data.category);
    if (data.period !== undefined) $set.period = data.period;
    if (data.isActive !== undefined) $set.isActive = data.isActive;
    if (data.currency !== undefined && String(data.currency).trim() !== "") {
        $set.currency = String(data.currency).toUpperCase();
    }

    const $unset: Record<string, string> = {};
    if (nextPeriod === "custom") {
        $set.startDate = startDate;
        $set.endDate = endDate;
    } else {
        $unset.startDate = "";
        $unset.endDate = "";
    }

    const updatePayload: Record<string, unknown> = {};
    if (Object.keys($set).length > 0) {
        updatePayload.$set = $set;
    }
    if (Object.keys($unset).length > 0) {
        updatePayload.$unset = $unset;
    }

    const updated = await Budget.findByIdAndUpdate(budgetId, updatePayload, { new: true });
    if (!updated) {
        throw new Error("Budget not found");
    }

    const populated = await Budget.findById(updated._id).populate("category", "name icon color").lean();
    const ref = new Date();
    const window = resolveBudgetWindow(populated ?? updated.toObject(), ref);
    const userId = updated.user as mongoose.Types.ObjectId;
    const userDoc = await User.findById(userId).select("currency").lean();
    const userCurrency = ((userDoc?.currency as string) || "USD").toUpperCase();
    const cat = populated?.category as { name?: string; icon?: string; color?: string; _id?: mongoose.Types.ObjectId } | undefined;
    const categoryId = (cat && (cat._id ?? cat)) ?? updated.category;
    const bObj = populated ?? updated.toObject();
    const budgetCur = resolveBudgetCurrency(bObj as any, userCurrency);
    const spentAmount = await getSpentInRange(userId, categoryId, window.start, window.end, budgetCur);
    const categoryName = cat && typeof cat.name === "string" ? cat.name : undefined;
    const categoryIcon = cat && typeof cat.icon === "string" && cat.icon.trim() !== "" ? cat.icon : undefined;
    const categoryColor = cat && typeof cat.color === "string" && cat.color.trim() !== "" ? cat.color : undefined;
    return formatBudgetResponse(populated ?? updated.toObject(), window, {
        spentAmount,
        categoryName,
        categoryIcon,
        categoryColor,
        currency: budgetCur,
    });
}

async function deleteBudgetService(budgetId: string): Promise<{ message: string }> {
    const budget = await Budget.findByIdAndDelete(budgetId);
    if (!budget) {
        throw new Error("Budget not found");
    }
    return { message: "Budget deleted successfully" };
}

export {
    getUserBudgetsService,
    getBudgetByIdService,
    createBudgetService,
    updateBudgetService,
    deleteBudgetService,
};
