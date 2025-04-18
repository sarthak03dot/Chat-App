import axios from "axios";
// import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const API = process.env.REACT_APP_API;

const Groups = ({ token, setToken }) => {
  const [recentChats,setRecentChats] = useState([]); // Private chats
  const [groups, setGroups] = useState([]); // Group chats
  const [newGroupName, setNewGroupName] = useState("");
  const [newMemberId, setNewMemberId] = useState(""); // For adding members
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();
  //   const userId = jwtDecode(token).userId;

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await axios.get(
          `${API}/api/groups/all`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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
      const response = await axios.delete(
        `${API}/api/groups/${groupId}`,
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
    <section className="Groups">
      <div>
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
      </div>
      <form onSubmit={createGroup} className="create-Group">
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
            <li key={group._id} className="Group-item">
              <span onClick={() => joinGroupChat(group._id)}>{group.name}</span>
              <div>
                <button
                  onClick={() => confirmDelete(group._id, group.name)}
                  className="delete-btn"
                >
                  Delete
                </button>
                <input
                  type="text"
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  placeholder="Member ID"
                />
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
  );
};

export default Groups;
