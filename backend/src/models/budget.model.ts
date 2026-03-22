import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    /** weekly | monthly | yearly: cửa sổ tính theo lịch hiện tại. custom: dùng startDate/endDate. */
    period: {
        type: String,
        enum: ["weekly", "monthly", "yearly", "custom", "daily"],
        required: true,
        default: "monthly",
    },
    /** Bắt buộc khi period === 'custom' (và legacy daily). Với weekly/monthly/yearly có thể để trống. */
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    /** ISO 4217 — hạn mức và tổng chi (spent) so sánh trong đơn vị này. */
    currency: {
        type: String,
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}$/, "Invalid currency code"],
    },
}, {
    timestamps: true,
    versionKey: false,
});

budgetSchema.index({ user: 1, category: 1 }, { unique: true });

const Budget = mongoose.model("Budget", budgetSchema, "budgets");

export default Budget;
