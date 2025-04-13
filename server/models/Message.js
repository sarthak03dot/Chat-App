const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required:true},
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
  content: { type: String },
  fileUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
