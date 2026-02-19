import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Divider,
  Alert,
  IconButton,
  Avatar,
  Fade,
} from "@mui/material";
import { 
  Users, 
  Plus, 
  Trash2, 
  UserPlus, 
  ArrowRight,
  Hash
} from "lucide-react";
import { styled, alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useUI } from "../context/UIProvider";

const API = process.env.REACT_APP_API || "http://localhost:5000";

const GlassPaper = styled(motion.div)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: "blur(12px)",
  borderRadius: "24px",
  padding: theme.spacing(4),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.shadows[4],
  maxWidth: '800px',
  margin: '0 auto',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: alpha(theme.palette.text.primary, 0.05),
    '& fieldset': { borderColor: 'transparent' },
  },
}));

const GroupCard = styled(ListItem)(({ theme }) => ({
  borderRadius: '16px',
  marginBottom: theme.spacing(2),
  background: alpha(theme.palette.text.primary, 0.03),
  transition: 'all 0.2s ease',
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.05),
    transform: 'translateX(4px)',
  },
}));

const Groups = ({ token }) => {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newMemberId, setNewMemberId] = useState("");
  const { showToast, confirmAction } = useUI();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await axios.get(`${API}/api/groups/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(data);
      } catch (err) {
        showToast("Failed to load groups", "error");
      }
    };
    fetchGroups();
  }, [token, showToast]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/groups`, 
        { name: newGroupName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(prev => [...prev, data]);
      setNewGroupName("");
      showToast("Group created successfully!", "success");
    } catch (err) {
      showToast("Failed to create group", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (groupId) => {
    if (!newMemberId.trim()) return;
    try {
      const { data } = await axios.put(`${API}/api/groups/${groupId}/members`,
        { memberId: newMemberId.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(prev => prev.map(g => g._id === groupId ? { ...g, members: data.group.members } : g));
      setNewMemberId("");
      showToast("Member added successfully!", "success");
    } catch (err) {
      showToast("Failed to add member", "error");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    const isConfirmed = await confirmAction({
        title: "Delete Group Channel?",
        message: "This action cannot be undone. All transmission logs will be lost.",
        confirmText: "Delete Channel",
        severity: "error"
    });

    if (!isConfirmed) return;

    try {
      await axios.delete(`${API}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(prev => prev.filter(g => g._id !== groupId));
      showToast("Group deleted successfully!", "success");
    } catch (err) {
      showToast("Failed to delete group", "error");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <GlassPaper initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: '12px', color: 'white' }}>
            <Users size={24} />
          </Box>
          <Typography variant="h4" fontWeight={800}>Group Conversations</Typography>
        </Box>



        <Box component="form" onSubmit={handleCreateGroup} sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <StyledTextField
            fullWidth
            placeholder="Enter new group name..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <Button 
            variant="contained" 
            type="submit" 
            disabled={isLoading || !newGroupName.trim()}
            startIcon={isLoading ? null : <Plus size={18} />}
            sx={{ px: 4, borderRadius: '12px' }}
          >
            Create
          </Button>
        </Box>

        <Divider sx={{ mb: 4, opacity: 0.5 }} />

        <List sx={{ p: 0 }}>
          {groups.length > 0 ? (
            groups.map((group) => (
              <GroupCard key={group._id}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                    <Hash size={24} />
                  </Avatar>
                  <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/chat/group/${group._id}`)}>
                    <Typography variant="h6" fontWeight={700}>{group.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {group.members?.length || 0} members • Click to join conversation
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                      <StyledTextField
                        size="small"
                        placeholder="Invite User ID"
                        value={newMemberId}
                        onChange={(e) => setNewMemberId(e.target.value)}
                        sx={{ width: 140 }}
                      />
                      <IconButton onClick={() => handleAddMember(group._id)} color="primary">
                        <UserPlus size={20} />
                      </IconButton>
                    </Box>
                    <IconButton onClick={() => handleDeleteGroup(group._id)} color="error">
                      <Trash2 size={20} />
                    </IconButton>
                    <IconButton onClick={() => navigate(`/chat/group/${group._id}`)} color="primary">
                      <ArrowRight size={20} />
                    </IconButton>
                  </Box>
                </Box>
              </GroupCard>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
              <Typography variant="h6">No groups yet</Typography>
              <Typography>Create your first group to start a team conversation!</Typography>
            </Box>
          )}
        </List>
      </GlassPaper>
    </Box>
  );
};

export default Groups;