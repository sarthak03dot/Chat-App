const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

router.get("/messages/:userId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.userId },
      ],
    }).populate("sender");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/messages/:userId/:recipientId", auth, async (req, res) => {
  try {
    const { userId, recipientId } = req.params;
    
    // Validate ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Authorization check
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        message: "Unauthorized: You can only delete your own messages",
      });
    }

    // Delete all messages between these users (both directions)
    const deleteResult = await Message.deleteMany({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId }
      ]
    });

    // Update recent chats for both users
    const updatePromises = [
      User.updateOne(
        { _id: userId },
        { $pull: { recentChats: { userId: recipientId } } }
      ),
      User.updateOne(
        { _id: recipientId },
        { $pull: { recentChats: { userId: userId } } }
      )
    ];

    await Promise.all(updatePromises);

    res.json({ 
      success: true,
      message: "Chat messages cleared successfully",
      deletedCount: deleteResult.deletedCount
    });

  } catch (err) {
    console.error("Delete messages error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while clearing messages",
      error: err.message 
    });
  }
});

// DELETE /api/chat/group/:groupId/messages
router.delete("group/:groupId/messages", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the user is a member (or creator for stricter control)
    if (!group.members.includes(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You must be a group member" });
    }

    // Delete all messages for the group
    await Chat.deleteMany({ group: groupId });

    // Update recent chats for all members
    await User.updateMany(
      { "recentChats.groupId": groupId },
      { $pull: { recentChats: { groupId } } }
    );

    res.json({ message: "Group messages deleted successfully" });
  } catch (err) {
    console.error("Delete group messages error:", err);
    res
      .status(500)
      .json({ message: "Server error while deleting group messages" });
  }
});

router.get("/recent", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId },
        { recipient: req.user.userId },
        { group: { $exists: true } },
      ],
    })
      .populate("sender")
      .populate("group")
      .sort({ timestamp: -1 })
      .limit(10);
    const recentChats = messages.reduce((acc, msg) => {
      if (msg.recipient) {
        const otherUser =
          msg.sender._id.toString() === req.user.userId
            ? msg.recipient
            : msg.sender;
        if (!acc.find((chat) => chat.userId === otherUser._id)) {
          acc.push({
            userId: otherUser._id,
            username: otherUser.username,
            lastMessage: msg.content,
          });
        }
      } else if (msg.group) {
        if (!acc.find((chat) => chat.groupId === msg.group._id)) {
          acc.push({
            groupId: msg.group._id,
            name: msg.group.name,
            lastMessage: msg.content,
          });
        }
      }
      return acc;
    }, []);
    res.json(recentChats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.delete("/recent/:userId/:recipientId", async (req, res) => {
  try {
    const { userId, recipientId } = req.params;
    console.log("userId:", userId);
    console.log("recipientId:", recipientId);

    const user = await User.findById(userId);  // 💡 user ko pehle find karo!

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User recentChats before delete:", user.recentChats);

    const initialLength = user.recentChats.length;

    user.recentChats = user.recentChats.filter(
      (chat) => chat.userId.toString() !== recipientId
    );

    if (user.recentChats.length === initialLength) {
      return res.status(404).json({ message: "Chat not found in recent list" });
    }

    await user.save();

    res.json({ message: "Recent chat deleted Successfully." });
  } catch (err) {
    console.error("Delete recent chat error:", err);
    res
      .status(500)
      .json({ message: "Server error while deleting recent chat" });
  }
});




module.exports = router;
