import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: function(): boolean {
            return !this.googleId;
        },
        minlength: 6,
        maxlength: 100, // bcrypt hashes are 60 chars; 24 was for plain text only
        trim: true,
        select: false,
    },
    //Setting
    theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
    },
    language: {
        type: String,
        default: 'en',
    },
    currency: {
        type: String,
        ref: "Currency.code",
        default: 'USD',
    },
    avatarUrl: {
        type: String,
        trim: true,
        default: '',
    },
    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    // Settings
    moneyFormat: {
        type: String,
        enum: ['standard', 'compact', 'full'],
        default: 'standard',
    },
    dailyReminder: {
        type: Boolean,
        default: false,
    },
    reminderTime: {
        type: String,
        default: '09:00', // HH:mm format
    },
}, {
    timestamps: true,
    versionKey: false,
});

const User = mongoose.model("User", userSchema, "users");

export default User;