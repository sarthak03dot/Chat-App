const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, "Please use a valid phone number"],
  },
  profile: { type: String },
  password: { type: String, required: true },

  online: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
