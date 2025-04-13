const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const auth = require("../middleware/authMiddleware");

// find all group
router.get("/all", auth, async (req, res) => {
  try {
    const groups = await Group.find({});
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const group = new Group({
      name,
      members: [req.user.userId],
    });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/:groupId",auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    return res.json({ message: "Group deleted successfully" });
    
  } catch (err) {
    console.error("Delete group error:", err);
    return res.status(500).json({ message: "Server error while deleting group" });
  }
});

router.put('/:groupId/members', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.members = group.members || [];

    // Only add if user is a member
    if (!group.members.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized: You must be a group member' });
    }

    if (group.members.includes(memberId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    group.members.push(memberId);
    await group.save();

    res.json({ message: 'Member added successfully', group });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ message: 'Server error while adding member' });
  }
});


module.exports = router;
