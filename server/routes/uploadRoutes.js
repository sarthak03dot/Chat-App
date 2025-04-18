const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/", auth, upload.single("file"), (req, res) => {
  res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

router.put('/:id/profile', upload.single('profile'), async (req, res) => {
  try {
    const userId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ message: "No profile image uploaded." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profile: req.file.path },  // assuming your schema field is `profile` not `profilePicture`
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Profile picture updated successfully.",
      profile: updatedUser.profile
    });

  } catch (err) {
    console.error("Error updating profile picture:", err);
    res.status(500).json({ message: "Server error while updating profile picture." });
  }
});


module.exports = router;