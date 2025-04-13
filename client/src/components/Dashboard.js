import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { jwtDecode } from "jwt-decode";

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

function Dashboard({ token, setToken }) {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [recentChats, setRecentChats] = useState([]); // Private chats
  const [groups, setGroups] = useState([]); // Group chats
  const [notifications, setNotifications] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [newMemberId, setNewMemberId] = useState(""); // For adding members
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();
  const userId = jwtDecode(token).userId;

  // Fetch initial data and set up Socket.IO
  useEffect(() => {
    socket.emit("join", { userId });

    socket.on("userStatus", ({ userId, online }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
    });

    socket.on("receiveMessage", (msg) => {
      setNotifications((prev) => [
        ...prev,
        `New message from ${msg.sender.username}: ${msg.content || "File"}`,
      ]);
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
            },
            ...updatedChats,
          ];
        });
      } else if (msg.group) {
        setRecentChats((prev) => {
          const updatedChats = prev.filter(
            (chat) => chat.groupId !== msg.group
          );
          return [
            {
              groupId: msg.group,
              name: `Group ${msg.group}`,
              lastMessage: msg.content,
            },
            ...updatedChats,
          ];
        });
      }
      if (Notification.permission === "granted") {
        new Notification(`New message from ${msg.sender.username}`, {
          body: msg.content || "File received",
        });
      }
    });

    const fetchUsers = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersStatus = {};
        data.forEach((user) => {
          usersStatus[user._id] = user.online;
        });
        setOnlineUsers(usersStatus);
      } catch (err) {
        console.error("Fetch users error:", err);
      }
    };

    const fetchRecentChats = async () => {
      try {
        const { data: privateChats } = await axios.get(
          "http://localhost:5000/api/chat/recent",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRecentChats(privateChats);
      } catch (err) {
        console.error("Fetch chats error:", err);
      }
    };

    const fetchGroups = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:5000/api/groups/all",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setGroups(data);
        console.log(data);
      } catch (err) {
        console.error({ text: "Fetch groups error:", err, type: "error" });
        setMessage({ text: "Failed to load groups", type: "error" });
      }
    };

    fetchUsers();
    fetchRecentChats();
    fetchGroups();

    return () => {
      socket.disconnect();
    };
  }, [token, userId]);

  // Start private chat
  const startPrivateChat = (recipientId) => {
    navigate(`/chat/private/${recipientId}`);
  };

  // Join group chat
  const joinGroupChat = (groupId) => {
    navigate(`/chat/group/${groupId}`);
  };

  // Create group
  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/groups",
        { name: newGroupName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups((prev) => [...prev, data]);
      setMessage({ text: `Group  created successfully` });
      setNewGroupName("");
    } catch (err) {
      console.error("Create group error:", err);
      setMessage({ text: "Failed to create group", type: "error" });
    }
  };

  const deleteGroup = async (groupId, name) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/groups/${groupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
  const confirmDelete = (groupId, name) => {
    if (window.confirm(`Are you sure you want to delete group "${name}"?`)) {
      deleteGroup(groupId, name);
    }
  };

  const addMember = async (groupId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/groups/${groupId}/members`,
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
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchAllUsers();
  }, [token]);

  const getUserNameById = (id) => {
    const user = users.find((u) => u._id === id);
    return user ? user.username : "User";
  };

  return (
    <div className="dashboard-content">
      <section className="notifications">
        <h2>Notifications</h2>
        {notifications.length === 0 ? (
          <p>No new notifications</p>
        ) : (
          <ul>
            {notifications.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="online-users">
        <h2>Online Users</h2>
        <ul>
          {Object.entries(onlineUsers).map(([id, online]) => (
            <li
              key={id}
              onClick={() => startPrivateChat(id)}
              className={online ? "online" : "offline"}
            >
              User {id} - {online ? "Online" : "Offline"}
            </li>
          ))}
        </ul>
      </section>

      <section className="recent-chats">
        <h2>Recent Chats</h2>
        <ul>
          {recentChats.map((chat, idx) => (
            <li key={idx} className="chat-item">
              <span
                onClick={() =>
                  chat.userId
                    ? startPrivateChat(chat.userId)
                    : joinGroupChat(chat.groupId)
                }
              >
                {chat.username || getUserNameById(userId)}:{" "}
                {chat.lastMessage || "No messages yet"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="groups">
        <h2>Groups</h2>
        {message.text && (
          <div
            className={`message ${
              message.text.includes("successfully")
                ? "success-message"
                : "error-message"
            }`}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={createGroup} className="create-group">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name"
            required
          />
          <button type="submit">Create Group</button>
        </form>
        <ul>
          {groups.length > 0 ? (
            groups.map((group) => (
              <li key={group._id} className="group-item">
                <span onClick={() => joinGroupChat(group._id)}>
                  {group.name}
                </span>
               <div>
               <button
                  onClick={() => confirmDelete(group._id, group.name)}
                  className="delete-btn"
                >
                  Delete
                </button>
               </div>
               <div><input
                  type="text"
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  placeholder="Member ID"
                /></div>
                <div>
                <button
                  onClick={() => addMember(group._id)}
                  className="add-member-btn"
                >
                  Add Member
                </button>
                </div>
              </li>
            ))
          ) : (
            <li>No groups available. Create one to get started!</li>
          )}
        </ul>
      </section>
    </div>
  );
}

export default Dashboard;
