import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    targetAmount: {
        type: Number,
        required: true,
        min: [0, 'Target amount must be positive'],
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: [0, 'Current amount cannot be negative'],
    },
    dueDate: {
        type: Date,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, {
    timestamps: true,
    versionKey: false,
});

const Goal = mongoose.model("Goal", goalSchema, "goals");

export default Goal;