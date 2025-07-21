import Category from '../model/catagory.model.js';
import mongoose from 'mongoose';

export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCategory) {
            return res.status(409).json({ message: 'Category with this name already exists.' });
        }

        const category = await Category.create({ name });
        res.status(201).json({ message: 'Category created successfully!', category });

    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Server error. Could not create category.' });
    }
};

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.status(200).json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error. Could not fetch categories.' });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid category ID format.' });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        res.status(200).json({ category });

    } catch (error) {
        console.error('Error fetching category by ID:', error);
        res.status(500).json({ message: 'Server error. Could not fetch category.' });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid category ID format.' });
        }
        if (!name) {
            return res.status(400).json({ message: 'Category name is required for update.' });
        }

        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, _id: { $ne: id } });
        if (existingCategory) {
            return res.status(409).json({ message: 'Category with this name already exists.' });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        category.name = name;
        await category.save();

        res.status(200).json({ message: 'Category updated successfully!', category });

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Server error. Could not update category.' });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid category ID format.' });
        }
        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        res.status(200).json({ message: 'Category deleted successfully!' });

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error. Could not delete category.' });
    }
};