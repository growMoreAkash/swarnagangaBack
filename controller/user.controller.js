import User from "../model/user.model.js";
import otpGenerator from "otp-generator"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import Product from "../model/product.model.js"
import mongoose from "mongoose";

export const sendOtpMiddle = async (req, res, next) => {
    try {
        const { phone, email } = req.body;
        if (!phone || !email) return res.status(400).send("Phone number and email are required");
        const phoneOtp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        const emailOtp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        console.log("object")

        const hashPhoneOtp = await bcrypt.hash(phoneOtp, 12);
        const hashEmailOtp = await bcrypt.hash(emailOtp, 12);

        if (!hashPhoneOtp || !hashEmailOtp) return res.status(500).send("Error while hashing the OTP");

        const phoneOtpExpire = new Date(Date.now() + 5 * 60 * 1000);
        const emailOtpExpire = new Date(Date.now() + 5 * 60 * 1000);

        req.sendOtp = { phoneOtp, emailOtp, hashPhoneOtp, hashEmailOtp, phoneOtpExpire, emailOtpExpire }

        next()

    } catch (error) {
        return res.status(404).send(error)
    }
}

export const signup = async (req, res) => {
    try {
        const { phone, email, fullname, password } = req.body;
        const { phoneOtp, emailOtp, hashPhoneOtp, hashEmailOtp, phoneOtpExpire, emailOtpExpire } = req.sendOtp

        if (!phone || !email || !password || !fullname) return res.status(400).send("Phone email pass fullname is required");

        let user = await User.findOne({ phone, email });

        if (user && user.phoneVerified === true && user.emailVerified === true) {
            return res.status(400).send("User already exists and is verified");
        }

        const hashPassword = await bcrypt.hash(password, 12)
        if (!hashPassword) return res.status(404).send("Error while hashing the password")

        if (!user) {
            user = new User({
                email,
                fullname,
                phone,
                password: hashPassword,
                phoneOtp: hashPhoneOtp,
                emailOtp: hashEmailOtp,
                emailOtpExpire,
                phoneOtpExpire,
                phoneVerified: false,
                emailVerified: false,
            });
            if (!user) return res.status(404).send("Error while creating new user")
        } else {
            user.phoneOtp = hashPhoneOtp;
            user.emailOtp = hashEmailOtp;

            user.phoneOtpExpire = phoneOtpExpire;
            user.emailOtpExpire = emailOtpExpire;
            user.fullname = fullname
            user.password = hashPassword
        }
        console.log(user)
        const save = await user.save();
        console.log(save)


        console.log({ phoneOtp, emailOtp })

        if (!save) return res.status(404).send("Error while saving")

        res.status(200).send({
            message: "OTP sent successfully",
            emailOtp, phoneOtp, userId: user._id
        });
    } catch (error) {
        console.error("Signup Error:", error.message || error);
        res.status(500).send({ error: "Internal server error" });
    }
};

export const verifyUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { phoneOtp, emailOtp } = req.body;

        if (!phoneOtp || !emailOtp) {
            return res.status(400).send("OTP is required");
        }

        if (!id) return res.status(404).send("Id not found")

        const user = await User.findOne({ _id: id });
        if (!user) {
            return res.status(404).send("User not found");
        }


        if ((user.phoneOtpExpire && user.otpExpire < Date.now()) || (user.emailOtpExpire && user.emailOtpExpire < Date.now())) {
            return res.status(400).send("OTP has expired");
        }

        const isMatchPhone = await bcrypt.compare(phoneOtp, user.phoneOtp);
        const isMatchEmail = await bcrypt.compare(emailOtp, user.emailOtp);

        console.log("akash")

        if (!isMatchPhone || !isMatchEmail) {
            return res.status(400).send("Invalid OTP");
        }

        user.phoneVerified = true;
        user.emailVerified = true;
        user.phoneOtp = user.emailOtp = null;
        user.phoneOtpExpire = user.emailOtpExpire = null;

        const token = jwt.sign({ password: user.password, id: user._id, type: "USER" }, process.env.JWT_SECRET)
        if (!token) return res.status(404).send("Error while creating the token")

        await user.save();

        res.status(200).send({ message: "Phone number verified successfully", userId: user._id, token });

    } catch (error) {
        console.error("OTP Verification Error:", error.message || error);
        res.status(500).send({ error: "Internal server error" });
    }

};

