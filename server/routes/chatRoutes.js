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

// router.get("/group/:groupId", auth, async (req, res) => {
//   try {
//     const messages = await Message.find({ group: req.params.groupId }).populate(
//       "sender"
//     );
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });


// DELETE /api/chat/messages/:userId/:recipientId
router.delete('/messages/:userId/:recipientId', async (req, res) => {
  try {
    const { userId, recipientId } = req.params;
    if (req.user._id !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own messages' });
    }

    // Delete messages between the user and recipient
    await Chat.deleteMany({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId }
      ]
    });

    // Update recent chats for both users
    await User.updateOne({ _id: userId }, { $pull: { recentChats: { userId: recipientId } } });
    await User.updateOne({ _id: recipientId }, { $pull: { recentChats: { userId } } });

    res.json({ message: 'Messages deleted successfully' });
  } catch (err) {
    console.error('Delete messages error:', err);
    res.status(500).json({ message: 'Server error while deleting messages' });
  }
});

// DELETE /api/chat/group/:groupId/messages
router.delete('group/:groupId/messages', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if the user is a member (or creator for stricter control)
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized: You must be a group member' });
    }

    // Delete all messages for the group
    await Chat.deleteMany({ group: groupId });

    // Update recent chats for all members
    await User.updateMany(
      { 'recentChats.groupId': groupId },
      { $pull: { recentChats: { groupId } } }
    );

    res.json({ message: 'Group messages deleted successfully' });
  } catch (err) {
    console.error('Delete group messages error:', err);
    res.status(500).json({ message: 'Server error while deleting group messages' });
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

router.delete("/recent/:userId/:recipientId", auth, async (req, res) => {
  try {
    const { userId, recipientId } = req.params;
    if (req.user._id !== userId) {
      return res
        .status(403)
        .json({
          message: "Unauthorized: You can only delete your own recent chats",
        });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.recentChats = user.recentChats.filter(
      (chat) => chat.userId !== recipientId
    );
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
