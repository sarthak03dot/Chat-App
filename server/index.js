// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const http = require("http");
// const { Server } = require("socket.io");
// const authRoutes = require("./routes/authRoute");
// const chatRoutes = require("./routes/chatRoutes");
// const uploadRoutes = require("./routes/uploadRoutes");
// const User = require("./models/User");
// const Message = require("./models/Message");
// const Group = require("./models/Group");
// const userRoutes = require("./routes/userRoutes");
// const groupRoutes = require("./routes/groupRoutes");
// dotenv.config();

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000", // Corrected to HTTP
//     methods: ["GET", "POST"],
//   },
// });

// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static("uploads")); // Serve uploaded files for multimedia
// app.use("/api/auth", authRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/upload", uploadRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/groups", groupRoutes);

// // MongoDB Connection
// // mongoose
// //   .connect(process.env.MONGO_URI, {
// //     useNewUrlParser: true,
// //     useUnifiedTopology: true,
// //   })
// //   .then(() => {
// //     console.log("MongoDB Connected!");
// //   })
// //   .catch((err) => {
// //     console.log("Error:", err);
// //   });
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected!"))
//   .catch((err) => console.log("Error:", err));
// // Socket.IO Events
// io.on("connection", (socket) => {
//   console.log("User Connected:", socket.id);

//   socket.on("join", async ({ userId }) => {
//     try {
//       socket.join(userId.toString()); // Join a room for private messaging
//       await User.findByIdAndUpdate(userId, { online: true });
//       io.emit("userStatus", { userId, online: true });
//     } catch (err) {
//       console.error("Join error:", err);
//     }
//   });

//   // socket.on("sendMessage", async (data) => {
//   //   try {
//   //     const message = new Message(data);
//   //     await message.save();
//   //     if (data.recipient) {
//   //       // Private message
//   //       io.to(data.recipient.toString()).emit("receiveMessage", message);
//   //       if (
//   //         data.sender &&
//   //         data.sender.toString() !== data.recipient.toString()
//   //       ) {
//   //         socket.emit("receiveMessage", message); // Send to sender only if different
//   //       }
//   //     } else if (data.group) {
//   //       // Group message
//   //       const group = await Group.findById(data.group);
//   //       if (!group) throw new Error('Group not found');
//   //       group.members.forEach((member) => {
//   //         io.to(member.toString()).emit("receiveMessage", message);
//   //       });
//   //     }
//   //   } catch (err) {
//   //     console.error("Send message error:", err);
//   //   }
//   // });

//   // socket.on("sendMessage", async (data) => {
//   //   try {
//   //     const message = new Message(data);
//   //     await message.save();

//   //     if (data.recipient) {
//   //       // Private message: Emit to recipient and sender
//   //       io.to(data.recipient.toString()).emit("receiveMessage", message);
//   //       if (
//   //         data.sender &&
//   //         data.sender.toString() !== data.recipient.toString()
//   //       ) {
//   //         socket.emit("receiveMessage", message); // Send to sender only if different
//   //       }
//   //     } else if (data.group) {
//   //       const group = await Group.findById(data.group).select("members");
//   //       if (!group) throw new Error("Group not found");
//   //       const members = group.members.map((member) => member.toString());
//   //       members.forEach((member) => {
//   //         io.to(member).emit("receiveMessage", message);

//   //         console.log("Emitting to members:", members);
//   //       });
//   //       // Ensure sender (if a member) receives the message
//   //       if (members.includes(data.sender.toString())) {
//   //         socket.emit("receiveMessage", message);
//   //       }
//   //     }
//   //   } catch (err) {
//   //     console.error("Send message error:", err);
//   //     socket.emit("error", { message: "Failed to send message" }); // Notify client of error
//   //   }
//   // });
//   socket.on("sendMessage", async (data) => {
//     try {
//       console.log("Received sendMessage:", data);
//       const message = new Message(data);
//       await message.save();
//       console.log("Message saved:", message._id);

