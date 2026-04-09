import mongoose from "mongoose";

const tutorialSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    completedSteps: [{
        stepId: {
            type: String,
            required: true,
        },
        completedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    lastViewedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    versionKey: false,
});

const Tutorial = mongoose.model("Tutorial", tutorialSchema, "tutorials");

export default Tutorial;