export const loginUser = async (req, res) => {
    try {
        const { password, phoneEmail, token } = req.body;

        if ((!password || !phoneEmail) && !token) {
            return res.status(400).send("Empty fields");
        }

        if (token) {
            try {
                const verified = jwt.verify(token, process.env.JWT_SECRET); // Verify token
                const user = await User.findById(verified.id);

                if (!user) {
                    return res.status(404).send("User not found");
                }

                if (!user.emailVerified || !user.phoneVerified) return res.status(404).send("Not verified")

                return res.status(200).send({
                    message: "Auto-login successful"
                });
            } catch (error) {
                console.error("Token Verification Error:", error.message);
                return res.status(401).send("Invalid or expired token");
            }
        }

        const userPhone = await User.findOne({ phone: phoneEmail });
        const userEmail = await User.findOne({ email: phoneEmail });


        if (!userPhone && !userEmail) {
            return res.status(404).send("User not found");
        }

        const condition = !userPhone ? userEmail : userPhone

        if (!condition.emailVerified || !condition.phoneVerified) return res.status(404).send("Not verified")

        console.log(condition.password)

        const isMatch = await bcrypt.compare(password, condition.password);

        if (!isMatch) {
            return res.status(401).send("Invalid password");
        }

        const newToken = jwt.sign({ id: condition._id, type: "USER", phone: condition.phone, email: condition.email, password }, process.env.JWT_SECRET, {
            expiresIn: "5d",
        });

        res.status(200).send({
            message: "Login successful",
            token: newToken,
            user: { id: condition._id, phone: condition.phone, email: condition.email },
        });
    } catch (error) {
        console.error("Login Error:", error.message || error);
        return res.status(500).send("Internal server error");
    }
};

export const sendOtp = async (req, res) => {
    try {
        const { phoneEmail } = req.body;

        const userPhone = await User.findOne({ phone: phoneEmail });
        const userEmail = await User.findOne({ email: phoneEmail });

        if (!userPhone && !userEmail) {
            return res.status(404).send("User not found");
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        const hashOtp = await bcrypt.hash(otp, 12)
        if (!hashOtp) return res.status(404).send("Error while hashing the otp")

        const otpExpire = new Date(Date.now() + 5 * 60 * 1000);

        if (!userPhone) {
            userEmail.emailOtp = userEmail.phoneOtp = hashOtp
            userEmail.emailOtpExpire = userEmail.phoneOtpExpire = otpExpire
            await userEmail.save()
        } else {
            userPhone.emailOtp = userPhone.phoneOtp = hashOtp
            userPhone.emailOtpExpire = userPhone.phoneOtpExpire = otpExpire
            await userPhone.save()
        }
        console.log({ otp })
        return res.status(200).send({ "mess": "otp send", otp })

    } catch (error) {
        return res.status(404).send("Error " + error)
    }
}

export const forgetPassword = async (req, res) => {
    try {
        const { phoneEmail, otp, password } = req.body;
        if (!phoneEmail || !password) return res.status(404).send("empty field")

        const userPhone = await User.findOne({ phone: phoneEmail });
        const userEmail = await User.findOne({ email: phoneEmail });

        if (!userPhone && !userEmail) {
            return res.status(404).send("User not found");
        }

        const condition = !userPhone ? userEmail : userPhone

        const isMatchPhone = await bcrypt.compare(otp, condition.phoneOtp)
        const isMatchEmail = await bcrypt.compare(otp, condition.emailOtp)

        if (!isMatchEmail || !isMatchPhone) return res.status(404).send("invaild otp")

        condition.phoneVerified = true;
        condition.emailVerified = true;
        condition.phoneOtp = condition.emailOtp = null;
        condition.phoneOtpExpire = condition.emailOtpExpire = null;


        const hashed = await bcrypt.hash(password, 12);   // hash the new password
        condition.password = hashed;

        const newToken = jwt.sign({ id: condition._id, type: "USER", password }, process.env.JWT_SECRET, {
            expiresIn: "5d",
        });

        await condition.save()

        res.status(200).send({
            message: "Forget Pass done",
            token: newToken,
            userId: condition._id,
        });


    } catch (error) {
        return res.status(404).send("Error " + error)
    }
}

export const getUser = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).send(user)
    } catch (error) {
        return res.status(404).send("Error while finding the user " + error)
    }
}


