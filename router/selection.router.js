import { firstCreateSelection, addSelection, deleteSelection, addNewSelection, getSelectionByTypeCatagory } from "../controller/selection.controller.js"
import { Router } from "express"

import { protect } from "../middleware/authMiddleware.js"

const selectionRouter = Router()

selectionRouter.post("/addSelection",  firstCreateSelection, addSelection)
selectionRouter.delete("/deleteSelection",  firstCreateSelection, deleteSelection)
selectionRouter.put("/addNewSelection",  firstCreateSelection, addNewSelection)
selectionRouter.post("/getSelectionByTypeCatagory", firstCreateSelection, getSelectionByTypeCatagory)

export { selectionRouter }