import mongoose from "mongoose";

export const GoldSchema = await mongoose.Schema({
    price: {
        type: Number,
        min: 0
    },
    firstCreate: { type: Boolean }
})

export default mongoose.model("Gold", GoldSchema)