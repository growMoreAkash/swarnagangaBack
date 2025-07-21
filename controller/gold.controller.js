
import Gold from "../model/gold.model.js";
import mongoose from "mongoose";

export const firstCreategold = async (req, res, next) => {
    try {
        let gold = await Gold.findOne({});

        // Create the document only if it doesn't yet exist
        if (!gold) {
            gold = await Gold.create({ firstCreate: true });
        }

        req.goldId = gold._id;
        return next();

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error occurred",
            error: error.message,
        });
    }
};
export const updateGold = async (req, res) => {
    try {
        const { price } = req.body;
        if (!price) return res.status(404).send("Price not given")

        const updateGold = await Gold.updateOne({ _id: req.goldId }, { price })
        if (!updateGold) return res.status(404).send("Error while updated the gold price")

        return res.status(202).send("Gold Price updated")
    } catch (error) {
        return res.status(404).send("Error " + error)
    }
}
export const getGold = async (req, res) => {
    try {
        const gold = await Gold.findOne({ _id: req.goldId })
        if (!gold) return res.status(404).send("Error while finding the gold price")

        return res.status(202).send({ price: gold.price })
    } catch (error) {
        return res.status(404).send("Error " + error)
    }
}