export const addToCart = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { productId } = req.body;

        if (!userId) return res.status(404).send("User not found");
        if (!productId) return res.status(400).send("productId is required");
        if (!mongoose.isValidObjectId(productId))
            return res.status(400).send("Invalid productId");

        // 1️⃣ verify product exists (optional but nice to have)
        const exists = await Product.exists({ _id: productId });
        if (!exists) return res.status(404).send("Product not found");

        // 2️⃣ DUPLICATE CHECK – is it already in the cart?
        const already = await User.findOne(
            { _id: userId, "cart.productId": productId },
            { _id: 1 }                       // projection: we only need to know it exists
        );
        if (already) {
            const cart = await User.findById(userId, "cart").lean();
            return res.status(200).send(cart.cart);       // no-op, return current cart
        }

        // 3️⃣ push new item
        const updated = await User.findByIdAndUpdate(
            userId,
            { $push: { cart: { productId } } },
            { new: true, select: "cart" }
        );

        return res.status(200).send(updated.cart);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal error");
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { productIds } = req.body;            // expect array

        if (!userId) return res.status(404).send("User not found");
        if (!Array.isArray(productIds) || productIds.length === 0)
            return res.status(400).send("productIds array is required");

        /* Filter out invalid ObjectIds to avoid Mongo cast errors */
        const validIds = productIds.filter(id => mongoose.isValidObjectId(id));
        if (validIds.length === 0) return res.status(400).send("No valid productIds");

        const updated = await User.findByIdAndUpdate(
            userId,
            { $pull: { cart: { productId: { $in: validIds } } } },
            { new: true }
        ).populate("cart.productId");

        return res.status(200).send(updated.cart);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal error");
    }
};

export const getUserCart = async (req, res) => {
    try {

        const userId = req.user?._id;
        if (!userId) return res.status(404).send("User not found");

        const user = await User.findById(userId).populate({
            path: "cart.productId",      // 1️⃣ populate each product in the cart
            populate: {
                path: "category",          // 2️⃣ within each product, populate its category
            },
        });
        if (!user) return res.status(404).send("User not found");

        return res.status(200).send(user.cart);     // each item ⇒ { _id, productId:{…} }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal error");
    }
};


export const getAllUser = async (req, res) => {
    try {
        //
        console.log("akask4")
        const allUser = await User.find({})

        return res.status(202).send(allUser)
    } catch (error) {
        return res.status(404).send("Error while finding the user " + error)
    }
}

import axios from 'axios'

export const proceedCart = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).send("Unauthorized: User not found");
        }

        const user = await User.findById(userId).populate({
            path: 'cart.productId',
            model: 'Product'
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const { fullname, phone, email, cart } = user;

        if (!cart || cart.length === 0) {
            return res.status(400).send("Your cart is empty.");
        }

        let cartItemsText = "Order Items:\n";
        let totalPrice = 0;
        cart.forEach(item => {
            if (item.productId) {
                cartItemsText += `- ${item.productId.name} - $${item.productId.price}\n`;
                totalPrice += item.productId.price;
            }
        });
        cartItemsText += `\nTotal Price: $${totalPrice.toFixed(2)}`;

        const messageBody = `
*New Order Notification!* 🚚

A new order has been placed.

*Customer Details:*
- *Name:* ${fullname}
- *Phone:* ${phone}
- *Email:* ${email}

*${cartItemsText}*
        `;

        const accessToken = 'EACOdHARCVlkBOzzAHA9W4pnMcQ52h0oDCRpcmGS9C8EBmco0fuZCMpselYR7aHHkRfYjWGRCgkZA1MU76nTIwP1SNSlN5ljeR7B63wZAeLY6ZCtZAJvbPkiohRgieaFQsgagwtT5FXshCZAhAvaZABClCy26sHll7GF0yn0Al3SObjbRvPsZC8HQKudTVbsMLyaMQYQuhNHg0B4sigmhVvASfg3h7dMJMfQZD';
        const fromPhoneNumberId = 105008515720603;
        const recipientPhoneNumber = '+918473919145';

        if (!accessToken || !fromPhoneNumberId || !recipientPhoneNumber) {
            console.error("WhatsApp API environment variables are not set.");
            return res.status(500).send("Server configuration error.");
        }

        const apiUrl = `https://graph.facebook.com/v22.0/${fromPhoneNumberId}/messages`;

        const requestBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientPhoneNumber,
            type: "text",
            text: {
                body: messageBody.trim()
            }
        };

        await axios.post(apiUrl, requestBody, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });


        res.status(200).json({
            success: true,
            message: "Order placed successfully. Notification sent."
        });

    } catch (error) {
        console.error("Error in proceedCart:", error.response ? error.response.data : error.message);
        res.status(500).send("An internal server error occurred.");
    }
};