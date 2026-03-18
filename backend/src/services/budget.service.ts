import Budget from "../models/budget.model";
import Transaction from "../models/transaction.model";
import { paginate } from "../utils/pagination";
import { BudgetResponse, PaginatedBudgetsResponse, CreateBudgetData, UpdateBudgetData, BudgetFilter } from "../types/budget.type";
import mongoose from "mongoose";

/**
 * Tổng chi (expense) của user trong category và khoảng thời gian [startDate, endDate].
 */
async function getSpentInRange(
    userId: mongoose.Types.ObjectId,
    categoryId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date
): Promise<number> {
    const result = await Transaction.aggregate([
        {
            $match: {
                user: userId,
                type: "expense",
                category: categoryId,
                date: { $gte: startDate, $lte: endDate },
            },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    return result[0]?.total ?? 0;
}

function formatBudgetResponse(budget: any, extra?: { spentAmount?: number; categoryName?: string }): BudgetResponse {
    const spent = extra?.spentAmount ?? 0;
    const amount = budget.amount ?? 0;
    return {
        id: budget._id.toString(),
        amount,
        category: (budget.category && (budget.category._id ?? budget.category)).toString(),
        ...(extra?.categoryName != null ? { categoryName: extra.categoryName } : {}),
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
        user: (budget.user && (budget.user._id ?? budget.user)).toString(),
        isActive: budget.isActive,
        spentAmount: spent,
        isOverBudget: amount > 0 && spent > amount,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
    };
}

// Get user budgets with pagination and filters (kèm spentAmount, isOverBudget, categoryName)
async function getUserBudgetsService(
    filter: BudgetFilter,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedBudgetsResponse> {
    try {
        const skip = (page - 1) * pageSize;
        const query: any = { user: filter.user };

        if (filter.category) query.category = new mongoose.Types.ObjectId(filter.category);
        if (filter.period) query.period = filter.period;
        if (filter.isActive !== undefined) query.isActive = filter.isActive;

        const totalItems = await Budget.countDocuments(query);

        const budgets = await Budget.find(query)
            .populate("category", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        const userId = new mongoose.Types.ObjectId(filter.user);
        const formattedBudgets = await Promise.all(
            budgets.map(async (b: any) => {
                const categoryId = b.category && (b.category._id ?? b.category);
                const spentAmount = await getSpentInRange(
                    userId,
                    categoryId,
                    b.startDate,
                    b.endDate
                );
                const categoryName = b.category && typeof b.category.name === "string" ? b.category.name : undefined;
                return formatBudgetResponse(b, { spentAmount, categoryName });
            })
        );
        return paginate(formattedBudgets, page, pageSize, totalItems);
    } catch (error) {
        throw error;
    }
}

// Get budget by ID (kèm spentAmount, isOverBudget, categoryName)
async function getBudgetByIdService(budgetId: string): Promise<BudgetResponse> {
    try {
        const budget = await Budget.findById(budgetId).populate("category", "name").lean();
        if (!budget) {
            throw new Error("Budget not found");
        }
        const userId = budget.user as mongoose.Types.ObjectId;
        const cat = budget.category as any;
        const categoryId = cat && (cat._id ?? cat);
        const spentAmount = await getSpentInRange(userId, categoryId, budget.startDate, budget.endDate);
        const categoryName = cat && typeof cat.name === "string" ? cat.name : undefined;
        return formatBudgetResponse(budget, { spentAmount, categoryName });
    } catch (error) {
        throw error;
    }
}

// Create new budget
async function createBudgetService(data: CreateBudgetData): Promise<BudgetResponse> {
    try {
        // Validate date range
        if (data.startDate >= data.endDate) {
            throw new Error('Start date must be before end date');
        }
        
        const budget = new Budget({
            amount: data.amount,
            category: new mongoose.Types.ObjectId(data.category),
            period: data.period,
            startDate: data.startDate,
            endDate: data.endDate,
            user: new mongoose.Types.ObjectId(data.user),
            isActive: data.isActive !== undefined ? data.isActive : true,
        });
        
        const saved = await budget.save();
        return formatBudgetResponse(saved);
    } catch (error) {
        throw error;
    }
}

// Update budget
async function updateBudgetService(budgetId: string, data: UpdateBudgetData): Promise<BudgetResponse> {
    try {
        const budget = await Budget.findById(budgetId);
        if (!budget) {
            throw new Error('Budget not found');
        }
        
        // Validate date range if dates are being updated
        const startDate = data.startDate !== undefined ? data.startDate : budget.startDate;
        const endDate = data.endDate !== undefined ? data.endDate : budget.endDate;
        
        if (startDate >= endDate) {
            throw new Error('Start date must be before end date');
        }
        
        const update: any = {};
        if (data.amount !== undefined) update.amount = data.amount;
        if (data.category !== undefined) update.category = new mongoose.Types.ObjectId(data.category);
        if (data.period !== undefined) update.period = data.period;
        if (data.startDate !== undefined) update.startDate = data.startDate;
        if (data.endDate !== undefined) update.endDate = data.endDate;
        if (data.isActive !== undefined) update.isActive = data.isActive;
        
        const updated = await Budget.findByIdAndUpdate(budgetId, update, { new: true });
        if (!updated) {
            throw new Error('Budget not found');
        }
        
        return formatBudgetResponse(updated);
    } catch (error) {
        throw error;
    }
}

// Delete budget
async function deleteBudgetService(budgetId: string): Promise<{ message: string }> {
    try {
        const budget = await Budget.findByIdAndDelete(budgetId);
        if (!budget) {
            throw new Error('Budget not found');
        }
        return { message: 'Budget deleted successfully' };
    } catch (error) {
        throw error;
    }
}

export {
    getUserBudgetsService,
    getBudgetByIdService,
    createBudgetService,
    updateBudgetService,
    deleteBudgetService
};

