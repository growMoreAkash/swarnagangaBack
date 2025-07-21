import mongoose from "mongoose";

const product = {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
}

export const SelectionSchema = await mongoose.Schema({
    bestSeller: [product],
    backInStore: [product],
    partyWear: [product],
    dailyWear: [product],
    corporateGifting: [product],
    giftingByOccasion: [product],
    earRing: [product],
    rings: [product],
    bangles: [product],
    necklace: [product],
    weddingEarRing: [product],
    weddingRings: [product],
    WeddingBangles: [product],
    WeddingNecklace: [product],
    WeddingMangalSutra: [product],

    firstCreate: { type: Boolean }
})

export default mongoose.model("Selection", SelectionSchema)