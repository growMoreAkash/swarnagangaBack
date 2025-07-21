import * as userController from "../controller/user.controller.js"
import { decodeUserToken } from "../middleware/authMiddleware.js"
import { protect } from "../middleware/authMiddleware.js"



import { Router } from "express"

const userRouter = Router()

userRouter.post("/signup", userController.sendOtpMiddle, userController.signup)
userRouter.post("/verifyUser/:id", userController.verifyUser)
userRouter.post("/loginUser", userController.loginUser)
userRouter.post("/sendOtp", userController.sendOtp)
userRouter.post("/forgetPassword", userController.forgetPassword)
userRouter.get("/getUser", decodeUserToken, userController.getUser)

userRouter.post("/addToCart", decodeUserToken, userController.addToCart);
userRouter.delete("/removeFromCart", decodeUserToken, userController.removeFromCart);
userRouter.get("/getUserCart", decodeUserToken, userController.getUserCart);

userRouter.get("/getAllUser", userController.getAllUser);

userRouter.post("/proceedCart", decodeUserToken, userController.proceedCart);


export default userRouter