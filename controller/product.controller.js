import Product from '../model/product.model.js';
import Category from '../model/catagory.model.js';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});
export const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
                console.error("Cloudinary upload error:", error);
                return reject(error);
            }
            resolve(result);
        }).end(buffer);
    });
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`Cloudinary deletion result for ${publicId}:`, result);
        return result;
    } catch (error) {
        console.error("Cloudinary deletion error:", error);
        throw error;
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, category: categoryId, description } = req.body;
        const file = req.file; // Multer makes the file available here

        if (!name || !categoryId || !description  || !file) {
            return res.status(400).json({ message: 'All product fields and a photo are required.' });
        }

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID format.' });
        }

        // Check if category exists
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // Check for unique product name within the category (case-insensitive)
        const existingProduct = await Product.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            category: categoryId,
        });
        if (existingProduct) {
            return res.status(409).json({ message: 'Product with this name already exists in this category.' });
        }

        // Upload image to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(file.buffer, {
            folder: 'products', // Optional: folder in your Cloudinary account
            resource_type: 'image',
        });

        if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            return res.status(500).json({ message: 'Failed to upload image to Cloudinary.' });
        }

        const product = await Product.create({
            name,
            category: categoryId,
            description,
            photo: cloudinaryResult.secure_url, // Store Cloudinary URL
            cloudinaryPublicId: cloudinaryResult.public_id, // Store public_id for future deletion
        });

        res.status(201).json({ message: 'Product created successfully!', product });

    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error. Could not create product.' });
    }
};

export const getProducts = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10, sort } = req.query; // Add page, limit, sort, search
        const query = {};
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            populate: { path: 'category', select: 'name' }, // Populate category name
            sort: {}
        };

        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({ message: 'Invalid category ID format.' });
            }
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (sort === 'name_asc') {
            options.sort.name = 1;
        } else if (sort === 'name_desc') {
            options.sort.name = -1;
        } else if (sort === 'price_asc') {
            options.sort.price = 1;
        } else if (sort === 'price_desc') {
            options.sort.price = -1;
        } else {
            options.sort.createdAt = -1; 
        }
        const skip = (options.page - 1) * options.limit;
        const products = await Product.find(query)
                                        .populate(options.populate)
                                        .sort(options.sort)
                                        // .skip(skip)
                                        // .limit(options.limit);

        const totalProducts = await Product.countDocuments(query);

        res.status(200).json({
            products,
            totalProducts,
            currentPage: options.page,
            totalPages: Math.ceil(totalProducts / options.limit),
            limit: options.limit,
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error. Could not fetch products.' });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID format.' });
        }

        const product = await Product.findById(id).populate('category', 'name');

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.status(200).json({ product });

    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Server error. Could not fetch product.' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category: categoryId, description } = req.body;
        const file = req.file; // New photo if uploaded

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID format.' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Validate category if provided
        if (categoryId) {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(400).json({ message: 'Invalid category ID format.' });
            }
            const categoryExists = await Category.findById(categoryId);
            if (!categoryExists) {
                return res.status(404).json({ message: 'Category not found.' });
            }
        }

        // Check for unique product name within the category (case-insensitive) for *other* products
        if (name) {
            const existingProduct = await Product.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                category: categoryId || product.category, // Use new categoryId if provided, else old
                _id: { $ne: id }, // Exclude current product
            });
            if (existingProduct) {
                return res.status(409).json({ message: 'Product with this name already exists in this category.' });
            }
        }

        // Upload new image to Cloudinary if a file is provided
        if (file) {
            // Delete old image from Cloudinary if public_id exists
            if (product.cloudinaryPublicId) {
                await deleteFromCloudinary(product.cloudinaryPublicId);
            }
            const cloudinaryResult = await uploadToCloudinary(file.buffer, { folder: 'products' });
            if (!cloudinaryResult || !cloudinaryResult.secure_url) {
                return res.status(500).json({ message: 'Failed to upload new image to Cloudinary.' });
            }
            product.photo = cloudinaryResult.secure_url;
            product.cloudinaryPublicId = cloudinaryResult.public_id;
        }


        // Update fields
        product.name = name || product.name;
        product.category = categoryId || product.category;
        product.description = description || product.description;

        await product.save();

        res.status(200).json({ message: 'Product updated successfully!', product });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error. Could not update product.' });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID format.' });
        }

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Delete associated product photo from Cloudinary
        if (product.cloudinaryPublicId) {
            await deleteFromCloudinary(product.cloudinaryPublicId);
        }

        res.status(200).json({ message: 'Product deleted successfully!' });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error. Could not delete product.' });
    }
};
