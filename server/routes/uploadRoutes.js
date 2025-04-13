const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/", auth, upload.single("file"), (req, res) => {
  res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;