//       if (data.recipient) {
//         io.to(data.recipient.toString()).emit("receiveMessage", message);
//         console.log("Emitted to recipient:", data.recipient);
//         if (
//           data.sender &&
//           data.sender.toString() !== data.recipient.toString()
//         ) {
//           socket.emit("receiveMessage", message);
//           console.log("Emitted to sender:", data.sender);
//         }
//       } else if (data.group) {
//         const group = await Group.findById(data.group).select("members");
//         if (!group) throw new Error("Group not found");
//         const members = group.members || []; // Fallback if members is undefined
//         members.forEach(async (member) => {
//           io.to(member.toString()).emit("receiveMessage", populatedMessage);
//           const memberUsername = await getUsername(member.toString());
//           console.log(`Emitted to member: ${member} (${memberUsername})`);
//         });
//         if (members.includes(data.sender.toString())) {
//           socket.emit("receiveMessage", message);
//           console.log("Emitted to sender (group):", data.sender);
//         }
//       }
//     } catch (err) {
//       console.error("Send message error:", err);
//       socket.emit("error", { message: "Failed to send message" });
//     }
//   });
//   socket.on("disconnect", async () => {
//     try {
//       console.log("User disconnected:", socket.id);
//       const user = await User.findOneAndUpdate(
//         { online: true },
//         { online: false },
//         { new: true }
//       );
//       if (user) {
//         io.emit("userStatus", { userId: user._id, online: false });
//       }
//     } catch (err) {
//       console.error("Disconnect error:", err);
//     }
//   });
// });
// async function getUsername(userId) {
//   try {
//     const user = await User.findById(userId).select('username');
//     return user ? user.username : 'Unknown';
//   } catch (err) {
//     console.error('Error fetching username:', err);
//     return 'Unknown';
//   }
// }
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server is listening on PORT: ${PORT}`);
// });




const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoute');
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const usersRoutes = require('./routes/userRoutes');
const groupsRoutes = require('./routes/groupRoutes');
const User = require('./models/User');
const Message = require('./models/Message');
const Group = require('./models/Group');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/groups', groupsRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected!'))
  .catch((err) => console.log('Error:', err));

io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);

  socket.on('join', async ({ userId }) => {
    try {
      socket.join(userId.toString());
      await User.findByIdAndUpdate(userId, { online: true });
      io.emit('userStatus', { userId, online: true });
      console.log(`User ${userId} joined`);
    } catch (err) {
      console.error('Join error:', err);
    }
  });

  socket.on('sendMessage', async (data) => {
    try {
      console.log('Received sendMessage:', data);
      const message = new Message(data);
      await message.save();
      console.log('Message saved:', message._id);

      // Populate sender to get username
      const populatedMessage = await Message.findById(message._id).populate('sender', 'username');
      const senderUsername = populatedMessage.sender.username;
      const senderId = populatedMessage.sender._id.toString();

      if (data.recipient) {
        const recipientId = data.recipient.toString();
        io.to(recipientId).emit('receiveMessage', populatedMessage);
        console.log(`Emitted to recipient: ${recipientId} (${await getUsername(recipientId)})`);
        if (senderId !== recipientId) {
          socket.emit('receiveMessage', populatedMessage);
          console.log(`Emitted to sender: ${senderId} (${senderUsername})`);
        }
      } else if (data.group) {
        const group = await Group.findById(data.group).select('members');
        if (!group) {
          throw new Error('Group not found');
        }
        const members = group.members || [];
        if (members.length === 0) {
          console.warn(`No members found in group ${data.group}`);
        }
        for (const member of members) {
          const memberId = member.toString();
          if (io.sockets.adapter.rooms.has(memberId)) {
            io.to(memberId).emit('receiveMessage', populatedMessage);
            const memberUsername = await getUsername(memberId);
            console.log(`Emitted to member: ${memberId} (${memberUsername})`);
          } else {
            console.warn(`Member ${memberId} not connected`);
          }
        }
        if (members.includes(senderId)) {
          socket.emit('receiveMessage', populatedMessage);
          console.log(`Emitted to sender (group): ${senderId} (${senderUsername})`);
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', async () => {
    try {
      console.log('User disconnected:', socket.id);
      const user = await User.findOneAndUpdate(
        { online: true },
        { online: false },
        { new: true }
      );
      if (user) {
        io.emit('userStatus', { userId: user._id, online: false });
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  });
});

// Helper function to get username by userId
async function getUsername(userId) {
  try {
    const user = await User.findById(userId).select('username');
    return user ? user.username : 'Unknown';
  } catch (err) {
    console.error('Error fetching username:', err);
    return 'Unknown';
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is listening on PORT: ${PORT}`);
});