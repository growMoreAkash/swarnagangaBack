import { updateGold, firstCreategold,getGold } from "../controller/gold.controller.js"
import { Router } from "express"

const goldRouter = Router()

goldRouter.post("/updateGold", firstCreategold, updateGold)
goldRouter.get("/getGold", firstCreategold, getGold)

export {goldRouter}