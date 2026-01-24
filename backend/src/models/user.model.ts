import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        sparse: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 24,
        trim: true,
        select: false,
    }
}, {
    timestamps: true,
    versionKey: false,
});

const User = mongoose.model("User", userSchema, "users");

export default User;