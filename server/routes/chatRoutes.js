const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const mongoose = require("mongoose");
const Group = require("../models/Group");

router.get("/messages/:userId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.userId },
      ],
      deletedBy: { $ne: req.user.userId }
    })
    .populate("sender", "username profile")
    .populate("replyTo", "content sender")
    .populate("reactions.user", "username profile");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/group/:groupId", auth, async (req, res) => {
  try {
    const messages = await Message.find({ 
      group: req.params.groupId,
      deletedBy: { $ne: req.user.userId }
    })
      .populate("sender", "username profile")
      .populate("replyTo", "content sender")
      .populate("reactions.user", "username profile");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:messageId/react", auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);
    
    if (!message) return res.status(404).json({ message: "Message not found" });

    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user.userId && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction if already exists (toggle)
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === req.user.userId && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({ user: req.user.userId, emoji });
    }

    await message.save();
    
    // Population for socket/response
    await message.populate("reactions.user", "username profile");
    
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a single message (only by the sender)
router.delete("/message/:messageId", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized: You can only delete your own messages" });
    }
    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ success: true, messageId: req.params.messageId });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/messages/:userId/:recipientId", auth, async (req, res) => {
  try {
    const { userId, recipientId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (req.user.userId !== userId) {
      return res.status(403).json({
        message: "Unauthorized: You can only delete your own messages",
      });
    }

    const deleteResult = await Message.deleteMany({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId }
      ]
    });

    await User.updateMany(
      { _id: { $in: [userId, recipientId] } },
      { $pull: { recentChats: { userId: { $in: [userId, recipientId] } } } }
    );

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

router.delete("/group/:groupId/messages", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(req.user.userId)) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You must be a group member" });
    }

    await Message.deleteMany({ group: groupId });

    res.json({ message: "Group messages deleted successfully" });
  } catch (err) {
    console.error("Delete group messages error:", err);
    res
      .status(500)
      .json({ message: "Server error while deleting group messages" });
  }
});

// NEW Granular Delete
router.post("/message/:messageId/delete", auth, async (req, res) => {
  try {
    const { mode } = req.body; // 'me' or 'everyone'
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (mode === 'everyone') {
      if (message.sender.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Unauthorized: Only sender can delete for everyone" });
      }
      message.isDeletedForEveryone = true;
      message.content = "This message was deleted";
      message.fileUrl = null;
      message.fileType = null;
    } else {
      // mode === 'me'
      if (!message.deletedBy.includes(req.user.userId)) {
        message.deletedBy.push(req.user.userId);
      }
    }
    
    await message.save();
    res.json({ success: true, messageId: message._id, mode });
  } catch (err) {
    res.status(500).json({ message: "Server error during deletion" });
  }
});

// User-specific Clear Chat
router.post("/clear", auth, async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    const currentUserId = req.user.userId;

    let query = {};
    if (groupId) {
      query = { group: groupId };
    } else if (userId) {
      query = {
        $or: [
          { sender: currentUserId, recipient: userId },
          { sender: userId, recipient: currentUserId }
        ]
      };
    } else {
      return res.status(400).json({ message: "Target userId or groupId required" });
    }

    await Message.updateMany(query, {
      $addToSet: { deletedBy: currentUserId }
    });

    res.json({ success: true, message: "Chat cleared for you" });
  } catch (err) {
    res.status(500).json({ message: "Server error clearing chat" });
  }
});

router.get("/conversations", auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const [users, groups] = await Promise.all([
      User.find({ _id: { $ne: currentUserId } }).select("username profile online"),
      Group.find({ members: currentUserId })
    ]);

    const conversations = await Promise.all([
      ...users.map(async (user) => {
        const lastMsg = await Message.findOne({
          $or: [
            { sender: currentUserId, recipient: user._id },
            { sender: user._id, recipient: currentUserId }
          ],
          deletedBy: { $ne: currentUserId }
        }).sort({ timestamp: -1 });

        const unreadCount = await Message.countDocuments({
          sender: user._id,
          recipient: currentUserId,
          read: false,
          deletedBy: { $ne: currentUserId }
        });

        return {
          _id: user._id,
          type: "private",
          display: user.username,
          profile: user.profile,
          online: user.online,
          lastMessage: lastMsg ? {
            content: lastMsg.content,
            timestamp: lastMsg.timestamp,
            isMine: lastMsg.sender.toString() === currentUserId
          } : null,
          unreadCount
        };
      }),
      ...groups.map(async (group) => {
        const lastMsg = await Message.findOne({ 
          group: group._id,
          deletedBy: { $ne: currentUserId }
        })
          .sort({ timestamp: -1 })
          .populate("sender", "username");

        return {
          _id: group._id,
          type: "group",
          display: group.name,
          membersCount: group.members.length,
          lastMessage: lastMsg ? {
            content: lastMsg.content,
            timestamp: lastMsg.timestamp,
            sender: lastMsg.sender?.username || "Unknown",
            isMine: lastMsg.sender?._id.toString() === currentUserId
          } : null,
          unreadCount: 0 
        };
      })
    ]);

    const sorted = conversations.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp) : new Date(0);
      const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp) : new Date(0);
      return timeB - timeA;
    });

    res.json(sorted);
  } catch (err) {
    console.error("Conversations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/activity", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId },
        { recipient: req.user.userId },
        { group: { $in: await Group.find({ members: req.user.userId }).distinct('_id') } } 
      ]
    })
    .sort({ timestamp: -1 })
    .limit(5)
    .populate("sender", "username profile");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching activity" });
  }
});

router.delete("/recent/:userId/:recipientId", auth, async (req, res) => {
  try {
    const { userId, recipientId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
    res.status(500).json({ message: "Server error while deleting recent chat" });
  }
});

// Block a user
router.post("/block/:userId", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: targetUserId }
    });

    res.json({ success: true, message: "User blocked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during blocking" });
  }
});

// Unblock a user
router.post("/unblock/:userId", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: targetUserId }
    });

    res.json({ success: true, message: "User unblocked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during unblocking" });
  }
});

module.exports = router;
