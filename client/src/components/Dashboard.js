import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  TextField,
  Paper,
  Grid,
  Alert,
  IconButton,
  Divider,
  Chip,
  FormControl,
  Fade,
  CircularProgress, // Added for loading states
} from "@mui/material";
import {
  GroupAdd,
  Delete,
  PersonAdd,
  Chat,
  Notifications as NotificationsIcon,
  Wifi, // More indicative of online status
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const API = process.env.REACT_APP_API || "http://localhost:5000"; 

const socket = io(`${API}`, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5, 
  reconnectionDelay: 1000, 
});

const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: "1400px",
  margin: "0 auto",
  minHeight: "calc(100vh - 64px)", 
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[4],
  backgroundColor: theme.palette.background.paper,
  transition: "transform 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const GroupItem = styled(ListItem)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    transform: "scale(1.01)",
    transition: "background-color 0.2s, transform 0.2s",
  },
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(1),
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1, 2),
  fontWeight: 500,
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-root": {
    borderRadius: theme.shape.borderRadius,
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  fontWeight: "bold",
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  "& svg": {
    marginRight: theme.spacing(1),
  },
}));

function Dashboard({ token, setToken }) {
  const navigate = useNavigate();
  // Decode userId safely
  const userId = token ? jwtDecode(token).userId : null;

  const [onlineUsers, setOnlineUsers] = useState({});
  const [recentChats, setRecentChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [newMemberId, setNewMemberId] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  const [isAddMemberLoading, setIsAddMemberLoading] = useState(false);

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
      return;
    }

    socket.emit("join", { userId });

    socket.on("userStatus", ({ userId: statusUserId, online }) => {
      setOnlineUsers((prev) => ({ ...prev, [statusUserId]: online }));
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === statusUserId ? { ...user, online } : user
        )
      );
    });

    socket.on("receiveMessage", (msg) => {
      const senderName = msg.sender?.username || "Unknown User";
      const notificationText = `New message from ${senderName}: ${
        msg.content || "File"
      }`;
      setNotifications((prev) => [...prev, notificationText]);

      if (msg.recipient) {
        setRecentChats((prev) => {
          const updatedChats = prev.filter(
            (chat) => chat.userId !== msg.sender._id
          );
          return [
            {
              userId: msg.sender._id,
              username: msg.sender.username,
              lastMessage: msg.content,
              isGroup: false,
            },
            ...updatedChats,
          ];
        });
      } else if (msg.group) {
        setRecentChats((prev) => {
          const updatedChats = prev.filter(
            (chat) => chat.groupId !== msg.group
          );
          const groupName =
            groups.find((g) => g._id === msg.group)?.name ||
            `Group ${msg.group}`;
          return [
            {
              groupId: msg.group,
              name: groupName,
              lastMessage: `${senderName}: ${msg.content}`,
              isGroup: true,
            },
            ...updatedChats,
          ];
        });
      }

      if (Notification.permission === "granted") {
        new Notification(`New message from ${senderName}`, {
          body: msg.content || "File received",
          icon: "/chat-icon.png",
        });
      }
    });

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const fetchInitialData = async () => {
      try {
        const { data: userData } = await axios.get(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersStatus = {};
        userData.forEach((user) => {
          usersStatus[user._id] = user.online;
        });
        setOnlineUsers(usersStatus);
        setUsers(userData);

        const { data: privateChatsData } = await axios.get(
          `${API}/api/chat/recent`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const formattedPrivateChats = privateChatsData.map((chat) => ({
          ...chat,
          isGroup: false,
        }));
        setRecentChats(formattedPrivateChats);

        // Fetch Groups
        const { data: groupsData } = await axios.get(`${API}/api/groups/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(groupsData);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        showMessage("Failed to load dashboard data.", "error");
        if (err.response?.status === 401 || err.response?.status === 403) {
          setToken(null);
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      socket.off("userStatus");
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [token, userId, navigate, showMessage, groups, setToken]);

  const getUserNameById = useCallback(
    (id) => {
      const user = users.find((u) => u._id === id);
      return user ? user.username : "User";
    },
    [users]
  );

  const startPrivateChat = (recipientId) => {
    if (userId === recipientId) {
      showMessage("You cannot chat with yourself.", "info");
      return;
    }
    navigate(`/chat/private/${recipientId}`);
  };

  const joinGroupChat = (groupId) => {
    navigate(`/chat/group/${groupId}`);
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showMessage("Group name cannot be empty.", "warning");
      return;
    }

    setIsGroupLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/api/groups`,
        { name: newGroupName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups((prev) => [...prev, data]);
      showMessage(`Group "${data.name}" created successfully`, "success");
      setNewGroupName("");
    } catch (err) {
      console.error("Create group error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to create group.";
      showMessage(errorMessage, "error");
    } finally {
      setIsGroupLoading(false);
    }
  };

  const deleteGroup = async (groupId, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete group "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.delete(`${API}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.message.includes("successfully")) {
        showMessage(`Group "${name}" deleted successfully`, "success");
        setGroups((prev) => prev.filter((group) => group._id !== groupId));
        setRecentChats((prev) =>
          prev.filter((chat) => !(chat.groupId && chat.groupId === groupId))
        );
      } else {
        showMessage(
          response.data.message || "Failed to delete group. Please try again.",
          "error"
        );
      }
    } catch (err) {
      console.error("Delete group error:", err);
      const errorMessage =
        err.response?.data?.message ||
        "An unexpected error occurred while deleting the group.";
      showMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = async (groupId) => {
    if (!newMemberId.trim()) {
      showMessage("Please enter a member ID.", "warning");
      return;
    }
    if (userId === newMemberId) {
      showMessage("You are already a member of this group.", "info");
      return;
    }
    if (!users.some((u) => u._id === newMemberId.trim())) {
      showMessage("User with this ID does not exist.", "warning");
      return;
    }

    setIsAddMemberLoading(true);
    try {
      const response = await axios.put(
        `${API}/api/groups/${groupId}/members`,
        { memberId: newMemberId.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage(
        response.data.message || "Member added successfully!",
        "success"
      );
      setGroups((prev) =>
        prev.map((group) =>
          group._id === groupId
            ? { ...group, members: response.data.group.members }
            : group
        )
      );
      setNewMemberId("");
    } catch (err) {
      console.error("Add member error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to add member.";
      showMessage(errorMessage, "error");
    } finally {
      setIsAddMemberLoading(false);
    }
  };

  if (!userId) {
    return (
      <DashboardContainer
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 64px)",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading user data...
        </Typography>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Fade in timeout={500}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 4, color: "text.primary" }}
        >
          Your Chat Dashboard
        </Typography>
      </Fade>

      {message.text && (
        <Fade in timeout={500}>
          <Alert severity={message.type} sx={{ mb: 3, borderRadius: 2 }}>
            {message.text}
          </Alert>
        </Fade>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading dashboard data...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Notifications Section */}
          <Grid item xs={12} sm={6} md={4}>
            <Fade in timeout={600}>
              <SectionPaper>
                <SectionHeader variant="h6">
                  <NotificationsIcon />
                  Notifications
                </SectionHeader>
                <Divider sx={{ mb: 2 }} />
                {notifications.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 1 }}>
                    No new notifications
                  </Typography>
                ) : (
                  <List dense>
                    {" "}
                    {notifications.map((note, idx) => (
                      <ListItem key={idx} sx={{ py: 1 }}>
                        <ListItemText primary={note} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </SectionPaper>
            </Fade>
          </Grid>

          {/* Online Users Section */}
          <Grid item xs={12} sm={6} md={4}>
            <Fade in timeout={700}>
              <SectionPaper>
                <SectionHeader variant="h6">
                  <Wifi />
                  Online Users
                </SectionHeader>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {Object.entries(onlineUsers).length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 1 }}>
                      No users currently online.
                    </Typography>
                  ) : (
                    users
                      .filter((user) => onlineUsers[user._id]) // Only show truly online users
                      .map((user) => (
                        <ListItem
                          key={user._id}
                          button
                          onClick={() => startPrivateChat(user._id)}
                          disabled={user._id === userId} // Disable chat with self
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            "&:hover": {
                              bgcolor: "action.hover",
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: onlineUsers[user._id]
                                  ? "success.main"
                                  : "error.main", // Redundant if filtered, but good for safety
                                width: 36,
                                height: 36,
                              }}
                            >
                              {getUserNameById(user._id)[0].toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              user._id === userId
                                ? `${user.username} (You)`
                                : user.username
                            }
                            secondary={
                              onlineUsers[user._id] ? "Online" : "Offline"
                            }
                            primaryTypographyProps={{ fontWeight: 500 }}
                          />
                          <Chip
                            label={onlineUsers[user._id] ? "Online" : "Offline"}
                            color={onlineUsers[user._id] ? "success" : "error"}
                            size="small"
                            sx={{ ml: 2, fontSize: "0.75rem" }}
                          />
                        </ListItem>
                      ))
                  )}
                </List>
              </SectionPaper>
            </Fade>
          </Grid>

          {/* Recent Chats Section */}
          <Grid item xs={12} sm={6} md={4}>
            <Fade in timeout={800}>
              <SectionPaper>
                <SectionHeader variant="h6">
                  <Chat />
                  Recent Chats
                </SectionHeader>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {recentChats.length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 1 }}>
                      No recent chats yet. Start a conversation!
                    </Typography>
                  ) : (
                    recentChats.map((chat, idx) => (
                      <ListItem
                        key={idx}
                        button
                        onClick={() =>
                          chat.isGroup
                            ? joinGroupChat(chat.groupId)
                            : startPrivateChat(chat.userId)
                        }
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: chat.isGroup
                                ? "secondary.main"
                                : "primary.main",
                              width: 36,
                              height: 36,
                            }}
                          >
                            {chat.isGroup
                              ? chat.name[0]?.toUpperCase() || "G"
                              : getUserNameById(
                                  chat.userId
                                )[0]?.toUpperCase() || "U"}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            chat.isGroup
                              ? chat.name
                              : getUserNameById(chat.userId)
                          }
                          secondary={chat.lastMessage || "No messages yet"}
                          primaryTypographyProps={{ fontWeight: 500 }}
                          secondaryTypographyProps={{
                            noWrap: true,
                            textOverflow: "ellipsis",
                          }}
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </SectionPaper>
            </Fade>
          </Grid>

          {/* Groups Section */}
          <Grid item xs={12}>
            <Fade in timeout={900}>
              <SectionPaper>
                <SectionHeader variant="h6">
                  <GroupAdd />
                  Groups
                </SectionHeader>
                <Divider sx={{ mb: 2 }} />
                <Box
                  component="form"
                  onSubmit={createGroup}
                  sx={{
                    mb: 3,
                    display: "flex",
                    gap: 1,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <StyledTextField
                    fullWidth
                    label="New group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                    size="small"
                    variant="outlined"
                    disabled={isGroupLoading} // Disable input while loading
                  />
                  <StyledButton
                    variant="contained"
                    color="primary"
                    type="submit"
                    startIcon={
                      isGroupLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <GroupAdd />
                      )
                    }
                    disabled={isGroupLoading || !newGroupName.trim()}
                    sx={{ minWidth: { xs: "100%", sm: "150px" } }}
                  >
                    {isGroupLoading ? "Creating..." : "Create Group"}
                  </StyledButton>
                </Box>
                <List>
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <GroupItem key={group._id}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            flexDirection: { xs: "column", sm: "row" },
                            gap: { xs: 2, sm: 0 },
                          }}
                        >
                          <ListItemText
                            primary={group.name}
                            onClick={() => joinGroupChat(group._id)}
                            sx={{
                              cursor: "pointer",
                              flex: 1,
                              "& .MuiListItemText-primary": {
                                fontWeight: 500,
                                color: "primary.main",
                                "&:hover": {
                                  color: "primary.light",
                                },
                              },
                            }}
                          />
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexDirection: { xs: "column", sm: "row" },
                              width: { xs: "100%", sm: "auto" },
                            }}
                          >
                            <FormControl
                              sx={{ minWidth: { xs: "100%", sm: 140 } }}
                            >
                              <StyledTextField
                                size="small"
                                label="Member ID"
                                value={newMemberId}
                                onChange={(e) => setNewMemberId(e.target.value)}
                                variant="outlined"
                                disabled={isAddMemberLoading} // Disable input while loading
                              />
                            </FormControl>
                            <StyledButton
                              variant="outlined"
                              color="primary"
                              onClick={() => addMember(group._id)}
                              startIcon={
                                isAddMemberLoading ? (
                                  <CircularProgress size={20} color="inherit" />
                                ) : (
                                  <PersonAdd />
                                )
                              }
                              disabled={
                                isAddMemberLoading || !newMemberId.trim()
                              } // Disable button while loading or if input is empty
                            >
                              {isAddMemberLoading ? "Adding..." : "Add"}
                            </StyledButton>
                            <IconButton
                              color="error"
                              onClick={() => deleteGroup(group._id, group.name)} 
                              disabled={isLoading} 
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </GroupItem>
                    ))
                  ) : (
                    <Typography color="text.secondary" sx={{ p: 2 }}>
                      No groups available. Create one to get started!
                    </Typography>
                  )}
                </List>
              </SectionPaper>
            </Fade>
          </Grid>
        </Grid>
      )}
    </DashboardContainer>
  );
}

export default Dashboard;
