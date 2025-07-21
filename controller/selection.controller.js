
import Selection from "../model/selection.model.js";
import Product from "../model/product.model.js";
import mongoose from "mongoose";

export const firstCreateSelection = async (req, res, next) => {
    try {
        let selection = await Selection.findOne({});

        // Create the document only if it doesn't yet exist
        if (!selection) {
            selection = await Selection.create({ firstCreate: true });
        }

        req.SelectionId = selection._id;   // store it for the next handler
        return next();                     // ONE single next()

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error occurred",
            error: error.message,
        });
    }
};

const validFields = [
    "bestSeller", "backInStore", "partyWear", "dailyWear",
    "corporateGifting", "giftingByOccasion",
    "earRing", "rings", "bangles", "necklace",
    "weddingEarRing", "weddingRings", "WeddingBangles", "WeddingNecklace", "WeddingMangalSutra"
];

export const addSelection = async (req, res) => {
    try {
        const { type, catagoryId, productId } = req.body;

        console.log(type)
        if (!type || !Array.isArray(productId) || productId.length === 0) {
            return res.status(400).json({ message: "type and productId[] are required" });
        }

        if (!validFields.includes(type)) {
            return res.status(400).json({ message: "Invalid selection type provided" });
        }

        const uniqueIds = [...new Set(productId.map(String))];
        if (uniqueIds.length !== productId.length) {
            return res.status(400).json({ message: "productId array contains duplicates" });
        }
        const products = await Product.find({ _id: { $in: uniqueIds } });
        if (products.length !== uniqueIds.length) {
            return res.status(400).json({ message: "Some products not found" });
        }
        const invalid = products.filter(p => p.category.toString() !== catagoryId);
        if (invalid.length) {
            return res.status(400).json({ message: "All products must belong to the given category" });
        }

        await Selection.updateOne(
            { _id: req.SelectionId },
            { $addToSet: { [type]: { $each: uniqueIds } } }
        );

        const updated = await Selection.findById(req.SelectionId).select(type);

        return res.status(200).json({
            message: `Products added to ${type} successfully`,
            updated: updated[type],        // the array after deduped insert
        });

    } catch (error) {
        console.error("Error in addSelection:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const deleteSelection = async (req, res) => {
    try {
        const { type, productId } = req.body;           // productId: array

        /* basic checks */
        if (!type || !Array.isArray(productId) || productId.length === 0) {
            return res.status(400).json({ message: "type & productId[] are required" });
        }
        if (!validFields.includes(type)) {
            return res.status(400).json({ message: "Invalid selection type" });
        }

        /* pull the ids */
        const result = await Selection.updateOne(
            { _id: req.SelectionId },
            { $pull: { [type]: { $in: productId.map(String) } } }
        );

        return res.status(200).json({
            message: `Removed ${productId.length} item(s) from ${type}`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error in deleteSelection:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const addNewSelection = async (req, res) => {
    try {
        const { type, productId } = req.body;

        if (!type || !Array.isArray(productId) || productId.length === 0) {
            return res.status(400).json({ message: "type & productId[] are required" });
        }
        if (!validFields.includes(type)) {
            return res.status(400).json({ message: "Invalid selection type" });
        }

        /* dedupe payload first */
        const uniqueIds = [...new Set(productId.map(String))];

        /* quick existence check (no category validation here) */
        const count = await Product.countDocuments({ _id: { $in: uniqueIds } });
        if (count !== uniqueIds.length) {
            return res.status(400).json({ message: "Some products not found" });
        }

        /* $addToSet ensures document-level uniqueness */
        await Selection.updateOne(
            { _id: req.SelectionId },
            { $addToSet: { [type]: { $each: uniqueIds } } }
        );

        const updated = await Selection.findById(req.SelectionId).select(type);

        return res.status(200).json({
            message: `Added ${uniqueIds.length} unique item(s) to ${type}`,
            updated: updated[type],
        });
    } catch (error) {
        console.error("Error in addNewSelection:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getSelectionByTypeCatagory = async (req, res) => {
  try {
    /* ---------- 1. read & sanitise input ---------- */
    let { type, catagoryId, page = 1, limit = 20 } = req.body;
    console.log(type)
    console.log(catagoryId)

    if (!type) {
      return res.status(400).json({ message: "type is required" });
    }
    if (!validFields.includes(type)) {
      return res.status(400).json({ message: "Invalid selection type" });
    }

    
    page  = Math.max(parseInt(page,  10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);   // cap at 100
    
    /* ---------- 2. fetch the Selection doc ---------- */
    const sel = await Selection.findById(req.SelectionId).lean();     // lean() => plain JS
    if (!sel) {
        return res.status(404).json({ message: "Selection document not found" });
    }
    
    /* ---------- 3. build ID list ---------- */
    console.log(sel)
    const idObjs = sel[type]?.map(id => new mongoose.Types.ObjectId(id));
    if (idObjs.length === 0) {
        return res.status(200).json({
            page, limit, total: 0, totalPages: 0, count: 0, products: []
        });
    }
    
    /* ---------- 4. create query ---------- */
    console.log("akash")
    const query = { _id: { $in: idObjs } };
    if (catagoryId) {
        if (!mongoose.Types.ObjectId.isValid(catagoryId)) {
            return res.status(400).json({ message: "Invalid catagoryId" });
        }
        query.category = catagoryId;
    }
    
    /* ---------- 5. pagination ---------- */
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("category")                       // remove if you don’t need it
      .skip((page - 1) * limit)
      .limit(limit);

    /* ---------- 6. response ---------- */
    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error in getSelectionByTypeCatagory:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
