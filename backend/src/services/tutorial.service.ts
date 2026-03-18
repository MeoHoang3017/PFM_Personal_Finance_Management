import Tutorial from "../models/tutorial.model";
import { TutorialResponse, UpdateTutorialData } from "../types/tutorial.type";
import mongoose from "mongoose";

function formatTutorialResponse(tutorial: any): TutorialResponse {
    return {
        id: tutorial._id.toString(),
        user: tutorial.user.toString(),
        isCompleted: tutorial.isCompleted,
        completedSteps: tutorial.completedSteps || [],
        lastViewedAt: tutorial.lastViewedAt,
        createdAt: tutorial.createdAt,
        updatedAt: tutorial.updatedAt,
    };
}

// Get tutorial by user ID
async function getTutorialByUserService(userId: string): Promise<TutorialResponse | null> {
    try {
        const tutorial = await Tutorial.findOne({ user: userId });
        if (!tutorial) {
            return null;
        }
        return formatTutorialResponse(tutorial);
    } catch (error) {
        throw error;
    }
}

// Create or update tutorial for user
async function upsertTutorialService(
    userId: string,
    data: UpdateTutorialData
): Promise<TutorialResponse> {
    try {
        const update: any = {
            lastViewedAt: data.lastViewedAt || new Date(),
        };
        
        if (data.isCompleted !== undefined) {
            update.isCompleted = data.isCompleted;
        }
        
        if (data.completedSteps !== undefined) {
            // Merge completed steps
            const tutorial = await Tutorial.findOne({ user: userId });
            const existingSteps = tutorial?.completedSteps || [];
            const newSteps = data.completedSteps.map(step => ({
                stepId: step.stepId,
                completedAt: step.completedAt || new Date(),
            }));
            
            // Combine and deduplicate by stepId
            const stepMap = new Map();
            existingSteps.forEach((step: any) => {
                stepMap.set(step.stepId, step);
            });
            newSteps.forEach(step => {
                stepMap.set(step.stepId, step);
            });
            
            update.completedSteps = Array.from(stepMap.values());
        }
        
        const tutorial = await Tutorial.findOneAndUpdate(
            { user: userId },
            update,
            { upsert: true, new: true }
        );
        
        return formatTutorialResponse(tutorial);
    } catch (error) {
        throw error;
    }
}

// Mark tutorial step as completed
async function completeTutorialStepService(
    userId: string,
    stepId: string
): Promise<TutorialResponse> {
    try {
        const tutorial = await Tutorial.findOne({ user: userId });
        
        if (!tutorial) {
            // Create new tutorial record
            const newTutorial = new Tutorial({
                user: new mongoose.Types.ObjectId(userId),
                isCompleted: false,
                completedSteps: [{
                    stepId,
                    completedAt: new Date(),
                }],
                lastViewedAt: new Date(),
            });
            const saved = await newTutorial.save();
            return formatTutorialResponse(saved);
        }
        
        // Check if step already completed
        const existingStep = tutorial.completedSteps.find(
            (step: any) => step.stepId === stepId
        );
        
        if (!existingStep) {
            tutorial.completedSteps.push({
                stepId,
                completedAt: new Date(),
            });
        }
        
        tutorial.lastViewedAt = new Date();
        const saved = await tutorial.save();
        
        return formatTutorialResponse(saved);
    } catch (error) {
        throw error;
    }
}

// Mark tutorial as completed
async function completeTutorialService(userId: string): Promise<TutorialResponse> {
    try {
        const tutorial = await Tutorial.findOneAndUpdate(
            { user: userId },
            {
                isCompleted: true,
                lastViewedAt: new Date(),
            },
            { upsert: true, new: true }
        );
        
        return formatTutorialResponse(tutorial);
    } catch (error) {
        throw error;
    }
}

// Reset tutorial (for testing or re-tutorial)
async function resetTutorialService(userId: string): Promise<TutorialResponse> {
    try {
        const tutorial = await Tutorial.findOneAndUpdate(
            { user: userId },
            {
                isCompleted: false,
                completedSteps: [],
                lastViewedAt: new Date(),
            },
            { upsert: true, new: true }
        );
        
        return formatTutorialResponse(tutorial);
    } catch (error) {
        throw error;
    }
}

export {
    getTutorialByUserService,
    upsertTutorialService,
    completeTutorialStepService,
    completeTutorialService,
    resetTutorialService
};

