import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    balance: {
        type: Number,
        default: 0,
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

const Wallet = mongoose.model("Wallet", walletSchema, "wallets");

export default Wallet;