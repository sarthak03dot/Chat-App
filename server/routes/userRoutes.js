const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find().select("username online _id");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("username");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:userId", auth, async (req, res) => {
  const { userId } = req.params;
  const { username, password } = req.body;
  try {
    const user = await User.findById(userId);
    if (username) user.username = username;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: "user updated Successfully." });
  } catch (errr) {
    res.status(400).json({ message: errr.message });
  }
});

module.exports = router;
