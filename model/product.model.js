// --- models/Product.js ---
import mongoose from "mongoose";

export const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
    },
    category: { // Changed to singular `category` to align with schema name
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // Reference to the Category model
        required: [true, "Product must belong to a category"],
    },
    photo: {
        type: String, // Store photo as a URL string
        required: [true, "Product photo is required"],
    },
    description: {
        type: String,
        required: [true, "Product description is required"],
        trim: true,
    },
    price: { // Added price field, assuming products have prices
        type: Number,
        min: 0,
    }
}, { timestamps: true });

// Compound unique index for product name within a category, case-insensitive
productSchema.index({ name: 1, category: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const Product = mongoose.model("Product", productSchema);
export default Product;

