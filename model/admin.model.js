import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // Import bcrypt for pre-save 


export const AdminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, 
    },
    password: {
        type: String,
        required: true, 
        minlength: 6, 
    }
}, { timestamps: true }); 

AdminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

AdminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;