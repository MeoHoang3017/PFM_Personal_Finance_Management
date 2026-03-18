import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}$/, 'Invalid currency code format'],
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'transfer'],
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    notes: {
        type: String,
        trim: true,
        default: '',
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
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

const Transaction = mongoose.model("Transaction", transactionSchema, "transactions");
export default Transaction;