import jwt from 'jsonwebtoken';
import Admin from '../model/admin.model.js';
import User from "../model/user.model.js"

export const protect = async (req, res, next) => {
    console.log("akask1")
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const admin = await Admin.findById(decoded.id);
            if (!admin) return res.status(404).send("Admin not found")

            next();
        } catch (err) {
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

export const decodeUserToken = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id);
            next();
        } catch (err) {
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};