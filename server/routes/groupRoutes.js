const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const auth = require('../middleware/authMiddleware');

// find all group
router.get('/all', auth, async (req, res) => {
  try {
    const groups = await Group.find({});
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const group = new Group({
      name,
      members: [req.user.userId],
    });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/groups/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.members.includes(req.user.userId)) { // Allow any member to delete for simplicity, or use creator
      // Remove group messages (assuming Chat model exists)
      await Chat.deleteMany({ group: groupId });

      // Remove group from users' recent chats (assuming User model exists)
      await User.updateMany(
        { 'recentChats.groupId': groupId },
        { $pull: { recentChats: { groupId } } }
      );

      // Delete the group
      await Group.findByIdAndDelete(groupId);

      res.json({ message: 'Group deleted successfully' });
    } else {
      return res.status(403).json({ message: 'Unauthorized: You must be a group member' });
    }
  } catch (err) {
    console.error('Delete group error:', err);
    res.status(500).json({ message: 'Server error while deleting group' });
  }
});

module.exports = router;