// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import io from "socket.io-client";
// import { jwtDecode } from "jwt-decode";

// const socket = io("http://localhost:5000", {
//   transports: ["websocket", "polling"],
// });

// function Dashboard({ token, setToken }) {
//   const [onlineUsers, setOnlineUsers] = useState({});
//   const [recentChats, setRecentChats] = useState([]); // Private chats
//   const [groups, setGroups] = useState([]); // Group chats
//   const [notifications, setNotifications] = useState([]);
//   const [newGroupName, setNewGroupName] = useState("");
//   const navigate = useNavigate();
//   const userId = jwtDecode(token).userId;

//   // Fetch initial data and set up Socket.IO
//   useEffect(() => {
//     // Join Socket.IO
//     socket.emit("join", { userId });

//     // Handle user status
//     socket.on("userStatus", ({ userId, online }) => {
//       setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
//     });

//     // Handle new messages
//     socket.on("receiveMessage", (msg) => {
//       setNotifications((prev) => [
//         ...prev,
//         `New message from ${msg.sender.username}: ${msg.content || "File"}`,
//       ]);
//       // Update recent chats
//       if (msg.recipient) {
//         setRecentChats((prev) => {
//           const updatedChats = prev.filter((chat) => chat.userId !== msg.sender._id);
//           return [
//             {
//               userId: msg.sender._id,
//               username: msg.sender.username,
//               lastMessage: msg.content,
//             },
//             ...updatedChats,
//           ];
//         });
//       } else if (msg.group) {
//         setRecentChats((prev) => {
//           const updatedChats = prev.filter((chat) => chat.groupId !== msg.group);
//           return [
//             {
//               groupId: msg.group,
//               name: `Group ${msg.group}`,
//               lastMessage: msg.content,
//             },
//             ...updatedChats,
//           ];
//         });
//       }
//       if (Notification.permission === "granted") {
//         new Notification(`New message from ${msg.sender.username}`, {
//           body: msg.content || "File received",
//         });
//       }
//     });

//     // Fetch online users
//     const fetchUsers = async () => {
//       try {
//         const { data } = await axios.get("http://localhost:5000/api/users", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const usersStatus = {};
//         data.forEach((user) => {
//           usersStatus[user._id] = user.online;
//         });
//         setOnlineUsers(usersStatus);
//       } catch (err) {
//         console.error("Fetch users error:", err);
//       }
//     };

//     // Fetch recent chats
//     const fetchRecentChats = async () => {
//       try {
//         const { data: privateChats } = await axios.get(
//           "http://localhost:5000/api/chat/recent",
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         setRecentChats(privateChats);
//       } catch (err) {
//         console.error("Fetch chats error:", err);
//       }
//     };

//     // Fetch groups
//     const fetchGroups = async () => {
//       try {
//         const { data } = await axios.get("http://localhost:5000/api/groups", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setGroups(data);
//       } catch (err) {
//         console.error("Fetch groups error:", err);
//       }
//     };

//     fetchUsers();
//     fetchRecentChats();
//     fetchGroups();

//     // Cleanup
//     return () => {
//       socket.disconnect();
//     };
//   }, [token, userId]);

//   // Start private chat
//   const startPrivateChat = (recipientId) => {
//     navigate(`/chat/private/${recipientId}`);
//   };

//   // Join group chat
//   const joinGroupChat = (groupId) => {
//     navigate(`/chat/group/${groupId}`);
//   };

//   // Create group
//   const createGroup = async (e) => {
//     e.preventDefault();
//     try {
//       const { data } = await axios.post(
//         "http://localhost:5000/api/groups",
//         { name: newGroupName },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setGroups((prev) => [...prev, data]);
//       setNewGroupName("");
//     } catch (err) {
//       console.error("Create group error:", err);
//     }
//   };

//   return (
//     <div className="dashboard-content">
//       <section className="notifications">
//         <h2>Notifications</h2>
//         {notifications.length === 0 ? (
//           <p>No new notifications</p>
//         ) : (
//           <ul>
//             {notifications.map((note, idx) => (
//               <li key={idx}>{note}</li>
//             ))}
//           </ul>
//         )}
//       </section>

//       <section className="online-users">
//         <h2>Online Users</h2>
//         <ul>
//           {Object.entries(onlineUsers).map(([id, online]) => (
//             <li
//               key={id}
//               onClick={() => startPrivateChat(id)}
//               className={online ? "online" : "offline"}
//             >
//               User {id} - {online ? "Online" : "Offline"}
//             </li>
//           ))}
//         </ul>
//       </section>

//       <section className="recent-chats">
//         <h2>Recent Chats</h2>
//         <ul>
//           {recentChats.map((chat, idx) => (
//             <li
//               key={idx}
//               onClick={() =>
//                 chat.userId ? startPrivateChat(chat.userId) : joinGroupChat(chat.groupId)
//               }
//             >
//               {chat.username || chat.name}: {chat.lastMessage || "No messages yet"}
//             </li>
//           ))}
//         </ul>
//       </section>

//       <section className="groups">
//         <h2>Groups</h2>
//         <form onSubmit={createGroup} className="create-group">
//           <input
//             type="text"
//             value={newGroupName}
//             onChange={(e) => setNewGroupName(e.target.value)}
//             placeholder="New group name"
//             required
//           />
//           <button type="submit">Create Group</button>
//         </form>
//         <ul>
//           {groups.map((group) => (
//             <li key={group._id} onClick={() => joinGroupChat(group._id)}>
//               {group.name}
//             </li>
//           ))}
//         </ul>
//       </section>
//     </div>
//   );
// }

// export default Dashboard;

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
        const { data } = await axios.get("http://localhost:5000/api/groups/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(data);
        console.log(data);
      } catch (err) {
        console.error("Fetch groups error:", err);
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
      setNewGroupName("");
    } catch (err) {
      console.error("Create group error:", err);
    }
  };

  // Delete recent chat
  const deleteRecentChat = async (recipientId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/chat/recent/${userId}/${recipientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRecentChats((prev) =>
        prev.filter((chat) => chat.userId !== recipientId)
      );
    } catch (err) {
      console.error("Delete recent chat error:", err);
    }
  };

  // Delete group
  const deleteGroup = async (groupId) => {
    try {
      await axios.delete(`http://localhost:5000/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups((prev) => prev.filter((group) => group._id !== groupId));
      setRecentChats((prev) => prev.filter((chat) => chat.groupId !== groupId));
    } catch (err) {
      console.error("Delete group error:", err);
    }
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
                {chat.username || chat.name}:{" "}
                {chat.lastMessage || "No messages yet"}
              </span>
              {chat.userId && (
                <button
                  onClick={() => deleteRecentChat(chat.userId)}
                  className="delete-btn"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="groups">
        <h2>Groups</h2>
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
                <button
                  onClick={() => deleteGroup(group._id)}
                  className="delete-btn"
                >
                  Delete
                </button>
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
