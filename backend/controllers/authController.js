const User = require('../models/User'); // Check karein agar file ka naam User.js hai toh 'U' capital karein
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register Logic
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt); // Hash password before saving

        const user = await User.create({ username, email, password });
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login Logic
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Pehle check karein ki data aaya bhi hai ya nahi
        if (!email || !password) {
            return res.status(400).json({ message: "Email aur password zaroori hain!" });
        }

        const user = await User.findOne({ email });

        // 2. Agar user nahi mila, toh yahin se return kar dein
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 3. Check karein ki DB mein password field exist karti hai (Illegal Argument fix)
        if (!user.password) {
            return res.status(500).json({ message: "Database mein password nahi mila. User fir se register karein." });
        }

        // 4. Ab compare karein
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 5. Token generation
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ 
            token, 
            user: { id: user._id, username: user.username } 
        });

    } catch (error) {
        console.error("Login Error Details:", error); // Terminal mein check karne ke liye
        res.status(500).json({ message: error.message });
    }
};

// AuthController.js ke niche ye add karein
exports.getMe = async (req, res) => {
    res.json({ message: "User data fetched" });
};

exports.updatePreferences = async (req, res) => {
    res.json({ message: "Preferences updated" });
};