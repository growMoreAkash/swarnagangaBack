import { Router } from "express";
import * as categoryController from "../controller/catagory.controller.js"

import { protect } from "../middleware/authMiddleware.js";


const catagoryRouter = Router()

catagoryRouter.post('/createCategory',categoryController.createCategory);
catagoryRouter.get('/getCategories', categoryController.getCategories);
catagoryRouter.get('/getCategoryById/:id', categoryController.getCategoryById);
catagoryRouter.put('/updateCategory/:id',  categoryController.updateCategory);
catagoryRouter.delete('/deleteCategory/:id', categoryController.deleteCategory);

export { catagoryRouter }