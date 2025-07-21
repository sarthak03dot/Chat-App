import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  IconButton,
  FormControl,
} from "@mui/material";
import { GroupAdd, Delete, PersonAdd } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const API = process.env.REACT_APP_API;

// Styled components for custom styling
const GroupsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: "800px",
  margin: "0 auto",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const GroupsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
}));

const GroupItem = styled(ListItem)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1.5),
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  borderRadius: theme.shape.borderRadius,
  marginLeft: theme.spacing(1),
}));

const Groups = ({ token, setToken }) => {
  const [recentChats, setRecentChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newMemberId, setNewMemberId] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await axios.get(`${API}/api/groups/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(data);
      } catch (err) {
        console.error("Fetch groups error:", err);
        setMessage({ text: "Failed to load groups", type: "error" });
      }
    };
    fetchGroups();
  }, [token]);

  // Create group
  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${API}/api/groups`,
        { name: newGroupName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups((prev) => [...prev, data]);
      setMessage({
        text: `Group "${newGroupName}" created successfully`,
        type: "success",
      });
      setNewGroupName("");
    } catch (err) {
      console.error("Create group error:", err);
      setMessage({ text: "Failed to create group", type: "error" });
    }
  };

  // Join group chat
  const joinGroupChat = (groupId) => {
    navigate(`/chat/group/${groupId}`);
  };

  // Delete group
  const deleteGroup = async (groupId, name) => {
    try {
      const response = await axios.delete(`${API}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.message.includes("successfully")) {
        setMessage({
          text: `Group "${name}" deleted successfully`,
          type: "success",
        });
        setGroups((prev) => prev.filter((group) => group._id !== groupId));
        setRecentChats((prev) =>
          prev.filter((chat) => !(chat.groupId && chat.groupId === groupId))
        );
        const timer = setTimeout(
          () => setMessage({ text: "", type: "" }),
          3000
        );
        return () => clearTimeout(timer);
      } else {
        setMessage({
          text: response.data.message || "Failed to delete group",
          type: "error",
        });
      }
    } catch (err) {
      let errorMessage = "Network error";
      if (err.response) {
        errorMessage = err.response.data.message || "Failed to delete group";
      } else if (err.request) {
        errorMessage = "No response from server";
      }
      setMessage({ text: errorMessage, type: "error" });
    }
  };

  // Confirm delete
  const confirmDelete = (groupId, name) => {
    if (window.confirm(`Are you sure you want to delete group "${name}"?`)) {
      deleteGroup(groupId, name);
    }
  };

  // Add member to group
  const addMember = async (groupId) => {
    try {
      const response = await axios.put(
        `${API}/api/groups/${groupId}/members`,
        { memberId: newMemberId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({
        text: response.data.message || "Member added successfully",
        type: "success",
      });
      setGroups((prev) =>
        prev.map((group) =>
          group._id === groupId
            ? { ...group, members: response.data.group.members }
            : group
        )
      );
      setNewMemberId("");
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    } catch (err) {
      let errorMessage = "Network error";
      if (err.response) {
        errorMessage = err.response.data.message || "Failed to add member";
      } else if (err.request) {
        errorMessage = "No response from server";
      }
      setMessage({ text: errorMessage, type: "error" });
    }
  };

  return (
    <GroupsContainer>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
        Groups
      </Typography>
      <GroupsPaper>
        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}
        <Box component="form" onSubmit={createGroup} sx={{ mb: 2, display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            label="New group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
            size="small"
          />
          <StyledButton
            variant="contained"
            color="primary"
            type="submit"
            startIcon={<GroupAdd />}
          >
            Create Group
          </StyledButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List>
          {groups.length > 0 ? (
            groups.map((group) => (
              <GroupItem key={group._id}>
                <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <ListItemText
                    primary={group.name}
                    onClick={() => joinGroupChat(group._id)}
                    sx={{ cursor: "pointer" }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                    <FormControl sx={{ minWidth: 120 }}>
                      <TextField
                        size="small"
                        label="Member ID"
                        value={newMemberId}
                        onChange={(e) => setNewMemberId(e.target.value)}
                      />
                    </FormControl>
                    <StyledButton
                      variant="outlined"
                      color="primary"
                      onClick={() => addMember(group._id)}
                      startIcon={<PersonAdd />}
                    >
                      Add
                    </StyledButton>
                    <IconButton
                      color="error"
                      onClick={() => confirmDelete(group._id, group.name)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </GroupItem>
            ))
          ) : (
            <Typography color="textSecondary" sx={{ p: 2 }}>
              No groups available. Create one to get started!
            </Typography>
          )}
        </List>
      </GroupsPaper>
    </GroupsContainer>
  );
};

export default Groups;