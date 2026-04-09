import Goal from "../models/goal.model";
import { paginate } from "../utils/pagination";
import { GoalResponse, PaginatedGoalsResponse, CreateGoalData, UpdateGoalData } from "../types/goal.type";
import mongoose from "mongoose";

function formatGoalResponse(goal: any): GoalResponse {
    return {
        id: goal._id.toString(),
        title: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        dueDate: goal.dueDate,
        user: goal.user.toString(),
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
    };
}

// Get user goals with pagination
async function getUserGoalsService(
    userId: string,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedGoalsResponse> {
    try {
        const skip = (page - 1) * pageSize;
        const totalItems = await Goal.countDocuments({ user: userId });
        
        const goals = await Goal.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();
        
        const formattedGoals = goals.map(formatGoalResponse);
        return paginate(formattedGoals, page, pageSize, totalItems);
    } catch (error) {
        throw error;
    }
}

// Get goal by ID
async function getGoalByIdService(goalId: string): Promise<GoalResponse> {
    try {
        const goal = await Goal.findById(goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }
        return formatGoalResponse(goal);
    } catch (error) {
        throw error;
    }
}

// Create new goal
async function createGoalService(data: CreateGoalData): Promise<GoalResponse> {
    try {
        const goal = new Goal({
            title: data.title,
            targetAmount: data.targetAmount,
            currentAmount: data.currentAmount || 0,
            dueDate: data.dueDate,
            user: new mongoose.Types.ObjectId(data.user),
        });
        
        const saved = await goal.save();
        return formatGoalResponse(saved);
    } catch (error) {
        throw error;
    }
}

// Update goal
async function updateGoalService(goalId: string, data: UpdateGoalData): Promise<GoalResponse> {
    try {
        const update: any = {};
        if (data.title !== undefined) update.title = data.title;
        if (data.targetAmount !== undefined) update.targetAmount = data.targetAmount;
        if (data.currentAmount !== undefined) update.currentAmount = data.currentAmount;
        if (data.dueDate !== undefined) update.dueDate = data.dueDate;
        
        const goal = await Goal.findByIdAndUpdate(goalId, update, { new: true });
        if (!goal) {
            throw new Error('Goal not found');
        }
        return formatGoalResponse(goal);
    } catch (error) {
        throw error;
    }
}

// Delete goal
async function deleteGoalService(goalId: string): Promise<{ message: string }> {
    try {
        const goal = await Goal.findByIdAndDelete(goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }
        return { message: 'Goal deleted successfully' };
    } catch (error) {
        throw error;
    }
}

export {
    getUserGoalsService,
    getGoalByIdService,
    createGoalService,
    updateGoalService,
    deleteGoalService
};

