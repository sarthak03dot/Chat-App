const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// router.post("/register", async (req, res) => {
//   try {
//     const { username, email, phone, profile, password } = req.body;
//     if (!username || !email || !phone || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }
//     const conflict = await User.findOne({
//       $or: [{ username }, { email }, { phone }],
//     });
//     if (conflict) {
//       let field;
//       if (conflict.username === username) field = "Username";
//       else if (conflict.email === email) field = "Email";
//       else field = "Phone";
//       return res.status(400).json({ message: `${field} already in use` });
//     }

//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(400).json({ message: "Username already exists" });
//     }
//     const existingEmail = await User.findOne({ email });
//     if (existingEmail) {
//       return res.status(400).json({ message: "Email already in use" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({
//       username,
//       email,
//       phone,
//       profile,
//       password: hashedPassword,
//     });
//     await user.save();

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "1h", // Token expires in 1 hour
//     });
//     res.status(201).json({
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         phone: user.phone,
//         profile: user.profile,
//       },
//     });
//     res.status(201).json({ token });
//   } catch (err) {
//     console.error("Register error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });


router.post("/register", async (req, res) => {
  try {
    const { username, email, phone, profile, password } = req.body;
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const conflict = await User.findOne({
      $or: [{ username }, { email }, { phone }],
    });
    if (conflict) {
      let field;
      if (conflict.username === username) field = "Username";
      else if (conflict.email === email) field = "Email";
      else field = "Phone";
      return res.status(400).json({ message: `${field} already in use` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      phone,
      profile,
      password: hashedPassword,
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profile: user.profile,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return res.status(200).json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
