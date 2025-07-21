import Admin from "../model/admin.model.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const createAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ username });

    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({ username, password });

    res.status(201).send({
      _id: admin._id,
      username: admin.username,
      token: generateToken(admin._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const isMatch = await admin.matchPassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    res.status(200).json({
      _id: admin._id,
      username: admin.username,
      token: generateToken(admin._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const changePassword = async (req, res) => {
  const {  newPassword } = req.body;
  const adminId = req.admin.id; // From auth middleware

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.password = newPassword; // Will be re-hashed due to pre-save
    await admin.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};