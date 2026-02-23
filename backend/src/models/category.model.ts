import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true,
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
    },
    icon: {
        type: String,
        trim: true,
        default: '',
    },
    color: {
        type: String,
        trim: true,
        default: '#000000',
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
}, {
    timestamps: true,
    versionKey: false,
});

const Category = mongoose.model("Category", categorySchema, "categories");
export default Category;