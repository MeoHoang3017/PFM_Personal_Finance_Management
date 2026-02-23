import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error', 'reminder'],
        default: 'info',
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
        default: null,
    },
    redirectType: {
        type: String,
        enum: ['transaction', 'budget', 'wallet', 'goal', 'none'],
        default: 'none',
    },
    redirectId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});

const Notification = mongoose.model("Notification", notificationSchema, "notifications");

export default Notification;

