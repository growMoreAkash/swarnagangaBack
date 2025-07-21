import { Router } from "express";
import * as productController from "../controller/product.controller.js"
import { uploadSingleImage } from "../middleware/uploadMiddleware.js"
import { protect } from "../middleware/authMiddleware.js";

const productRouter = Router()


productRouter.post('/createProduct', uploadSingleImage, productController.createProduct);
productRouter.get('/getProducts', productController.getProducts);
productRouter.get('/getProductById/:id', productController.getProductById);
productRouter.put('/updateProduct/:id', uploadSingleImage, productController.updateProduct);
productRouter.delete('/deleteProduct/:id', productController.deleteProduct);

export { productRouter }