import { Pagination } from "../utils/pagination";

export interface GoalResponse {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    dueDate: Date;
    user: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedGoalsResponse {
    data: GoalResponse[];
    pagination: Pagination;
}

export interface CreateGoalData {
    title: string;
    targetAmount: number;
    currentAmount?: number;
    dueDate: Date;
    user: string;
}

export interface UpdateGoalData {
    title?: string;
    targetAmount?: number;
    currentAmount?: number;
    dueDate?: Date;
}

