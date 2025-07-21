import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // Import bcrypt for pre-save hashing

export const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true, // Phone should be unique for user identification
    },
    email: { // Added email field based on frontend requirements
        type: String,
        required: true,
        unique: true, // Email should also be unique
    },
    password: {
        type: String,
        required: true, // Password is required
        minlength: 6, // Good practice to set a minimum length
    },
    fullname: { type: String, default: "" },

    phoneOtp: { type: String, default: null },
    emailOtp: { type: String, default: null },

    phoneOtpExpire: { type: Date, default: null }, // Changed default to null
    emailOtpExpire: { type: Date, default: null }, // Changed default to null

    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },

    cart: [
        {
            productId: { // Corrected productiId to productId
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        }
    ],
}, { timestamps: true }); // Added timestamps for createdAt/updatedAt


const User = mongoose.model("User", userSchema);
export default User;