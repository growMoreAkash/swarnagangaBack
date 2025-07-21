import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; // Your database connection function
import { protect, admin } from './middleware/authMiddleware.js';
import { uploadSingleImage } from './middleware/uploadMiddleware.js';

// Import controllers
import * as authController from './controllers/authController.js';
import * as categoryController from './controllers/categoryController.js';
import * as productController from './controllers/productController.js';

dotenv.config(); // Load environment variables
connectDB(); // Connect to MongoDB

const app = express();
app.use(express.json()); // Body parser for JSON
app.use('/uploads', express.static('uploads')); // Serve static uploaded files

// Auth Routes
app.post('/api/auth/signup', authController.signUp);
app.post('/api/auth/signup-verify-otp', authController.verifySignupOtp);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/forgot-password-send-otp', authController.forgotPasswordSendOtp);
app.post('/api/auth/forgot-password-reset', authController.forgotPasswordReset);

// Category Routes (Admin Only)
app.post('/api/categories', protect, admin, categoryController.createCategory);
app.get('/api/categories', categoryController.getCategories); // Public read access
app.get('/api/categories/:id', categoryController.getCategoryById); // Public read access
app.put('/api/categories/:id', protect, admin, categoryController.updateCategory);
app.delete('/api/categories/:id', protect, admin, categoryController.deleteCategory);

// Product Routes (Admin for CUD, Public for Get)
// For create/update, use uploadSingleImage middleware before controller
app.post('/api/products', protect, admin, uploadSingleImage, productController.createProduct);
app.get('/api/products', productController.getProducts); // Public read access, supports filters/pagination
app.get('/api/products/:id', productController.getProductById); // Public read access
app.put('/api/products/:id', protect, admin, uploadSingleImage, productController.updateProduct); // Optional: photo re-upload
app.delete('/api/products/:id', protect, admin, productController.deleteProduct);



