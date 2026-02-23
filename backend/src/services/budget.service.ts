import Budget from "../models/budget.model";
import { paginate } from "../utils/pagination";
import { BudgetResponse, PaginatedBudgetsResponse, CreateBudgetData, UpdateBudgetData, BudgetFilter } from "../types/budget.type";
import mongoose from "mongoose";

function formatBudgetResponse(budget: any): BudgetResponse {
    return {
        id: budget._id.toString(),
        amount: budget.amount,
        category: budget.category.toString(),
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
        user: budget.user.toString(),
        isActive: budget.isActive,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
    };
}

// Get user budgets with pagination and filters
async function getUserBudgetsService(
    filter: BudgetFilter,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedBudgetsResponse> {
    try {
        const skip = (page - 1) * pageSize;
        const query: any = { user: filter.user };
        
        if (filter.category) query.category = filter.category;
        if (filter.period) query.period = filter.period;
        if (filter.isActive !== undefined) query.isActive = filter.isActive;
        
        const totalItems = await Budget.countDocuments(query);
        
        const budgets = await Budget.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();
        
        const formattedBudgets = budgets.map(formatBudgetResponse);
        return paginate(formattedBudgets, page, pageSize, totalItems);
    } catch (error) {
        throw error;
    }
}

// Get budget by ID
async function getBudgetByIdService(budgetId: string): Promise<BudgetResponse> {
    try {
        const budget = await Budget.findById(budgetId);
        if (!budget) {
            throw new Error('Budget not found');
        }
        return formatBudgetResponse(budget);
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

