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
  IconButton,
  Avatar,
  Dialog,
  Tooltip,
} from "@mui/material";
import { 
  Users, 
  Plus, 
  Trash2, 
  UserPlus, 
  ArrowRight,
  Hash,
  Search
} from "lucide-react";
import { styled, alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "../context/UIProvider";

const API = process.env.REACT_APP_API || "http://localhost:5000";

const GlassPaper = styled(motion.div)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: "blur(12px)",
  borderRadius: "24px",
  padding: theme.spacing(4),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.shadows[4],
  maxWidth: '860px',
  margin: '0 auto',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2.5, 2),
    borderRadius: '16px',
    margin: '0 8px',
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: alpha(theme.palette.text.primary, 0.05),
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.2) },
    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
  },
}));

const GroupCard = styled(ListItem)(({ theme }) => ({
  borderRadius: '20px',
  marginBottom: theme.spacing(2),
  background: alpha(theme.palette.text.primary, 0.03),
  border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  transition: 'all 0.25s ease',
  padding: theme.spacing(2, 2),
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.05),
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 20px -4px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
  }
}));

// Per-group invite dialog component
function InviteDialog({ open, onClose, groupId, token, onSuccess }) {
  const [searchUser, setSearchUser] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUI();

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(data);
      } catch (err) {
        showToast("Failed to load users", "error");
      }
    };
    fetchUsers();
  }, [open, token, showToast]);

  const handleAdd = async (memberId) => {
    setLoading(true);
    try {
      const { data } = await axios.put(`${API}/api/groups/${groupId}/members`,
        { memberId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Member added successfully!", "success");
      onSuccess(data.group);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add member", "error");
    } finally {
      setLoading(false);
      setSearchUser("");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: '24px', p: 1, minWidth: { xs: '90%', sm: 340 }, backdropFilter: 'blur(30px)' } }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>Add Member</Typography>
        <TextField
          fullWidth
          placeholder="Search users…"
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          autoFocus
          InputProps={{ startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.5 }} /> }}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
        <Box sx={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {users
            .filter(u => u.username.toLowerCase().includes(searchUser.toLowerCase()))
            .map(u => (
              <Box key={u._id} onClick={() => !loading && handleAdd(u._id)} sx={{ p: 1.5, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: alpha('#6366f1', 0.05) } }}>
                <Avatar src={u.profile && `${API}/${u.profile}`} sx={{ width: 36, height: 36 }}>{u.username[0]}</Avatar>
                <Typography fontWeight={700}>{u.username}</Typography>
                <Box sx={{ flex: 1 }} />
                <UserPlus size={16} color="#6366f1" />
              </Box>
            ))
          }
        </Box>
      </Box>
    </Dialog>
  );
}

const Groups = ({ token }) => {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteTarget, setInviteTarget] = useState(null); // { groupId }
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

  const handleDeleteGroup = async (groupId) => {
    const isConfirmed = await confirmAction({
      title: "Delete Group?",
      message: "This action cannot be undone. All messages in this group will be lost.",
      confirmText: "Delete Group",
      severity: "error",
    });
    if (!isConfirmed) return;
    try {
      await axios.delete(`${API}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(prev => prev.filter(g => g._id !== groupId));
      showToast("Group deleted!", "success");
    } catch (err) {
      showToast("Failed to delete group", "error");
    }
  };

  const handleMemberAdded = (groupId, updatedGroup) => {
    setGroups(prev => prev.map(g => g._id === groupId ? { ...g, members: updatedGroup.members } : g));
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 4 }, minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <GlassPaper initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} sx={{ width: '100%' }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
          <Box sx={{ p: 1.2, borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', color: 'white', boxShadow: '0 6px 16px rgba(99,102,241,0.3)' }}>
            <Users size={24} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Group Conversations</Typography>
            <Typography variant="body2" color="text.secondary">{groups.length} group{groups.length !== 1 ? 's' : ''} available</Typography>
          </Box>
        </Box>

        {/* Create group form */}
        <Box component="form" onSubmit={handleCreateGroup} sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
          <StyledTextField
            fullWidth
            placeholder="Enter new group name…"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <Button 
            variant="contained" 
            type="submit" 
            disabled={isLoading || !newGroupName.trim()}
            startIcon={isLoading ? null : <Plus size={18} />}
            sx={{ px: 4, py: { xs: 1.5, sm: 0 }, borderRadius: '12px', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            Create
          </Button>
        </Box>

        <Divider sx={{ mb: 4, opacity: 0.3 }} />

        {/* Group list */}
        <List sx={{ p: 0 }}>
          <AnimatePresence>
            {groups.length > 0 ? (
              groups.map((group, i) => (
                <motion.div
                  key={group._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GroupCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'transparent', background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', width: 52, height: 52, boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}>
                          <Hash size={22} color="white" />
                        </Avatar>
                        <Box sx={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={() => navigate(`/chat/group/${group._id}`)}>
                          <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: '1.1rem' }}>{group.name}</Typography>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.85rem' }}>
                            {group.members?.length || 0} member{(group.members?.length || 0) !== 1 ? 's' : ''} · Click to open
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' }, mt: { xs: 1, sm: 0 } }}>
                        <Tooltip title="Add Member">
                          <IconButton 
                            onClick={() => setInviteTarget({ groupId: group._id })} 
                            sx={{ flex: { xs: 1, sm: 0 }, bgcolor: alpha('#6366f1', 0.08), color: 'primary.main', '&:hover': { bgcolor: alpha('#6366f1', 0.15) }, borderRadius: '12px' }}
                          >
                            <UserPlus size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Chat">
                          <IconButton onClick={() => navigate(`/chat/group/${group._id}`)} sx={{ flex: { xs: 1, sm: 0 }, bgcolor: alpha('#10b981', 0.08), color: '#10b981', '&:hover': { bgcolor: alpha('#10b981', 0.15) }, borderRadius: '12px' }}>
                            <ArrowRight size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Group">
                          <IconButton onClick={() => handleDeleteGroup(group._id)} sx={{ flex: { xs: 1, sm: 0 }, bgcolor: alpha('#ef4444', 0.08), color: 'error.main', '&:hover': { bgcolor: alpha('#ef4444', 0.15) }, borderRadius: '12px' }}>
                            <Trash2 size={20} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </GroupCard>
                </motion.div>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
                <Users size={64} strokeWidth={1} style={{ margin: '0 auto 16px', display: 'block', color: '#6366f1' }} />
                <Typography variant="h6" fontWeight={700}>No groups yet</Typography>
                <Typography color="text.secondary">Create your first group to start a team conversation!</Typography>
              </Box>
            )}
          </AnimatePresence>
        </List>
      </GlassPaper>

      {/* Per-group invite dialog */}
      {inviteTarget && (
        <InviteDialog
          open={!!inviteTarget}
          onClose={() => setInviteTarget(null)}
          groupId={inviteTarget.groupId}
          token={token}
          onSuccess={(updatedGroup) => handleMemberAdded(inviteTarget.groupId, updatedGroup)}
        />
      )}
    </Box>
  );
};

export default Groups;