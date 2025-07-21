import express from "express";
import {
    createAdmin,
    loginAdmin,
    changePassword,
} from "../controller/admin.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const adminRouter = express.Router();

adminRouter.post("/createAdmin", createAdmin);
adminRouter.post("/loginAdmin", loginAdmin);
adminRouter.put("/changePasswordAdmin", protect, changePassword);

export { adminRouter };