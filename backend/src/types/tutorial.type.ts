export interface TutorialStep {
    stepId: string;
    completedAt: Date;
}

export interface TutorialResponse {
    id: string;
    user: string;
    isCompleted: boolean;
    completedSteps: TutorialStep[];
    lastViewedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateTutorialData {
    isCompleted?: boolean;
    completedSteps?: Array<{
        stepId: string;
        completedAt?: Date;
    }>;
    lastViewedAt?: Date;
}

