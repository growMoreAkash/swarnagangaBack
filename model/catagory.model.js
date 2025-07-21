import mongoose from "mongoose";

export const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        unique: true, 
    },
}, { timestamps: true });

// Add a unique index with collation for case-insensitive uniqueness
categorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } }); // strength: 2 means case-insensitive

const Category = mongoose.model("Category", categorySchema);
export default Category;