

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoute");
const chatRoutes = require("./routes/chatRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const usersRoutes = require("./routes/userRoutes");
const groupsRoutes = require("./routes/groupRoutes");
const User = require("./models/User");
const Message = require("./models/Message");
const Group = require("./models/Group");

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: "10mb" })); 
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
const server = http.createServer(app);
const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/groups", groupsRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => console.log("Error:", err));

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join", async ({ userId }) => {
    try {
      if (!userId) return;
      socket.userId = userId;
      socket.join(userId.toString());
      onlineUsers.set(userId.toString(), socket.id);
      
      // JOIN GROUP ROOMS
      const userGroups = await Group.find({ members: userId });
      userGroups.forEach(g => {
        socket.join(g._id.toString());
        console.log(`User ${userId} joined room ${g._id}`);
      });
      
      await User.findByIdAndUpdate(userId, { online: true });
      io.emit("userStatus", { userId, online: true });
      console.log(`User ${userId} joined`);
    } catch (err) {
      console.error("Join error:", err);
    }
  });

  socket.on("typing", ({ sender, recipient, group }) => {
    if (recipient) {
      io.to(recipient.toString()).emit("typingStatus", { sender, typing: true });
    } else if (group) {
      socket.to(group.toString()).emit("typingStatus", { sender, group, typing: true });
    }
  });

  socket.on("stopTyping", ({ sender, recipient, group }) => {
    if (recipient) {
      io.to(recipient.toString()).emit("typingStatus", { sender, typing: false });
    } else if (group) {
      socket.to(group.toString()).emit("typingStatus", { sender, group, typing: false });
    }
  });

  socket.on("markRead", async ({ messageId, readerId }) => {
    try {
      const message = await Message.findByIdAndUpdate(messageId, { read: true }, { new: true }).populate("sender", "username");
      if (message) {
        io.to(message.sender._id.toString()).emit("messageRead", { messageId, readerId });
      }
    } catch (err) {
      console.error("Mark read error:", err);
    }
  });

  socket.on("sendMessage", async (data) => {
    try {
      console.log("Received sendMessage:", data);
      const message = new Message({ ...data, read: false });
      await message.save();
      
      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "username profile")
        .populate("replyTo", "content sender");

      const senderId = populatedMessage.sender._id.toString();

      if (data.recipient) {
        const recipientId = data.recipient.toString();
        
        // CHECK BLOCKS
        const recipientUser = await User.findById(recipientId);
        if (recipientUser?.blockedUsers?.includes(senderId)) {
          console.log(`Delivery blocked: ${senderId} is blocked by ${recipientId}`);
          socket.emit("error", { message: "Message could not be delivered." });
          return;
        }

        io.to(recipientId).emit("receiveMessage", populatedMessage);
        socket.emit("receiveMessage", populatedMessage);
      } else if (data.group) {
        // Broadcast to group room (excluding the sender)
        socket.to(data.group.toString()).emit("receiveMessage", populatedMessage);
        // Echo back to sender
        socket.emit("receiveMessage", populatedMessage);
      }
    } catch (err) {
      console.error("Send message error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("addReaction", async ({ messageId, userId, emoji }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const existingReactionParams = message.reactions.find(
        r => r.user.toString() === userId && r.emoji === emoji
      );

      if (existingReactionParams) {
        // Toggle off if same emoji
        message.reactions = message.reactions.filter(
          r => !(r.user.toString() === userId && r.emoji === emoji)
        );
      } else {
        // Add
        message.reactions.push({ user: userId, emoji });
      }

      await message.save();
      
      const updatedMessage = await Message.findById(messageId)
        .populate("sender", "username profile")
        .populate("replyTo", "content sender")
        .populate("reactions.user", "username profile");

      if (message.recipient) {
         io.to(message.recipient.toString()).emit("messageUpdated", updatedMessage);
         io.to(message.sender.toString()).emit("messageUpdated", updatedMessage);
      } else if (message.group) {
        const group = await Group.findById(message.group).select("members");
        if (group) {
          group.members.forEach(member => {
            io.to(member.toString()).emit("messageUpdated", updatedMessage);
          });
        }
      }
    } catch(err) {
      console.error("Reaction error", err);
    }
  });

  socket.on("messageDeleted", async ({ messageId, mode }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const deletePayload = { messageId, mode, userId: message.sender };

      if (message.recipient) {
        io.to(message.recipient.toString()).emit("messageDeleted", deletePayload);
        io.to(message.sender.toString()).emit("messageDeleted", deletePayload);
      } else if (message.group) {
        io.to(message.group.toString()).emit("messageDeleted", deletePayload);
      }
    } catch (err) {
      console.error("Socket delete error:", err);
    }
  });

  socket.on("disconnect", async () => {
    try {
      if (socket.userId) {
        console.log("User disconnected:", socket.userId);
        onlineUsers.delete(socket.userId.toString());
        await User.findByIdAndUpdate(socket.userId, { online: false });
        io.emit("userStatus", { userId: socket.userId, online: false });
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  });
});

// Helper function to get username by userId
async function getUsername(userId) {
  try {
    const user = await User.findById(userId).select("username");
    return user ? user.username : "Unknown";
  } catch (err) {
    console.error("Error fetching username:", err);
    return "Unknown";
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is listening on PORT: ${PORT}`);
});
